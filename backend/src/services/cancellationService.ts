import { conflict } from '../utils/errors';
import { logger } from '../utils/logger';
import { fromCents, toCents } from '../utils/money';
import type { BookingRecord } from '../repositories/bookingRepository';
import type { BookingService } from './bookingService';
import { toBookingView } from './bookingView';
import { quoteCancellation } from './cancellationPolicy';
import type { CatalogService } from './catalogService';
import type { Deps } from './deps';

const REASON_TEXT: Record<string, string> = {
  ALREADY_CANCELLED: 'This booking is already cancelled.',
  NOT_CANCELLABLE_STATUS: 'This booking can no longer be cancelled online. Please contact us.',
  PICKUP_PASSED: 'The pickup time has passed, so the booking can no longer be cancelled online.',
};

/** What the customer has paid and not yet had back. */
const paidCents = (b: BookingRecord) =>
  b.payment && (b.payment.status === 'Successful' || b.payment.status === 'PartiallyRefunded')
    ? toCents(b.payment.amount) - toCents(b.payment.refundAmount)
    : 0;

export function createCancellationService(deps: Deps, catalog: CatalogService, bookings: BookingService) {
  async function quoteFor(booking: BookingRecord) {
    return quoteCancellation({
      status: booking.status,
      pickupUtc: booking.pickupUtc,
      now: deps.clock(),
      paidCents: paidCents(booking),
      rules: await catalog.getCancellationRules(),
    });
  }

  /** Issues the refund through the provider and records the outcome. Safe to call again (idempotent request id). */
  async function processRefund(booking: BookingRecord, refundCents: number, requestId = `refund-${booking.reference}`) {
    const payment = booking.payment;
    if (!payment?.captureId || refundCents <= 0) return;
    try {
      const refund = await deps.provider.refundCapture({
        captureId: payment.captureId,
        amountCents: refundCents,
        currency: payment.currency,
        requestId,
        note: `Refund for cancelled booking ${booking.reference}`,
      });
      if (refund.status === 'FAILED' || refund.status === 'CANCELLED') throw new Error(`Refund status ${refund.status}`);
      await deps.payments.recordRefund({ bookingId: booking.bookingId, paymentId: payment.paymentId, succeeded: true, refundReference: refund.refundId, amountCents: refundCents, error: null });
    } catch (err) {
      logger.error({ err, reference: booking.reference }, 'Refund failed');
      await deps.payments.recordRefund({ bookingId: booking.bookingId, paymentId: payment.paymentId, succeeded: false, refundReference: null, amountCents: refundCents, error: (err as Error).message });
      if (deps.config.officeEmail) {
        await deps.outbox.enqueue('OfficeRefundFailed', deps.config.officeEmail, booking.bookingId, { amount: fromCents(refundCents), reason: (err as Error).message });
      }
    }
  }

  return {
    async quote(reference: string) {
      const booking = await bookings.load(reference);
      const q = await quoteFor(booking);
      return {
        allowed: q.allowed,
        reason: q.reason ? REASON_TEXT[q.reason] : null,
        hoursBeforePickup: q.hoursBeforePickup,
        feePercent: q.feePercent,
        fee: fromCents(q.feeCents),
        refundAmount: fromCents(q.refundCents),
        paidAmount: fromCents(paidCents(booking)),
        currency: 'EUR',
        policy: (await catalog.getCancellationRules())
          .sort((a, b) => b.hoursBeforePickup - a.hoursBeforePickup)
          .map((r) => ({ hoursBeforePickup: r.hoursBeforePickup, feePercent: r.feePercent })),
      };
    },

    async cancel(reference: string, reason: string | null, ipAddress: string | null) {
      let booking = await bookings.load(reference);

      if (booking.cancellation) {
        // Duplicate request: return the earlier result, retrying a refund that failed before.
        if (booking.cancellation.status === 'RefundFailed') {
          await processRefund(booking, toCents(booking.cancellation.refundAmount));
          booking = await bookings.load(reference);
        }
        return { alreadyCancelled: true, booking: toBookingView(booking, deps.clock()) };
      }

      const q = await quoteFor(booking);
      if (!q.allowed) throw conflict('BOOKING_NOT_CANCELLABLE', REASON_TEXT[q.reason ?? 'NOT_CANCELLABLE_STATUS']);

      const outcome = await deps.bookings.cancel({
        bookingId: booking.bookingId,
        reason,
        policyId: q.policyId,
        hoursBeforePickup: q.hoursBeforePickup,
        feePercent: q.feePercent,
        feeCents: q.feeCents,
        refundCents: q.refundCents,
        requestedBy: 'Customer',
        ipAddress,
      });
      if (outcome === 'AlreadyCancelled') return { alreadyCancelled: true, booking: toBookingView(await bookings.load(reference), deps.clock()) };

      await processRefund(booking, q.refundCents);

      // Emails are queued after the refund so they show its final status.
      await deps.outbox.enqueue('BookingCancelled', booking.customer.email, booking.bookingId);
      if (deps.config.officeEmail) await deps.outbox.enqueue('OfficeBookingCancelled', deps.config.officeEmail, booking.bookingId);

      return { alreadyCancelled: false, booking: toBookingView(await bookings.load(reference), deps.clock()) };
    },

    /** Internal/admin: retry a failed refund or issue a goodwill refund on a paid booking. */
    async refund(reference: string, amount?: number) {
      const booking = await bookings.load(reference);
      const remaining = paidCents(booking);
      if (remaining <= 0) throw conflict('NOTHING_TO_REFUND', 'There is no payment left to refund.');
      // A failed cancellation refund is retried with its original request id. Anything else is a new
      // (goodwill) refund and needs a new id: reusing the old one would only replay the earlier refund.
      const retrying = !amount && booking.cancellation?.status === 'RefundFailed';
      const cents = amount
        ? Math.min(toCents(amount), remaining)
        : retrying
          ? Math.min(toCents(booking.cancellation!.refundAmount), remaining)
          : remaining;
      await processRefund(booking, cents, retrying ? undefined : `refund-${reference}-manual-${deps.clock().getTime()}`);
      return toBookingView(await bookings.load(reference), deps.clock());
    },
  };
}

export type CancellationService = ReturnType<typeof createCancellationService>;
