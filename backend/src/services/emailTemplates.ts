import { company } from '../config/company';
import { formatEuro, toCents } from '../utils/money';
import { escapeHtml as h } from '../utils/text';
import { formatLocal, parseLocalDateTime } from '../utils/time';
import type { BookingView } from './bookingView';

const euro = (amount: number) => formatEuro(toCents(amount));
const when = (localIso: string) => {
  const d = parseLocalDateTime(localIso);
  return d ? formatLocal(d, 'EEE d MMM yyyy, HH:mm') : localIso;
};

interface Rendered {
  subject: string;
  html: string;
  text: string;
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F3F6F9;font-family:Arial,Helvetica,sans-serif;color:#1F2933">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F6F9;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden">
<tr><td style="background:#0B5C8A;padding:20px 28px;border-bottom:4px solid #F2A541">
<div style="font-size:22px;font-weight:bold;color:#FFFFFF">MauriConnect</div>
<div style="font-size:12px;color:#D6E8F5">Car Rental Mauritius</div></td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:20px;margin:0 0 16px">${h(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="background:#F8FAFC;padding:18px 28px;font-size:12px;color:#5F6B7A;line-height:1.6">
${h(company.legalName)} · ${h(company.address)}<br>
Phone / WhatsApp ${h(company.phone)} (24/7) · <a href="mailto:${h(company.email)}" style="color:#0B5C8A">${h(company.email)}</a>
</td></tr></table></td></tr></table></body></html>`;
}

const table = (rows: [string, string | null | undefined][]) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;margin:8px 0 20px">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#5F6B7A;width:40%;vertical-align:top">${h(k)}</td><td style="padding:6px 0;font-weight:bold">${h(v)}</td></tr>`,
    )
    .join('')}</table>`;

const textRows = (rows: [string, string | null | undefined][]) =>
  rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${h(href)}" style="background:#0B5C8A;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;display:inline-block">${h(label)}</a></p>`;

function bookingRows(v: BookingView): [string, string | null][] {
  return [
    ['Booking ID', v.reference],
    ['Status', v.status === 'Confirmed' ? 'Confirmed' : v.status],
    ['Vehicle', `${v.car.name} or similar (${v.car.category}, ${v.car.transmission})`],
    ['Pickup', `${when(v.pickup.at)} · ${v.pickup.location.name}${v.pickup.address ? ` (${v.pickup.address})` : ''}`],
    ['Return', `${when(v.return.at)} · ${v.return.location.name}${v.return.address ? ` (${v.return.address})` : ''}`],
    ['Rental duration', `${v.rentalDays} day${v.rentalDays === 1 ? '' : 's'}`],
  ];
}

export function bookingConfirmed(v: BookingView, manageLink: string): Rendered {
  const rows: [string, string | null][] = [
    ...bookingRows(v),
    ['Total paid', euro(v.payment?.amount ?? v.total)],
    ['Payment reference', v.payment?.transactionId ?? null],
  ];
  const intro = `Dear ${v.customer.firstName}, thank you for booking with MauriConnect. Your car is reserved and your payment has been received.`;
  const outro = 'Your voucher is attached. Please bring it with your passport and driving licence. A security deposit is taken at pickup.';
  return {
    subject: `Booking confirmed: ${v.reference}`,
    html: layout(
      'Your booking is confirmed',
      `<p style="font-size:14px;line-height:1.6">${h(intro)}</p>${table(rows)}<p style="font-size:14px;line-height:1.6">${h(outro)}</p>${button(manageLink, 'Manage my booking')}`,
    ),
    text: `${intro}\n\n${textRows(rows)}\n\n${outro}\n\nManage your booking: ${manageLink}\n\n${company.name} · ${company.phone} · ${company.email}`,
  };
}

export function officeBookingConfirmed(v: BookingView, isOutsourced: boolean): Rendered {
  const rows: [string, string | null][] = [
    ...bookingRows(v),
    ['Customer', `${v.customer.firstName} ${v.customer.lastName}`],
    ['Email', v.customer.email],
    ['Mobile', v.customer.mobileNumber],
    ['Flight', v.travel.flightNumber],
    ['Arrival', v.travel.arrivalAt ? when(v.travel.arrivalAt) : null],
    ['Accommodation', v.travel.accommodation],
    ['Special requests', v.travel.specialRequests],
    ['Extras', v.charges.filter((c) => c.type === 'Extra').map((c) => c.description).join(', ') || null],
    ['Total paid', euro(v.payment?.amount ?? v.total)],
    ['PayPal transaction', v.payment?.transactionId ?? null],
  ];
  const warning = isOutsourced ? '<p style="background:#FFF4E5;border-left:4px solid #F2A541;padding:10px 12px;font-size:14px"><strong>Action needed:</strong> no fleet car was free for these dates. Arrange an outsourced car.</p>' : '';
  return {
    subject: `${isOutsourced ? '[OUTSOURCE] ' : ''}New booking ${v.reference}: ${v.car.name}, ${when(v.pickup.at)}`,
    html: layout('New online booking', `${warning}${table(rows)}`),
    text: `${isOutsourced ? 'ACTION NEEDED: arrange an outsourced car.\n\n' : ''}${textRows(rows)}`,
  };
}

const refundStatusText: Record<string, string> = {
  NoRefundDue: 'No refund is due under the cancellation policy.',
  RefundPending: 'Your refund is being processed.',
  Refunded: 'Your refund has been issued to your original payment method. Your bank may take a few days to show it.',
  RefundFailed: 'Our team is processing your refund and will contact you if anything is needed.',
};

export function bookingCancelled(v: BookingView): Rendered {
  const c = v.cancellation;
  const rows: [string, string | null][] = [
    ...bookingRows(v).filter(([k]) => k !== 'Status'),
    ['Status', 'Cancelled'],
    ['Cancellation fee', c ? euro(c.fee) : null],
    ['Refund amount', c ? euro(c.refundAmount) : null],
    ['Refund reference', c?.refundReference ?? null],
  ];
  const intro = `Dear ${v.customer.firstName}, your booking ${v.reference} has been cancelled.`;
  const refund = c ? refundStatusText[c.refundStatus] : '';
  return {
    subject: `Booking cancelled: ${v.reference}`,
    html: layout('Your booking is cancelled', `<p style="font-size:14px;line-height:1.6">${h(intro)}</p>${table(rows)}<p style="font-size:14px;line-height:1.6">${h(refund)}</p>`),
    text: `${intro}\n\n${textRows(rows)}\n\n${refund}\n\n${company.name} · ${company.phone} · ${company.email}`,
  };
}

export function officeBookingCancelled(v: BookingView): Rendered {
  const c = v.cancellation;
  const rows: [string, string | null][] = [
    ...bookingRows(v),
    ['Customer', `${v.customer.firstName} ${v.customer.lastName}`],
    ['Reason', c?.reason ?? null],
    ['Fee', c ? euro(c.fee) : null],
    ['Refund', c ? `${euro(c.refundAmount)} (${c.refundStatus})` : null],
  ];
  return { subject: `Booking cancelled ${v.reference}`, html: layout('Booking cancelled online', table(rows)), text: textRows(rows) };
}

export function officeRefundFailed(v: BookingView, payload: Record<string, unknown> | null): Rendered {
  const rows: [string, string | null][] = [
    ['Booking ID', v.reference],
    ['Customer', `${v.customer.firstName} ${v.customer.lastName} (${v.customer.email})`],
    ['Amount', payload?.amount !== undefined ? euro(Number(payload.amount)) : null],
    ['Error', payload?.reason ? String(payload.reason) : null],
  ];
  return {
    subject: `[ACTION] Refund failed for ${v.reference}`,
    html: layout('A refund needs attention', `<p style="font-size:14px">The automatic PayPal refund failed. Please refund the customer manually from PayPal.</p>${table(rows)}`),
    text: `The automatic PayPal refund failed. Please refund the customer manually.\n\n${textRows(rows)}`,
  };
}

export function officeEnquiry(payload: Record<string, unknown>): Rendered {
  const rows: [string, string | null][] = [
    ['Type', payload.type === 'Quote' ? 'Quote request' : 'Contact form'],
    ['Name', String(payload.name ?? '')],
    ['Email', String(payload.email ?? '')],
    ['Phone', payload.phone ? String(payload.phone) : null],
    ['Message', String(payload.message ?? '')],
  ];
  return {
    subject: `${payload.type === 'Quote' ? 'Quote request' : 'Website message'} from ${String(payload.name ?? '')}`,
    html: layout('New website enquiry', table(rows)),
    text: textRows(rows),
  };
}
