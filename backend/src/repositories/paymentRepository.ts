import type { PaymentStatus } from '../types/domain';
import { fromCents } from '../utils/money';
import { request, sql, withDeadlockRetry, toNumber } from './db';

export interface PaymentRow {
  paymentId: number;
  bookingId: number;
  orderId: string | null;
  captureId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refundAmount: number;
  createdAtUtc: Date;
}

const map = (r: Record<string, unknown>): PaymentRow => ({
  paymentId: r.PaymentId as number,
  bookingId: r.BookingId as number,
  orderId: (r.PayPalOrderId as string) ?? null,
  captureId: (r.PayPalCaptureId as string) ?? null,
  amount: toNumber(r.Amount),
  currency: String(r.Currency),
  status: r.PaymentStatus as PaymentStatus,
  refundAmount: toNumber(r.RefundAmount),
  createdAtUtc: r.CreatedAtUtc as Date,
});

export const paymentRepository = {
  async insertPending(p: { bookingId: number; provider: string; orderId: string; amountCents: number; currency: string; raw: string | null }): Promise<number> {
    const r = await (await request())
      .input('bookingId', sql.Int, p.bookingId)
      .input('provider', sql.VarChar(20), p.provider)
      .input('orderId', sql.VarChar(64), p.orderId)
      .input('amount', sql.Decimal(10, 2), fromCents(p.amountCents))
      .input('currency', sql.Char(3), p.currency)
      .input('raw', sql.NVarChar(sql.MAX), p.raw)
      .query(`INSERT INTO rental.Payments (BookingId, PaymentProvider, PayPalOrderId, Amount, Currency, PaymentStatus, RawResponse)
              OUTPUT inserted.PaymentId VALUES (@bookingId, @provider, @orderId, @amount, @currency, 'Pending', @raw)`);
    return r.recordset[0].PaymentId;
  },

  async findByOrderId(orderId: string): Promise<PaymentRow | null> {
    const r = await (await request()).input('orderId', sql.VarChar(64), orderId).query('SELECT * FROM rental.Payments WHERE PayPalOrderId = @orderId');
    return r.recordset[0] ? map(r.recordset[0]) : null;
  },

  /** A recent unpaid order for the same amount can be reused instead of creating another. */
  async findReusableOrder(bookingId: number, amountCents: number, maxAgeMinutes: number): Promise<PaymentRow | null> {
    const r = await (await request())
      .input('bookingId', sql.Int, bookingId)
      .input('amount', sql.Decimal(10, 2), fromCents(amountCents))
      .input('age', sql.Int, maxAgeMinutes)
      .query(`SELECT TOP (1) * FROM rental.Payments
              WHERE BookingId = @bookingId AND PaymentStatus = 'Pending' AND Amount = @amount
                AND CreatedAtUtc > DATEADD(MINUTE, -@age, SYSUTCDATETIME())
              ORDER BY PaymentId DESC`);
    return r.recordset[0] ? map(r.recordset[0]) : null;
  },

  async recordCapture(p: { bookingId: number; paymentId: number; captureId: string; amountCents: number; currency: string; raw: string; officeEmail: string | null }): Promise<'Confirmed' | 'AlreadyProcessed' | 'NotPayable'> {
    const r = await withDeadlockRetry(async () => (await request())
      .input('BookingId', sql.Int, p.bookingId)
      .input('PaymentId', sql.Int, p.paymentId)
      .input('CaptureId', sql.VarChar(64), p.captureId)
      .input('Amount', sql.Decimal(10, 2), fromCents(p.amountCents))
      .input('Currency', sql.Char(3), p.currency)
      .input('RawResponse', sql.NVarChar(sql.MAX), p.raw)
      .input('OfficeEmail', sql.NVarChar(254), p.officeEmail)
      .execute('rental.usp_RecordPaymentCapture'));
    return r.recordset[0].Outcome;
  },

  async recordFailure(paymentId: number, reason: string, raw: string | null): Promise<void> {
    await withDeadlockRetry(async () => (await request())
      .input('PaymentId', sql.Int, paymentId)
      .input('FailureReason', sql.NVarChar(300), reason.slice(0, 300))
      .input('RawResponse', sql.NVarChar(sql.MAX), raw)
      .execute('rental.usp_RecordPaymentFailure'));
  },

  async recordRefund(p: { bookingId: number; paymentId: number; succeeded: boolean; refundReference: string | null; amountCents: number; error: string | null }): Promise<void> {
    await withDeadlockRetry(async () => (await request())
      .input('BookingId', sql.Int, p.bookingId)
      .input('PaymentId', sql.Int, p.paymentId)
      .input('Succeeded', sql.Bit, p.succeeded)
      .input('RefundReference', sql.VarChar(64), p.refundReference)
      .input('RefundAmount', sql.Decimal(10, 2), fromCents(p.amountCents))
      .input('Error', sql.NVarChar(500), p.error?.slice(0, 500) ?? null)
      .execute('rental.usp_RecordRefund'));
  },

  /** Stores a webhook event once. Returns false when the event was already received. */
  async insertEvent(eventId: string, eventType: string, payload: string): Promise<boolean> {
    const r = await (await request())
      .input('id', sql.VarChar(100), eventId)
      .input('type', sql.VarChar(100), eventType)
      .input('payload', sql.NVarChar(sql.MAX), payload)
      .query(`IF EXISTS (SELECT 1 FROM rental.PaymentEvents WHERE ProviderEventId = @id) SELECT 0 AS Inserted;
              ELSE BEGIN
                INSERT INTO rental.PaymentEvents (ProviderEventId, EventType, PayloadJson) VALUES (@id, @type, @payload);
                SELECT 1 AS Inserted;
              END`);
    return Boolean(r.recordset[0].Inserted);
  },

  async markEventProcessed(eventId: string, error: string | null): Promise<void> {
    await (await request())
      .input('id', sql.VarChar(100), eventId)
      .input('error', sql.NVarChar(500), error?.slice(0, 500) ?? null)
      .query('UPDATE rental.PaymentEvents SET ProcessedAtUtc = SYSUTCDATETIME(), ProcessingError = @error WHERE ProviderEventId = @id');
  },
};

export type PaymentRepository = typeof paymentRepository;
