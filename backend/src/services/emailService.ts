import type { OutboxEmail } from '../repositories/outboxRepository';
import { logger } from '../utils/logger';
import type { BookingService } from './bookingService';
import { toBookingView } from './bookingView';
import type { Deps } from './deps';
import type { DocumentService } from './documentService';
import type { MailMessage } from './mailer';
import * as templates from './emailTemplates';
import type { TokenService } from './tokens';

/**
 * Sends queued emails. Messages are rendered from the booking's current state at send time,
 * and a failed send is retried with backoff: email problems never undo a payment.
 */
export function createEmailService(deps: Deps, bookings: BookingService, documents: DocumentService, tokens: TokenService) {
  async function build(email: OutboxEmail): Promise<MailMessage> {
    if (email.template === 'OfficeEnquiry') {
      return { to: email.toAddress, ...templates.officeEnquiry(email.payload ?? {}) };
    }
    if (!email.bookingId) throw new Error(`${email.template} needs a booking`);
    const reference = await deps.bookings.referenceById(email.bookingId);
    if (!reference) throw new Error(`Booking ${email.bookingId} not found`);
    const record = await bookings.load(reference);
    const view = toBookingView(record, deps.clock());
    const manageLink = documents.manageUrl(reference, tokens.issueLinkToken(reference));

    switch (email.template) {
      case 'BookingConfirmed':
      case 'OfficeBookingConfirmed': {
        const voucher = await documents.renderVoucher(view, manageLink);
        if (email.template === 'BookingConfirmed') await documents.store(record.bookingId, reference, 'Voucher', voucher);
        const content = email.template === 'BookingConfirmed' ? templates.bookingConfirmed(view, manageLink) : templates.officeBookingConfirmed(view, record.isOutsourced);
        return { to: email.toAddress, ...content, attachments: [{ filename: `MauriConnect-voucher-${reference}.pdf`, content: voucher, contentType: 'application/pdf' }] };
      }
      case 'BookingCancelled': {
        const pdf = await documents.renderCancellation(view);
        await documents.store(record.bookingId, reference, 'Cancellation', pdf);
        return { to: email.toAddress, ...templates.bookingCancelled(view), attachments: [{ filename: `MauriConnect-cancellation-${reference}.pdf`, content: pdf, contentType: 'application/pdf' }] };
      }
      case 'OfficeBookingCancelled':
        return { to: email.toAddress, ...templates.officeBookingCancelled(view) };
      case 'OfficeRefundFailed':
        return { to: email.toAddress, ...templates.officeRefundFailed(view, email.payload) };
      default:
        throw new Error(`Unknown email template ${String(email.template)}`);
    }
  }

  return {
    /** Processes one batch of due emails. Returns how many were sent. */
    async processOutbox(batchSize = 10): Promise<number> {
      const emails = await deps.outbox.claim(batchSize);
      let sent = 0;
      for (const email of emails) {
        try {
          await deps.mailer.send(await build(email));
          await deps.outbox.markSent(email.emailId);
          sent++;
        } catch (err) {
          logger.warn({ err, emailId: email.emailId, template: email.template, attempt: email.attempts }, 'Email send failed; will retry');
          await deps.outbox.markFailed(email.emailId, email.attempts, (err as Error).message);
        }
      }
      return sent;
    },
  };
}

export type EmailService = ReturnType<typeof createEmailService>;
