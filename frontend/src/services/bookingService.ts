import type { Booking, BookingWithToken, CancellationQuote, CaptureResult, CreateBookingRequest, EnquiryRequest } from '../types/api';
import { API_BASE_URL, api, bearer } from './apiClient';

const ref = (reference: string) => encodeURIComponent(reference);

export const bookingService = {
  /** The Idempotency-Key makes a retried submit (double click, flaky network) return the same booking. */
  create: (request: CreateBookingRequest, idempotencyKey: string) =>
    api.post<BookingWithToken>('/bookings', request, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data),

  get: (reference: string, token: string) => api.get<Booking>(`/bookings/${ref(reference)}`, bearer(token)).then((r) => r.data),

  verify: (reference: string, email: string) => api.post<BookingWithToken>(`/bookings/${ref(reference)}/verify`, { email }).then((r) => r.data),

  abandon: (reference: string, token: string) => api.post<Booking>(`/bookings/${ref(reference)}/abandon`, {}, bearer(token)).then((r) => r.data),

  cancellationQuote: (reference: string, token: string) =>
    api.get<CancellationQuote>(`/bookings/${ref(reference)}/cancellation-quote`, bearer(token)).then((r) => r.data),

  cancel: (reference: string, token: string, reason: string | null) =>
    api.post<{ alreadyCancelled: boolean; booking: Booking }>(`/bookings/${ref(reference)}/cancel`, { reason }, bearer(token)).then((r) => r.data),

  /** Direct download links: the token travels as a query parameter because a plain link cannot send headers. */
  voucherUrl: (reference: string, token: string) => `${API_BASE_URL}/api/bookings/${ref(reference)}/voucher?token=${encodeURIComponent(token)}`,
  cancellationDocumentUrl: (reference: string, token: string) =>
    `${API_BASE_URL}/api/bookings/${ref(reference)}/cancellation-document?token=${encodeURIComponent(token)}`,
};

export const paymentService = {
  createOrder: (reference: string, token: string) =>
    api.post<{ orderId: string }>('/payments/paypal/create-order', { bookingReference: reference }, bearer(token)).then((r) => r.data),
  captureOrder: (reference: string, token: string, orderId: string) =>
    api.post<CaptureResult>('/payments/paypal/capture-order', { bookingReference: reference, orderId }, bearer(token)).then((r) => r.data),
};

export const enquiryService = {
  submit: (request: EnquiryRequest) => api.post('/enquiries', request).then(() => undefined),
};
