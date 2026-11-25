import express, { Router } from 'express';
import { z } from 'zod';
import { createBookingController } from '../controllers/bookingController';
import { createCatalogController } from '../controllers/catalogController';
import { createEnquiryController } from '../controllers/enquiryController';
import { createPaymentController } from '../controllers/paymentController';
import type { Services } from '../container';
import { requireAdminKey, requireBookingAccess } from '../middleware/auth';
import type { createRateLimits } from '../middleware/rateLimits';
import { validateBody, validateParams } from '../middleware/validate';
import {
  bookingReference,
  cancelBookingSchema,
  captureOrderSchema,
  createBookingSchema,
  createOrderSchema,
  enquirySchema,
  quoteSchema,
  refundSchema,
  searchSchema,
  verifyBookingSchema,
} from '../validation/schemas';

const referenceParams = z.object({ reference: bookingReference });
const slugParams = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/) });

export interface RouteOptions {
  services: Services;
  limits: ReturnType<typeof createRateLimits>;
  adminApiKey: string;
  publicConfig: { paymentProvider: string; paypalClientId: string | null };
}

/** Webhooks need the raw body for signature verification, so they are mounted before the JSON parser. */
export function webhookRouter({ services }: RouteOptions): Router {
  const router = Router();
  const payments = createPaymentController(services.payments, services.cancellations);
  router.post('/payments/paypal/webhook', express.raw({ type: '*/*', limit: '256kb' }), payments.webhook);
  return router;
}

export function apiRouter({ services, limits, adminApiKey, publicConfig }: RouteOptions): Router {
  const router = Router();
  const catalog = createCatalogController(services.catalog, publicConfig);
  const bookings = createBookingController(services.bookings, services.cancellations, services.documents, services.tokens);
  const payments = createPaymentController(services.payments, services.cancellations);
  const enquiries = createEnquiryController(services.enquiries);
  const bookingAccess = requireBookingAccess(services.tokens);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  router.get('/config', catalog.config);

  // Catalogue and search
  router.get('/locations', catalog.locations);
  router.get('/extras', catalog.extras);
  router.get('/cars/categories', catalog.categories);
  router.post('/cars/search', validateBody(searchSchema), catalog.search);
  router.get('/cars/:slug', validateParams(slugParams), catalog.car);
  router.post('/quotes', validateBody(quoteSchema), catalog.quote);

  // Bookings
  router.post('/bookings', limits.createBooking, validateBody(createBookingSchema), bookings.create);
  router.post('/bookings/:reference/verify', limits.lookupPerIp, limits.lookup, validateParams(referenceParams), validateBody(verifyBookingSchema), bookings.verify);
  router.get('/bookings/:reference', validateParams(referenceParams), bookingAccess, bookings.get);
  router.post('/bookings/:reference/abandon', validateParams(referenceParams), bookingAccess, bookings.abandon);
  router.get('/bookings/:reference/cancellation-quote', validateParams(referenceParams), bookingAccess, bookings.cancellationQuote);
  router.post('/bookings/:reference/cancel', validateParams(referenceParams), bookingAccess, validateBody(cancelBookingSchema), bookings.cancel);
  router.get(
    '/bookings/:reference/voucher',
    validateParams(referenceParams),
    requireBookingAccess(services.tokens, { allowQueryToken: true }),
    bookings.voucher,
  );
  router.get(
    '/bookings/:reference/cancellation-document',
    validateParams(referenceParams),
    requireBookingAccess(services.tokens, { allowQueryToken: true }),
    bookings.cancellationDocument,
  );

  // Payments
  router.post('/payments/paypal/create-order', limits.payments, validateBody(createOrderSchema), bookingAccess, payments.createOrder);
  router.post('/payments/paypal/capture-order', limits.payments, validateBody(captureOrderSchema), bookingAccess, payments.captureOrder);
  router.post('/payments/paypal/refund', requireAdminKey(adminApiKey), validateBody(refundSchema), payments.refund);

  // Enquiries (request a quote, contact form)
  router.post('/enquiries', limits.enquiries, validateBody(enquirySchema), enquiries.submit);

  return router;
}
