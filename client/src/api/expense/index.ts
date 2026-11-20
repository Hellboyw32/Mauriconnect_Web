import { API_ENDPOINTS } from '@libs/constants';
import type {
  Expense,
  ExpenseAttachment,
  ExpenseDuplicate,
  ExpenseFilters,
  ExpenseFormValues,
  ExpenseListResult,
  ExpenseReport
} from '@libs/types';
import axios, { isAxiosError } from 'axios';
import { api } from 'src/services/api.service';

const isOk = (status: number) => status >= 200 && status < 300;

// api.* never rejects on an HTTP error (it returns { status, message }), so a
// failed call would otherwise look like success. Surface the server's message.
const unwrap = <T>(response: { data?: T; message?: string; status: number }): T => {
  if (!isOk(response.status)) {
    throw new Error(response.message || 'Request failed');
  }

  return response.data as T;
};

// Raw axios calls (multipart / blobs) don't go through `api`, so pull the
// server's message out of the error ourselves.
const toError = async (error: unknown): Promise<Error> => {
  if (isAxiosError(error)) {
    let data = error.response?.data as unknown;

    // A failed blob request has its JSON error body inside a Blob.
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text());
      } catch {
        data = undefined;
      }
    }

    const message = (data as { message?: string } | undefined)?.message;
    return new Error(message || error.message);
  }

  return error as Error;
};

const baseUrl = () => import.meta.env.VITE_API_BASE_URL;

class ExpenseApi {
  async getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResult> {
    const params = new URLSearchParams();

    (Object.entries(filters) as [string, string | number | undefined][]).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    return unwrap(await api.get<ExpenseListResult>(`${API_ENDPOINTS.EXPENSES}?${params.toString()}`));
  }

  async getExpense(expenseId: number): Promise<Expense> {
    return unwrap(await api.get<Expense>(`${API_ENDPOINTS.EXPENSES}/${expenseId}`));
  }

  async getSuppliers(): Promise<string[]> {
    return unwrap(await api.get<string[]>(`${API_ENDPOINTS.EXPENSES}/suppliers`)) ?? [];
  }

  async findDuplicates(
    supplierName: string,
    invoiceNumber: string,
    excludeId = 0
  ): Promise<ExpenseDuplicate[]> {
    const params = new URLSearchParams({ supplierName, invoiceNumber, excludeId: String(excludeId) });
    return (
      unwrap(await api.get<ExpenseDuplicate[]>(`${API_ENDPOINTS.EXPENSES}/duplicates?${params}`)) ?? []
    );
  }

  async createExpense(values: ExpenseFormValues): Promise<{ ExpenseId: number }> {
    return unwrap(await api.post<{ ExpenseId: number }>(API_ENDPOINTS.EXPENSES, values));
  }

  async updateExpense(expenseId: number, values: ExpenseFormValues): Promise<void> {
    unwrap(await api.put(`${API_ENDPOINTS.EXPENSES}/${expenseId}`, values));
  }

  async deleteExpense(expenseId: number): Promise<void> {
    unwrap(await api.delete(`${API_ENDPOINTS.EXPENSES}/${expenseId}`));
  }

  // ---- Documents ----

  async uploadAttachments(expenseId: number, files: File[]): Promise<void> {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));

    try {
      await axios.post(`${baseUrl()}${API_ENDPOINTS.EXPENSES}/${expenseId}/attachments`, form);
    } catch (error) {
      throw await toError(error);
    }
  }

  async getAttachments(expenseId: number): Promise<ExpenseAttachment[]> {
    return (
      unwrap(await api.get<ExpenseAttachment[]>(`${API_ENDPOINTS.EXPENSES}/${expenseId}/attachments`)) ?? []
    );
  }

  // The token is sent in a header, so documents are fetched as blobs and shown
  // through object URLs (an <iframe>/<img> src can't carry the header itself).
  async getAttachmentBlob(expenseId: number, attachmentId: number): Promise<Blob> {
    try {
      const response = await axios.get(
        `${baseUrl()}${API_ENDPOINTS.EXPENSES}/${expenseId}/attachments/${attachmentId}/download?inline=1`,
        { responseType: 'blob' }
      );
      return response.data as Blob;
    } catch (error) {
      throw await toError(error);
    }
  }

  async deleteAttachment(expenseId: number, attachmentId: number): Promise<void> {
    unwrap(await api.delete(`${API_ENDPOINTS.EXPENSES}/${expenseId}/attachments/${attachmentId}`));
  }

  // ---- Report (Admin) ----

  async getReport(startDate: string, endDate: string): Promise<ExpenseReport> {
    const params = new URLSearchParams({ startDate, endDate });
    return unwrap(await api.get<ExpenseReport>(`${API_ENDPOINTS.EXPENSES}/reports?${params}`));
  }

  async downloadReportExcel(startDate: string, endDate: string): Promise<Blob> {
    const params = new URLSearchParams({ startDate, endDate });

    try {
      const response = await axios.get(
        `${baseUrl()}${API_ENDPOINTS.EXPENSES}/reports/export?${params}`,
        { responseType: 'blob' }
      );
      return response.data as Blob;
    } catch (error) {
      throw await toError(error);
    }
  }
}

export const expenseApi = new ExpenseApi();
