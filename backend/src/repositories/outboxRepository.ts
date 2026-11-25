import { request, sql } from './db';

export type EmailTemplate =
  | 'BookingConfirmed'
  | 'OfficeBookingConfirmed'
  | 'BookingCancelled'
  | 'OfficeBookingCancelled'
  | 'OfficeRefundFailed'
  | 'OfficeEnquiry';

export interface OutboxEmail {
  emailId: number;
  bookingId: number | null;
  template: EmailTemplate;
  toAddress: string;
  payload: Record<string, unknown> | null;
  attempts: number;
}

export const MAX_EMAIL_ATTEMPTS = 8;

export const outboxRepository = {
  async enqueue(template: EmailTemplate, toAddress: string, bookingId: number | null, payload?: Record<string, unknown>): Promise<void> {
    await (await request())
      .input('bookingId', sql.Int, bookingId)
      .input('template', sql.VarChar(50), template)
      .input('to', sql.NVarChar(254), toAddress)
      .input('payload', sql.NVarChar(sql.MAX), payload ? JSON.stringify(payload) : null)
      .query('INSERT INTO rental.EmailOutbox (BookingId, Template, ToAddress, PayloadJson) VALUES (@bookingId, @template, @to, @payload)');
  },

  async claim(batchSize: number): Promise<OutboxEmail[]> {
    const r = await (await request()).input('BatchSize', sql.Int, batchSize).execute('rental.usp_ClaimOutboxEmails');
    return r.recordset.map((x) => ({
      emailId: x.EmailId,
      bookingId: x.BookingId ?? null,
      template: x.Template,
      toAddress: x.ToAddress,
      payload: x.PayloadJson ? JSON.parse(x.PayloadJson) : null,
      attempts: x.Attempts,
    }));
  },

  async markSent(emailId: number): Promise<void> {
    await (await request())
      .input('id', sql.Int, emailId)
      .query("UPDATE rental.EmailOutbox SET Status = 'Sent', SentAtUtc = SYSUTCDATETIME(), LockedUntilUtc = NULL, LastError = NULL WHERE EmailId = @id");
  },

  /** Exponential backoff: 1, 2, 4 ... minutes, then Failed after MAX_EMAIL_ATTEMPTS. */
  async markFailed(emailId: number, attempts: number, error: string): Promise<void> {
    const giveUp = attempts >= MAX_EMAIL_ATTEMPTS;
    await (await request())
      .input('id', sql.Int, emailId)
      .input('status', sql.VarChar(20), giveUp ? 'Failed' : 'Pending')
      .input('delay', sql.Int, Math.min(2 ** (attempts - 1), 240))
      .input('error', sql.NVarChar(1000), error.slice(0, 1000))
      .query(`UPDATE rental.EmailOutbox
              SET Status = @status, LockedUntilUtc = NULL, LastError = @error, NextAttemptAtUtc = DATEADD(MINUTE, @delay, SYSUTCDATETIME())
              WHERE EmailId = @id`);
  },
};

export type OutboxRepository = typeof outboxRepository;
