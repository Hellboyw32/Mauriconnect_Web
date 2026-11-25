import { PaymentDeclinedError, PaymentProviderError, type CaptureResult } from '../payments/types';
import type { PaymentRow } from '../repositories/paymentRepository';
import { AppError, conflict, notFound, unprocessable } from '../utils/errors';
import { logger } from '../utils/logger';
import { toCents } from '../utils/money';
import type { BookingService } from './bookingService';
import { toBookingView } from './bookingView';
import type { Deps } from './deps';

const ORDER_REUSE_MINUTES = 180;

export function createPaymentService(deps: Deps, bookings: BookingService) {
  const { provider } = deps;

  async function refundRejectedCapture(bookingId: number, payment: PaymentRow, capture: CaptureResult, reason: string) {
    if (!capture.captureId || !capture.amountCents) return;
    try {
      const refund = await provider.refundCapture({
        captureId: capture.captureId,
        amountCents: capture.amountCents,
        currency: capture.currency ?? 'EUR',
        requestId: `refund-rejected-${capture.captureId}`,
        note: `Automatic refund: ${reason}`,
      });
      await deps.payments.recordRefund({ bookingId, paymentId: payment.paymentId, succeeded: true, refundReference: refund.refundId, amountCents: capture.amountCents, error: null });
    } catch (err) {
      logger.error({ err, captureId: capture.captureId }, 'Automatic refund of a rejected capture failed');
      await deps.bookings.audit(bookingId, 'RefundFailed', `Automatic refund of capture ${capture.captureId} failed: ${(err as Error).message}`);
      if (deps.config.officeEmail) {
        await deps.outbox.enqueue('OfficeRefundFailed', deps.config.officeEmail, bookingId, { captureId: capture.captureId, amount: capture.amountCents / 100, reason });
      }
    }
  }

  /**
   * Verifies a provider capture against the booking and records it. Shared by the browser
   * capture call and the webhook so both paths apply exactly the same checks.
   */
  async function applyCapture(bookingId: number, reference: string, totalCents: number, payment: PaymentRow, capture: CaptureResult) {
    if (capture.status !== 'COMPLETED' || !capture.captureId) {
      if (capture.status === 'PENDING') return 'PaymentPending' as const;
      await deps.payments.recordFailure(payment.paymentId, `Capture status ${capture.status}`, capture.raw);
      return 'Failed' as const;
    }

    const { amountCents, currency } = capture;
    const amountOk = amountCents !== null && amountCents === totalCents && amountCents === toCents(payment.amount);
    const currencyOk = currency === 'EUR' && payment.currency === 'EUR';
    const referenceOk = !capture.customId || capture.customId === reference;
    if (amountCents === null || currency === null || !amountOk || !currencyOk || !referenceOk) {
      logger.error({ reference, capture: { ...capture, raw: undefined } }, 'Capture does not match the booking');
      await deps.payments.recordFailure(payment.paymentId, 'Captured amount, currency or reference did not match the booking', capture.raw);
      await refundRejectedCapture(bookingId, payment, capture, 'payment did not match the booking');
      return 'Mismatch' as const;
    }

    const outcome = await deps.payments.recordCapture({
      bookingId,
      paymentId: payment.paymentId,
      captureId: capture.captureId,
      amountCents,
      currency,
      raw: capture.raw,
      officeEmail: deps.config.officeEmail,
    });
    if (outcome === 'NotPayable') await refundRejectedCapture(bookingId, payment, capture, 'booking was already paid or cancelled');
    return outcome;
  }

  return {
    /** Creates (or reuses) a provider order for the amount stored on the booking. */
    async createOrder(reference: string) {
      const booking = await bookings.load(reference);
      if (booking.status === 'Confirmed' || booking.paymentStatus === 'Successful') throw conflict('ALREADY_PAID', 'This booking has already been paid.');
      if (booking.status !== 'PendingPayment' && booking.status !== 'Expired') throw conflict('BOOKING_NOT_PAYABLE', 'This booking can no longer be paid.');
      if (booking.pickupUtc <= deps.clock()) throw unprocessable('PICKUP_PASSED', 'The pickup time has passed. Please make a new booking.');

      // Renews an expired hold (assigning a car again, or an outsourced one when the fleet is full).
      await deps.bookings.renewHold(booking.bookingId);

      const totalCents = toCents(booking.total);
      const reusable = await deps.payments.findReusableOrder(booking.bookingId, totalCents, ORDER_REUSE_MINUTES);
      if (reusable?.orderId) return { orderId: reusable.orderId };

      const attempt = Date.now().toString(36);
      const order = await provider.createOrder({
        reference,
        amountCents: totalCents,
        currency: 'EUR',
        description: `MauriConnect car rental ${reference}`,
        requestId: `order-${reference}-${attempt}`,
      });
      await deps.payments.insertPending({ bookingId: booking.bookingId, provider: provider.name, orderId: order.orderId, amountCents: totalCents, currency: 'EUR', raw: order.raw });
      return { orderId: order.orderId };
    },

    /** Captures the approved order on the server and confirms the booking only if the capture checks out. */
    async captureOrder(reference: string, orderId: string) {
      const booking = await bookings.load(reference);
      const payment = await deps.payments.findByOrderId(orderId);
      if (!payment || payment.bookingId !== booking.bookingId) throw notFound('PAYMENT_NOT_FOUND', 'Payment not found for this booking.');

      // Idempotent replay: this order was already captured and recorded.
      if (payment.status === 'Successful') return { outcome: 'Confirmed' as const, booking: toBookingView(booking, deps.clock()) };
      if (booking.paymentStatus === 'Successful') throw conflict('ALREADY_PAID', 'This booking has already been paid.');
      if (payment.status !== 'Pending') throw conflict('PAYMENT_NOT_PENDING', 'This payment attempt is closed. Please start the payment again.');

      let capture: CaptureResult;
      try {
        capture = await provider.captureOrder(orderId, `capture-${orderId}`);
      } catch (err) {
        if (err instanceof PaymentDeclinedError) {
          await deps.payments.recordFailure(payment.paymentId, err.message, null);
          throw new AppError(402, 'PAYMENT_DECLINED', 'Your payment was declined. Please try another card or PayPal account.');
        }
        if (err instanceof PaymentProviderError) {
          throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'We could not complete the payment with PayPal. You have not been charged; please try again.');
        }
        throw err;
      }

      const outcome = await applyCapture(booking.bookingId, reference, toCents(booking.total), payment, capture);
      const view = toBookingView(await bookings.load(reference), deps.clock());
      switch (outcome) {
        case 'Confirmed':
        case 'AlreadyProcessed':
          return { outcome: 'Confirmed' as const, booking: view };
        case 'PaymentPending':
          return { outcome: 'PaymentPending' as const, booking: view };
        case 'NotPayable':
          throw conflict('BOOKING_NOT_PAYABLE', 'This booking was already paid or cancelled. Your payment has been refunded automatically.');
        case 'Mismatch':
          throw unprocessable('PAYMENT_MISMATCH', 'The payment did not match your booking and has been refunded. Please try again.');
        default:
          throw new AppError(402, 'PAYMENT_FAILED', 'The payment could not be completed. You have not been charged; please try again.');
      }
    },

    /** PayPal webhook: reconciles captures when the browser never came back (closed tab, network loss). */
    async handleWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string) {
      if (!(await provider.verifyWebhook(headers, rawBody))) throw new AppError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature.');
      const event = provider.parseWebhook(rawBody);
      const isNew = await deps.payments.insertEvent(event.id, event.eventType, rawBody);
      if (!isNew) return { duplicate: true };

      let error: string | null = null;
      try {
        if (event.orderId) {
          const payment = await deps.payments.findByOrderId(event.orderId);
          const reference = payment ? await deps.bookings.referenceById(payment.bookingId) : null;
          if (payment && reference) {
            const booking = await bookings.load(reference);
            if (event.eventType === 'PAYMENT.CAPTURE.COMPLETED' && payment.status === 'Pending') {
              await applyCapture(booking.bookingId, reference, toCents(booking.total), payment, {
                status: 'COMPLETED',
                captureId: event.captureId,
                amountCents: event.amountCents,
                currency: event.currency,
                customId: event.customId,
                raw: rawBody,
              });
            } else if ((event.eventType === 'PAYMENT.CAPTURE.DENIED' || event.eventType === 'PAYMENT.CAPTURE.DECLINED') && payment.status === 'Pending') {
              await deps.payments.recordFailure(payment.paymentId, `Webhook ${event.eventType}`, rawBody);
            } else {
              await deps.bookings.audit(booking.bookingId, 'WebhookReceived', `${event.eventType} ${event.captureId ?? ''}`.trim());
            }
          }
        }
      } catch (err) {
        error = (err as Error).message;
        logger.error({ err, eventId: event.id }, 'Webhook processing failed');
      }
      await deps.payments.markEventProcessed(event.id, error);
      return { duplicate: false };
    },
  };
}

export type PaymentService = ReturnType<typeof createPaymentService>;
