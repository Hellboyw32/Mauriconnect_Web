import { badRequest, notFound } from '../utils/errors';
import type { BookingService } from '../services/bookingService';
import type { CancellationService } from '../services/cancellationService';
import type { DocumentService } from '../services/documentService';
import type { TokenService } from '../services/tokens';
import { asyncHandler, clientIp } from './asyncHandler';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,64}$/;

export function createBookingController(bookings: BookingService, cancellations: CancellationService, documents: DocumentService, tokens: TokenService) {
  return {
    create: asyncHandler(async (req, res) => {
      const key = req.header('Idempotency-Key') ?? null;
      if (key !== null && !IDEMPOTENCY_KEY.test(key)) throw badRequest('INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 16-64 letters, digits, - or _.');
      const result = await bookings.create(req.body, key, clientIp(req));
      res.status(result.isExisting ? 200 : 201).json({ booking: result.booking, accessToken: result.accessToken });
    }),

    verify: asyncHandler(async (req, res) => {
      res.json(await bookings.verify(req.params.reference, req.body.email));
    }),

    get: asyncHandler(async (req, res) => {
      res.json(await bookings.view(req.params.reference));
    }),

    abandon: asyncHandler(async (req, res) => {
      res.json(await bookings.abandon(req.params.reference));
    }),

    cancellationQuote: asyncHandler(async (req, res) => {
      res.json(await cancellations.quote(req.params.reference));
    }),

    cancel: asyncHandler(async (req, res) => {
      const result = await cancellations.cancel(req.params.reference, req.body.reason ?? null, clientIp(req));
      res.json(result);
    }),

    voucher: asyncHandler(async (req, res) => {
      const view = await bookings.view(req.params.reference);
      if (!view.documents.voucher) throw notFound('VOUCHER_NOT_AVAILABLE', 'The voucher is available once the booking is paid and confirmed.');
      const pdf = await documents.renderVoucher(view, documents.manageUrl(view.reference, tokens.issueLinkToken(view.reference)));
      res
        .status(200)
        .setHeader('Content-Type', 'application/pdf')
        .setHeader('Content-Disposition', `attachment; filename="MauriConnect-voucher-${view.reference}.pdf"`)
        .setHeader('Cache-Control', 'no-store')
        .send(pdf);
    }),

    cancellationDocument: asyncHandler(async (req, res) => {
      const view = await bookings.view(req.params.reference);
      if (!view.documents.cancellation) throw notFound('DOCUMENT_NOT_AVAILABLE', 'This booking is not cancelled.');
      const pdf = await documents.renderCancellation(view);
      res
        .status(200)
        .setHeader('Content-Type', 'application/pdf')
        .setHeader('Content-Disposition', `attachment; filename="MauriConnect-cancellation-${view.reference}.pdf"`)
        .setHeader('Cache-Control', 'no-store')
        .send(pdf);
    }),
  };
}
