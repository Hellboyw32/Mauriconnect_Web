import { createBookingService } from './services/bookingService';
import { createCancellationService } from './services/cancellationService';
import { createCatalogService } from './services/catalogService';
import type { Deps } from './services/deps';
import { createDocumentService } from './services/documentService';
import { createEmailService } from './services/emailService';
import { createEnquiryService } from './services/enquiryService';
import { createPaymentService } from './services/paymentService';
import { createTokenService } from './services/tokens';

/** Wires services together. Business logic lives in services; controllers only translate HTTP. */
export function createServices(deps: Deps) {
  const tokens = createTokenService(deps.config);
  const catalog = createCatalogService(deps);
  const bookings = createBookingService(deps, catalog, tokens);
  const payments = createPaymentService(deps, bookings);
  const cancellations = createCancellationService(deps, catalog, bookings);
  const documents = createDocumentService(deps);
  const emails = createEmailService(deps, bookings, documents, tokens);
  const enquiries = createEnquiryService(deps);
  return { tokens, catalog, bookings, payments, cancellations, documents, emails, enquiries };
}

export type Services = ReturnType<typeof createServices>;
