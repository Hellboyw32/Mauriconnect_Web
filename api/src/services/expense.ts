import { EXPENSE_STORED_PROCEDURES as SP } from '@/constants';
import type { Response } from '@/types';
import { COMPANY_NAME } from '@libs/constants';
import type {
  Expense,
  ExpenseDuplicate,
  ExpenseFilters,
  ExpenseFormValues,
  ExpenseListResult,
  ExpenseReport
} from '@libs/types';
import ExcelJS from 'exceljs';
import { randomBytes } from 'crypto';
import * as path from 'path';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';
import { FTPService } from './ftp';

// Who is asking. userId = null means "everyone's records" (Admin); a number
// restricts every read/write to expenses created by that user.
export interface ExpenseScope {
  userId: number | null;
}

export interface ExpenseActor {
  userId: number;
  username: string;
}

export interface StoredAttachment {
  AttachmentId: number;
  ExpenseId: number;
  FileName: string;
  StoredFileName: string;
  FilePath: string;
  ContentType?: string | null;
  FileSize?: number | null;
}

// spSaveExpense & friends THROW 50020-50029 for business-rule failures. Surface
// the real message (not the generic "Operation failed ... RequestError") and
// map "not found" to 404 and everything else to 400.
const toRuleViolation = <T>(result: Response<T>): Response<T> => {
  const error = result.error as { number?: number; message?: string } | undefined;

  if (result.success || !error?.number || error.number < 50020 || error.number > 50029) {
    return result;
  }

  return { ...result, status: error.number === 50021 ? 404 : 400, message: error.message };
};

// FOR JSON PATH + parseJSON:true hands a single JSON object back as data[0]
// and an array as data[0] too (an array of arrays).
const firstObject = <T>(data: unknown): T | null => {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === 'object' && !Array.isArray(row) ? (row as T) : null;
};

const firstArray = <T>(data: unknown): T[] => {
  const rows = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
  return Array.isArray(rows) ? (rows.filter((row) => row != null) as T[]) : [];
};

const toExcelDate = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const displayDate = (value: string): string => {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

@Service()
export class ExpenseService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  @Inject()
  private readonly ftpService: FTPService;

  async getExpenses(
    filters: ExpenseFilters,
    scope: ExpenseScope
  ): Promise<Response<ExpenseListResult>> {
    const result = await this.mssqlService.requestByStoredProcedure<ExpenseListResult>(
      SP.GET_EXPENSES_JSON,
      [
        {
          'FromDate': filters.fromDate || null,
          'ToDate': filters.toDate || null,
          'Search': filters.search || null,
          'Supplier': filters.supplier || null,
          'CreatedByUserId': scope.userId,
          'Page': filters.page ?? 0,
          'PageSize': filters.pageSize ?? 25,
          'SortDir': filters.sortDir === 'asc' ? 'asc' : 'desc'
        }
      ],
      false
    );

    if (!result.success) {
      return result;
    }

    const data = firstObject<ExpenseListResult>(result.data) ?? {
      Total: 0,
      TotalExcludingVAT: 0,
      TotalVAT: 0,
      TotalIncludingVAT: 0,
      Items: []
    };

    return { ...result, data };
  }

  // null when the expense doesn't exist / is deleted, or - for a scoped
  // (non-admin) caller - when it belongs to someone else.
  async getExpense(expenseId: number, scope: ExpenseScope): Promise<Response<Expense | null>> {
    const result = await this.mssqlService.requestByStoredProcedure<Expense>(
      SP.GET_EXPENSE_JSON,
      [{ 'ExpenseId': expenseId }],
      false
    );

    if (!result.success) {
      return { ...result, data: null };
    }

    const expense = firstObject<Expense>(result.data);
    const visible = expense && (scope.userId === null || expense.CreatedByUserId === scope.userId);

    return { ...result, data: visible ? expense : null };
  }

  async getSuppliers(scope: ExpenseScope): Promise<Response<string[]>> {
    const result = await this.mssqlService.requestByStoredProcedure<{ SupplierName: string }[]>(
      SP.GET_EXPENSE_SUPPLIERS_JSON,
      [{ 'CreatedByUserId': scope.userId }],
      false
    );

    return {
      ...result,
      data: firstArray<{ SupplierName: string }>(result.data).map((row) => row.SupplierName)
    };
  }

  // Warning only - the caller decides what to do with a match.
  async findDuplicates(
    supplierName: string,
    invoiceNumber: string,
    excludeExpenseId = 0
  ): Promise<Response<ExpenseDuplicate[]>> {
    const result = await this.mssqlService.requestByStoredProcedure<ExpenseDuplicate[]>(
      SP.CHECK_EXPENSE_DUPLICATE_JSON,
      [
        {
          'SupplierName': supplierName,
          'InvoiceNumber': invoiceNumber,
          'ExcludeExpenseId': excludeExpenseId
        }
      ],
      false
    );

    return { ...result, data: firstArray<ExpenseDuplicate>(result.data) };
  }

  async createExpense(
    values: ExpenseFormValues,
    actor: ExpenseActor
  ): Promise<Response<{ ExpenseId: number } | null>> {
    const result = toRuleViolation(
      await this.mssqlService.requestByStoredProcedure<{ ExpenseId: number }[]>(
        SP.SAVE_EXPENSE,
        [{ ...this.saveInputs(values, actor), 'Action': 'Add', 'ExpenseId': 0 }]
      )
    );

    const row = Array.isArray(result.data) ? result.data[0] : null;
    return { ...result, data: row ?? null };
  }

  async updateExpense(
    expenseId: number,
    values: ExpenseFormValues,
    actor: ExpenseActor,
    scope: ExpenseScope
  ): Promise<Response> {
    return toRuleViolation(
      await this.mssqlService.requestByStoredProcedure(SP.SAVE_EXPENSE, [
        {
          ...this.saveInputs(values, actor),
          'Action': 'Update',
          'ExpenseId': expenseId,
          'RestrictToUserId': scope.userId
        }
      ])
    );
  }

  async deleteExpense(expenseId: number, login: string): Promise<Response> {
    return toRuleViolation(
      await this.mssqlService.requestByStoredProcedure(SP.DELETE_EXPENSE, [
        { 'ExpenseId': expenseId, 'Login': login }
      ])
    );
  }

  // ---- Attachments ----

  async addAttachment(
    expenseId: number,
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
    contentType: string,
    uploadedBy: string
  ): Promise<Response<{ AttachmentId: number } | null>> {
    const extension = path.extname(file.originalname).toLowerCase();
    const storedFileName = `${Date.now()}-${randomBytes(4).toString('hex')}${extension}`;

    const upload = await this.ftpService.uploadExpenseFile(expenseId, storedFileName, file.buffer);
    if (!upload.success) {
      return { status: upload.status, message: upload.message, success: false, data: null };
    }

    const result = toRuleViolation(
      await this.mssqlService.requestByStoredProcedure<{ AttachmentId: number }[]>(
        SP.ADD_EXPENSE_ATTACHMENT,
        [
          {
            'ExpenseId': expenseId,
            'FileName': path.basename(file.originalname).slice(0, 260),
            'StoredFileName': storedFileName,
            'FilePath': upload.data?.filePath ?? '',
            'ContentType': contentType,
            'FileSize': file.size,
            'UploadedBy': uploadedBy
          }
        ]
      )
    );

    const row = Array.isArray(result.data) ? result.data[0] : null;
    return { ...result, data: row ?? null };
  }

  async getAttachment(expenseId: number, attachmentId: number): Promise<StoredAttachment | null> {
    const result = await this.mssqlService.requestByStoredProcedure<StoredAttachment>(
      SP.GET_EXPENSE_ATTACHMENT_JSON,
      [{ 'AttachmentId': attachmentId, 'ExpenseId': expenseId }],
      false
    );

    return result.success ? firstObject<StoredAttachment>(result.data) : null;
  }

  async downloadAttachment(attachment: StoredAttachment): Promise<Response<Buffer>> {
    return this.ftpService.downloadExpenseFile(attachment.ExpenseId, attachment.StoredFileName);
  }

  async deleteAttachment(expenseId: number, attachmentId: number): Promise<Response> {
    return toRuleViolation(
      await this.mssqlService.requestByStoredProcedure(SP.DELETE_EXPENSE_ATTACHMENT, [
        { 'AttachmentId': attachmentId, 'ExpenseId': expenseId }
      ])
    );
  }

  // ---- Report (MRA Table 2) ----

  async getReport(fromDate: string, toDate: string): Promise<Response<ExpenseReport>> {
    const result = await this.mssqlService.requestByStoredProcedure<ExpenseReport>(
      SP.GET_EXPENSE_REPORT_JSON,
      [{ 'FromDate': fromDate, 'ToDate': toDate }],
      false
    );

    if (!result.success) {
      return result;
    }

    const data = firstObject<ExpenseReport>(result.data) ?? {
      Count: 0,
      TotalExcludingVAT: 0,
      TotalVAT: 0,
      TotalIncludingVAT: 0,
      Rows: []
    };

    return { ...result, data };
  }

  // Professionally formatted workbook for sharing with the VAT preparer.
  async buildReportWorkbook(report: ExpenseReport, fromDate: string, toDate: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = COMPANY_NAME;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Expenses (MRA Table 2)', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    sheet.columns = [
      { key: 'date', width: 14 },
      { key: 'invoice', width: 20 },
      { key: 'supplier', width: 32 },
      { key: 'description', width: 48 },
      { key: 'excl', width: 20 },
      { key: 'vat', width: 16 },
      { key: 'total', width: 20 }
    ];

    const money = '#,##0.00';
    const thin = { style: 'thin' as const, color: { argb: 'FFBFBFBF' } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = COMPANY_NAME;
    sheet.getCell('A1').font = { bold: true, size: 16 };

    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = 'Expense Report - MRA VAT Table 2 (Input Invoices)';
    sheet.getCell('A2').font = { bold: true, size: 12 };

    sheet.mergeCells('A3:G3');
    sheet.getCell('A3').value = `Period: ${displayDate(fromDate)} to ${displayDate(toDate)}`;

    sheet.mergeCells('A4:G4');
    sheet.getCell('A4').value = `Generated: ${displayDate(new Date().toISOString())} (amounts in Mauritian Rupees, Rs)`;
    sheet.getCell('A4').font = { color: { argb: 'FF666666' } };

    const headerRow = sheet.getRow(6);
    headerRow.values = [
      'Invoice Date',
      'Invoice No.',
      'Name of Supplier',
      'Description of Goods/Services',
      'Value Excluding VAT (Rs)',
      'VAT Amount (Rs)',
      'Total Invoice Value (Rs)'
    ];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = border;
    });
    headerRow.height = 32;

    report.Rows.forEach((row) => {
      const added = sheet.addRow({
        date: toExcelDate(row.InvoiceDate),
        invoice: row.InvoiceNumber || '',
        supplier: row.SupplierName,
        description: row.Description,
        excl: row.AmountExcludingVAT,
        vat: row.VATAmount,
        total: row.TotalInvoiceAmount
      });
      added.getCell('date').numFmt = 'dd/mm/yyyy';
      (['excl', 'vat', 'total'] as const).forEach((key) => (added.getCell(key).numFmt = money));
      added.getCell('description').alignment = { wrapText: true, vertical: 'top' };
      added.eachCell((cell) => (cell.border = border));
    });

    const totals = sheet.addRow({
      description: 'TOTAL',
      excl: report.TotalExcludingVAT,
      vat: report.TotalVAT,
      total: report.TotalIncludingVAT
    });
    totals.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true };
      cell.border = border;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    });
    totals.getCell('description').alignment = { horizontal: 'right' };
    (['excl', 'vat', 'total'] as const).forEach((key) => (totals.getCell(key).numFmt = money));

    sheet.views = [{ state: 'frozen', ySplit: 6 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private saveInputs(values: ExpenseFormValues, actor: ExpenseActor) {
    return {
      'ExpenseDate': values.ExpenseDate,
      'InvoiceNumber': values.InvoiceNumber || null,
      'SupplierName': values.SupplierName,
      'Description': values.Description,
      'AmountExcludingVAT': values.AmountExcludingVAT,
      'VATAmount': values.VATAmount,
      'Notes': values.Notes || null,
      'UserId': actor.userId,
      'Login': actor.username,
      'RestrictToUserId': null
    };
  }
}
