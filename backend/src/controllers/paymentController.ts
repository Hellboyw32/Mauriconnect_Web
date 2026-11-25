import type { CancellationService } from '../services/cancellationService';
import type { PaymentService } from '../services/paymentService';
import { asyncHandler } from './asyncHandler';

export function createPaymentController(payments: PaymentService, cancellations: CancellationService) {
  return {
    createOrder: asyncHandler(async (req, res) => {
      res.status(201).json(await payments.createOrder(req.body.bookingReference));
    }),

    captureOrder: asyncHandler(async (req, res) => {
      const result = await payments.captureOrder(req.body.bookingReference, req.body.orderId);
      res.status(result.outcome === 'PaymentPending' ? 202 : 200).json(result);
    }),

    webhook: asyncHandler(async (req, res) => {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      await payments.handleWebhook(req.headers, raw);
      res.status(200).json({ received: true });
    }),

    refund: asyncHandler(async (req, res) => {
      res.json(await cancellations.refund(req.body.bookingReference, req.body.amount));
    }),
  };
}
