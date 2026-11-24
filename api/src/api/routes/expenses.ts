import { requirePermission, requireRole } from '@/middlewares/auth';
import { AuditLogService } from '@/services/audit-log';
import { ExpenseService, type ExpenseScope } from '@/services/expense';
import { EXPENSE_DOCUMENT_EXTENSIONS, EXPENSE_DOCUMENT_MAX_BYTES } from '@libs/constants';
import { hasPermission } from '@libs/permissions';
import type { ExpenseFormValues } from '@libs/types';
import { Router, type NextFunction, type Request, type Response } from 'express';
import mime from 'mime';
import multer from 'multer';
import * as path from 'path';
import { Container } from 'typedi';

const route = Router();

const MAX_AMOUNT = 9_999_999_999.99;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FILES_PER_REQUEST = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: EXPENSE_DOCUMENT_MAX_BYTES, files: MAX_FILES_PER_REQUEST },
  // Extension (not the browser-reported MIME type) decides - see files.ts.
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (EXPENSE_DOCUMENT_EXTENSIONS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: pdf, jpg, jpeg, png.'));
    }
  }
});

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', MAX_FILES_PER_REQUEST)(req, res, (error: unknown) => {
    if (!error) {
      return next();
    }

    const message =
      error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum size is 10MB.'
        : (error as Error).message || 'File upload error';

    res.status(400).send({ status: 400, message, success: false });
  });
};

// Every user with Expenses View sees (and, with Edit, edits) every expense;
// delete and reports stay Admin-only via requireRole.
const ALL_EXPENSES: ExpenseScope = { userId: null };

const actorOf = (req: Request) => ({ userId: req.user.userId, username: req.user.username });

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const toAmount = (value: unknown): number | null => {
  const amount = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
    return null;
  }

  return Math.round(amount * 100) / 100;
};

// Returns the cleaned values or a list of problems. The total is never taken
// from the client - the database computes it as excl. VAT + VAT.
const validateExpense = (
  body: Record<string, unknown>
): { values?: ExpenseFormValues; errors: string[] } => {
  const errors: string[] = [];
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

  const supplier = text(body.SupplierName);
  const description = text(body.Description);
  const invoice = text(body.InvoiceNumber);
  const notes = typeof body.Notes === 'string' ? body.Notes : '';
  const amountExcluding = toAmount(body.AmountExcludingVAT ?? 0);
  const vat = toAmount(body.VATAmount ?? 0);

  if (!isValidDate(body.ExpenseDate)) errors.push('Expense date is required (yyyy-MM-dd).');
  if (!supplier) errors.push('Supplier name is required.');
  if (supplier.length > 200) errors.push('Supplier name must be 200 characters or fewer.');
  if (!description) errors.push('Description is required.');
  if (description.length > 1000) errors.push('Description must be 1000 characters or fewer.');
  if (invoice.length > 100) errors.push('Invoice number must be 100 characters or fewer.');
  if (amountExcluding === null) errors.push('Amount excluding VAT must be a number of 0 or more.');
  if (vat === null) errors.push('VAT amount must be a number of 0 or more.');

  if (errors.length) {
    return { errors };
  }

  return {
    errors,
    values: {
      ExpenseDate: body.ExpenseDate as string,
      InvoiceNumber: invoice,
      SupplierName: supplier,
      Description: description,
      AmountExcludingVAT: amountExcluding as number,
      VATAmount: vat as number,
      Notes: notes
    }
  };
};

const audit = (req: Request, action: string, expenseId: number | string, description: string) => {
  Container.get(AuditLogService)
    .log({
      userId: req.user.userId,
      username: req.user.username,
      action,
      entityType: 'Expense',
      entityId: expenseId,
      description,
      ipAddress: req.ip
    })
    .catch(() => undefined);
};

const fail = (res: Response, error: any, fallback: string) =>
  res.status(500).send({ success: false, message: error?.message || fallback });

// Attachments can be added while creating an expense, so either Create or Edit allows it.
const requireAttachWrite = (req: Request, res: Response, next: NextFunction) => {
  if (hasPermission(req.user, 'Expenses', 'Create') || hasPermission(req.user, 'Expenses', 'Edit')) {
    return next();
  }

  res.status(403).json({ message: 'You do not have permission to perform this action.' });
};

const parseReportRange = (req: Request, res: Response): { from: string; to: string } | null => {
  const from = req.query.startDate;
  const to = req.query.endDate;

  if (!isValidDate(from) || !isValidDate(to)) {
    res.status(400).send({ success: false, message: 'startDate and endDate are required (yyyy-MM-dd).' });
    return null;
  }

  if (from > to) {
    res.status(400).send({ success: false, message: 'startDate must be on or before endDate.' });
    return null;
  }

  return { from, to };
};

export default (app: Router) => {
  app.use('/expenses', route);
};

// ---------------------------------------------------------------------------
// Reports (Admin only) - registered before /:id so "reports" is not read as an id.
// ---------------------------------------------------------------------------

// GET /expenses/reports?startDate=&endDate= - MRA Table 2 data for an invoice-date range
route.get('/reports', requireRole('Admin'), async (req: Request, res: Response) => {
  try {
    const range = parseReportRange(req, res);
    if (!range) return;

    const result = await Container.get(ExpenseService).getReport(range.from, range.to);
    res.status(result.success ? 200 : 500).send(result);
  } catch (error) {
    fail(res, error, 'Failed to generate expense report');
  }
});

// GET /expenses/reports/export?startDate=&endDate= - the same report as an .xlsx file
route.get('/reports/export', requireRole('Admin'), async (req: Request, res: Response) => {
  try {
    const range = parseReportRange(req, res);
    if (!range) return;

    const service = Container.get(ExpenseService);
    const report = await service.getReport(range.from, range.to);

    if (!report.success || !report.data) {
      return res.status(500).send(report);
    }

    const buffer = await service.buildReportWorkbook(report.data, range.from, range.to);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Expenses_${range.from}_to_${range.to}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    fail(res, error, 'Failed to export expense report');
  }
});

// GET /expenses/suppliers - distinct supplier names for the filter dropdown
route.get('/suppliers', requirePermission('Expenses', 'View'), async (req: Request, res: Response) => {
  try {
    const result = await Container.get(ExpenseService).getSuppliers(ALL_EXPENSES);
    res.status(200).send(result);
  } catch (error) {
    fail(res, error, 'Failed to fetch suppliers');
  }
});

// GET /expenses/duplicates?supplierName=&invoiceNumber=&excludeId= - warn-only duplicate check
route.get('/duplicates', requirePermission('Expenses', 'View'), async (req: Request, res: Response) => {
  try {
    const supplierName = String(req.query.supplierName || '').trim();
    const invoiceNumber = String(req.query.invoiceNumber || '').trim();
    const excludeId = Number(req.query.excludeId) || 0;

    if (!supplierName || !invoiceNumber) {
      return res.status(200).send({ success: true, status: 200, data: [] });
    }

    const result = await Container.get(ExpenseService).findDuplicates(
      supplierName,
      invoiceNumber,
      excludeId
    );
    res.status(200).send(result);
  } catch (error) {
    fail(res, error, 'Failed to check for duplicates');
  }
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

// GET /expenses - paged + filtered list with totals for the whole filtered set
route.get('/', requirePermission('Expenses', 'View'), async (req: Request, res: Response) => {
  try {
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    if ((fromDate && !isValidDate(fromDate)) || (toDate && !isValidDate(toDate))) {
      return res.status(400).send({ success: false, message: 'fromDate/toDate must be yyyy-MM-dd.' });
    }

    const result = await Container.get(ExpenseService).getExpenses(
      {
        search: String(req.query.search || '').trim() || undefined,
        supplier: String(req.query.supplier || '').trim() || undefined,
        fromDate: fromDate as string | undefined,
        toDate: toDate as string | undefined,
        page: Math.max(Number(req.query.page) || 0, 0),
        pageSize: Math.min(Math.max(Number(req.query.pageSize) || 25, 1), 500),
        sortDir: req.query.sortDir === 'asc' ? 'asc' : 'desc'
      },
      ALL_EXPENSES
    );
    res.status(result.success ? 200 : 500).send(result);
  } catch (error) {
    fail(res, error, 'Failed to fetch expenses');
  }
});

// POST /expenses - create
route.post('/', requirePermission('Expenses', 'Create'), async (req: Request, res: Response) => {
  try {
    const { values, errors } = validateExpense(req.body || {});

    if (!values) {
      return res.status(400).send({ success: false, message: errors.join(' ') });
    }

    const result = await Container.get(ExpenseService).createExpense(values, actorOf(req));

    if (result.success && result.data) {
      audit(
        req,
        'ExpenseCreated',
        result.data.ExpenseId,
        `${values.SupplierName} ${values.InvoiceNumber || '(no invoice no.)'} - Rs ${values.AmountExcludingVAT + values.VATAmount}`
      );
    }

    res.status(result.success ? 201 : result.status).send(result);
  } catch (error) {
    fail(res, error, 'Failed to create expense');
  }
});

// GET /expenses/:id - one expense with its attachments
route.get('/:id', requirePermission('Expenses', 'View'), async (req: Request, res: Response) => {
  try {
    const expenseId = Number(req.params.id);

    if (!Number.isInteger(expenseId)) {
      return res.status(400).send({ success: false, message: 'Invalid expense ID' });
    }

    const result = await Container.get(ExpenseService).getExpense(expenseId, ALL_EXPENSES);

    if (result.success && !result.data) {
      return res.status(404).send({ success: false, message: 'Expense not found' });
    }

    res.status(result.success ? 200 : 500).send(result);
  } catch (error) {
    fail(res, error, 'Failed to fetch expense');
  }
});

// PUT /expenses/:id - update (Admin: any; others: only their own)
route.put('/:id', requirePermission('Expenses', 'Edit'), async (req: Request, res: Response) => {
  try {
    const expenseId = Number(req.params.id);

    if (!Number.isInteger(expenseId)) {
      return res.status(400).send({ success: false, message: 'Invalid expense ID' });
    }

    const { values, errors } = validateExpense(req.body || {});

    if (!values) {
      return res.status(400).send({ success: false, message: errors.join(' ') });
    }

    const result = await Container.get(ExpenseService).updateExpense(
      expenseId,
      values,
      actorOf(req),
      ALL_EXPENSES
    );

    if (result.success) {
      audit(req, 'ExpenseUpdated', expenseId, `${values.SupplierName} ${values.InvoiceNumber || '(no invoice no.)'}`);
    }

    res.status(result.success ? 200 : result.status).send(result);
  } catch (error) {
    fail(res, error, 'Failed to update expense');
  }
});

// DELETE /expenses/:id - soft delete (Admin only)
route.delete('/:id', requireRole('Admin'), async (req: Request, res: Response) => {
  try {
    const expenseId = Number(req.params.id);

    if (!Number.isInteger(expenseId)) {
      return res.status(400).send({ success: false, message: 'Invalid expense ID' });
    }

    const result = await Container.get(ExpenseService).deleteExpense(expenseId, req.user.username);

    if (result.success) {
      audit(req, 'ExpenseDeleted', expenseId, 'Expense marked as deleted');
    }

    res.status(result.success ? 200 : result.status).send(result);
  } catch (error) {
    fail(res, error, 'Failed to delete expense');
  }
});

// ---------------------------------------------------------------------------
// Supporting documents
// ---------------------------------------------------------------------------

// Resolves the expense for the caller (404 if missing or not theirs).
const loadVisibleExpense = async (req: Request, res: Response) => {
  const expenseId = Number(req.params.id);

  if (!Number.isInteger(expenseId)) {
    res.status(400).send({ success: false, message: 'Invalid expense ID' });
    return null;
  }

  const result = await Container.get(ExpenseService).getExpense(expenseId, ALL_EXPENSES);

  if (!result.success || !result.data) {
    res.status(404).send({ success: false, message: 'Expense not found' });
    return null;
  }

  return result.data;
};

// GET /expenses/:id/attachments - list documents
route.get('/:id/attachments', requirePermission('Expenses', 'View'), async (req: Request, res: Response) => {
  try {
    const expense = await loadVisibleExpense(req, res);
    if (!expense) return;

    res.status(200).send({ success: true, status: 200, data: expense.Attachments ?? [] });
  } catch (error) {
    fail(res, error, 'Failed to fetch documents');
  }
});

// POST /expenses/:id/attachments - upload one or more documents (multipart field "files")
route.post(
  '/:id/attachments',
  requireAttachWrite,
  handleUpload,
  async (req: Request, res: Response) => {
    try {
      const expense = await loadVisibleExpense(req, res);
      if (!expense) return;

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];

      if (!files.length) {
        return res.status(400).send({ success: false, message: 'Select at least one document to upload.' });
      }

      const service = Container.get(ExpenseService);
      const uploaded: number[] = [];
      const failed: { fileName: string; message: string }[] = [];

      for (const file of files) {
        const contentType = mime.lookup(file.originalname, 'application/octet-stream');
        const result = await service.addAttachment(expense.ExpenseId, file, contentType, req.user.username);

        if (result.success && result.data) {
          uploaded.push(result.data.AttachmentId);
        } else {
          failed.push({ fileName: file.originalname, message: result.message });
        }
      }

      if (uploaded.length) {
        audit(req, 'ExpenseDocumentUploaded', expense.ExpenseId, `${uploaded.length} document(s) added`);
      }

      res.status(failed.length && !uploaded.length ? 500 : 201).send({
        success: failed.length === 0,
        status: failed.length && !uploaded.length ? 500 : 201,
        message: failed.length
          ? `${uploaded.length} uploaded, ${failed.length} failed: ${failed.map((f) => `${f.fileName} (${f.message})`).join('; ')}`
          : `${uploaded.length} document(s) uploaded`,
        data: { uploaded, failed }
      });
    } catch (error) {
      fail(res, error, 'Failed to upload documents');
    }
  }
);

// GET /expenses/:id/attachments/:attachmentId/download[?inline=1] - file for download / preview
route.get(
  '/:id/attachments/:attachmentId/download',
  requirePermission('Expenses', 'View'),
  async (req: Request, res: Response) => {
    try {
      const expense = await loadVisibleExpense(req, res);
      if (!expense) return;

      const service = Container.get(ExpenseService);
      const attachment = await service.getAttachment(expense.ExpenseId, Number(req.params.attachmentId));

      if (!attachment) {
        return res.status(404).send({ success: false, message: 'Document not found' });
      }

      const file = await service.downloadAttachment(attachment);

      if (!file.success || !file.data) {
        return res.status(file.status).send({ success: false, message: file.message });
      }

      const contentType = attachment.ContentType || mime.lookup(attachment.FileName, 'application/octet-stream');
      const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${attachment.FileName.replace(/["\\\r\n]/g, '_')}"`
      );
      res.send(file.data);
    } catch (error) {
      fail(res, error, 'Failed to download document');
    }
  }
);

// DELETE /expenses/:id/attachments/:attachmentId - remove a document from the expense
// (soft delete; the stored file is kept for audit).
route.delete(
  '/:id/attachments/:attachmentId',
  requireAttachWrite,
  async (req: Request, res: Response) => {
    try {
      const expense = await loadVisibleExpense(req, res);
      if (!expense) return;

      const attachmentId = Number(req.params.attachmentId);
      const result = await Container.get(ExpenseService).deleteAttachment(expense.ExpenseId, attachmentId);

      if (result.success) {
        audit(req, 'ExpenseDocumentRemoved', expense.ExpenseId, `Document ${attachmentId} removed`);
      }

      res.status(result.success ? 200 : result.status).send(result);
    } catch (error) {
      fail(res, error, 'Failed to remove document');
    }
  }
);
