export interface ExpenseAttachment {
  AttachmentId: number;
  FileName: string;
  ContentType?: string | null;
  FileSize?: number | null;
  UploadedBy: string;
  UploadedDate: string;
}

export interface Expense {
  ExpenseId: number;
  // The date on the supplier invoice (yyyy-MM-dd) - NOT the date it was entered.
  ExpenseDate: string;
  InvoiceNumber?: string | null;
  SupplierName: string;
  Description: string;
  AmountExcludingVAT: number;
  VATAmount: number;
  // Always AmountExcludingVAT + VATAmount (computed column in the database).
  TotalInvoiceAmount: number;
  Notes?: string | null;
  CreatedByUserId?: number | null;
  CreatedBy: string;
  CreatedDate: string;
  LastModifiedBy?: string | null;
  LastModifiedDate?: string | null;
  AttachmentCount?: number;
  Attachments?: ExpenseAttachment[];
}

export type Expenses = Expense[];

export interface ExpenseFormValues {
  ExpenseDate: string;
  InvoiceNumber?: string;
  SupplierName: string;
  Description: string;
  AmountExcludingVAT: number;
  VATAmount: number;
  Notes?: string;
}

export interface ExpenseFilters {
  search?: string;
  supplier?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  sortDir?: 'asc' | 'desc';
}

export interface ExpenseListResult {
  Total: number;
  TotalExcludingVAT: number;
  TotalVAT: number;
  TotalIncludingVAT: number;
  Items: Expense[];
}

export interface ExpenseDuplicate {
  ExpenseId: number;
  ExpenseDate: string;
  SupplierName: string;
  InvoiceNumber: string;
  TotalInvoiceAmount: number;
  CreatedBy: string;
}

// One line of the MRA Table 2 style report.
export interface ExpenseReportRow {
  ExpenseId: number;
  InvoiceDate: string;
  InvoiceNumber?: string | null;
  SupplierName: string;
  Description: string;
  AmountExcludingVAT: number;
  VATAmount: number;
  TotalInvoiceAmount: number;
}

export interface ExpenseReport {
  Count: number;
  TotalExcludingVAT: number;
  TotalVAT: number;
  TotalIncludingVAT: number;
  Rows: ExpenseReportRow[];
}
