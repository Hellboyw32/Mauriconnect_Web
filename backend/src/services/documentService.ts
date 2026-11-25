import fs from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { company, keyTerms, rentalInstructions } from '../config/company';
import { formatEuro, toCents } from '../utils/money';
import { formatLocal, parseLocalDateTime } from '../utils/time';
import type { BookingView } from './bookingView';
import type { Deps } from './deps';

const BRAND = '#0B5C8A';
const ACCENT = '#F2A541';
const INK = '#1F2933';
const MUTED = '#5F6B7A';
const RULE = '#D9E2EC';
const PAGE_MARGIN = 48;

const euro = (amount: number) => formatEuro(toCents(amount));
const when = (localIso: string) => {
  const d = parseLocalDateTime(localIso);
  return d ? formatLocal(d, 'EEE d MMM yyyy, HH:mm') : localIso;
};
const statusLabel: Record<string, string> = {
  PendingPayment: 'Awaiting payment',
  Confirmed: 'Confirmed',
  InProgress: 'In progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Expired: 'Expired',
};

function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function header(doc: PDFKit.PDFDocument, title: string) {
  const width = doc.page.width;
  doc.rect(0, 0, width, 96).fill(BRAND);
  doc.rect(0, 96, width, 4).fill(ACCENT);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text('MauriConnect', PAGE_MARGIN, 30, { continued: false });
  doc.font('Helvetica').fontSize(10).fillColor('#D6E8F5').text('Car Rental Mauritius', PAGE_MARGIN, 60);
  doc
    .fontSize(9)
    .fillColor('#FFFFFF')
    .text(company.address, width - PAGE_MARGIN - 220, 28, { width: 220, align: 'right' })
    .text(`Tel / WhatsApp ${company.phone}`, { width: 220, align: 'right' })
    .text(company.email, { width: 220, align: 'right' })
    .text(company.website.replace('https://', ''), { width: 220, align: 'right' });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(title, PAGE_MARGIN, 124);
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string, x: number, y: number, width: number) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND).text(text.toUpperCase(), x, y, { width, characterSpacing: 0.5 });
  doc
    .moveTo(x, y + 14)
    .lineTo(x + width, y + 14)
    .lineWidth(0.75)
    .strokeColor(RULE)
    .stroke();
  return y + 22;
}

/** Label / value rows; returns the y after the block. */
function rows(doc: PDFKit.PDFDocument, items: [string, string | null | undefined][], x: number, y: number, width: number) {
  const labelWidth = 92;
  let cy = y;
  for (const [label, value] of items) {
    if (!value) continue;
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, x, cy, { width: labelWidth });
    doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(value, x + labelWidth, cy, { width: width - labelWidth });
    cy = Math.max(doc.y, cy + 13) + 3;
  }
  return cy;
}

function bulletList(doc: PDFKit.PDFDocument, items: readonly string[], x: number, y: number, width: number) {
  let cy = y;
  for (const item of items) {
    doc.circle(x + 3, cy + 4.5, 1.6).fill(ACCENT);
    doc.font('Helvetica').fontSize(8.8).fillColor(INK).text(item, x + 12, cy, { width: width - 12 });
    cy = doc.y + 3;
  }
  return cy;
}

function footer(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 58;
  // The footer sits inside the bottom margin; without this PDFKit treats it as overflow and adds a page.
  const bottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).lineWidth(0.75).strokeColor(RULE).stroke();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(BRAND)
    .text(`Emergency and support: ${company.phone} (24/7, phone and WhatsApp)`, PAGE_MARGIN, y + 10, { width: doc.page.width - 2 * PAGE_MARGIN, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(`${company.legalName} · ${company.address} · Office ${company.officeHours}`, { width: doc.page.width - 2 * PAGE_MARGIN, align: 'center' });
  doc.page.margins.bottom = bottomMargin;
}

function chargesTable(doc: PDFKit.PDFDocument, view: BookingView, x: number, y: number, width: number) {
  let cy = y;
  for (const c of view.charges) {
    doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(c.description, x, cy, { width: width - 90 });
    doc.text(euro(c.amount), x + width - 90, cy, { width: 90, align: 'right' });
    cy = doc.y + 4;
  }
  doc.moveTo(x, cy).lineTo(x + width, cy).lineWidth(0.75).strokeColor(RULE).stroke();
  cy += 6;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('Total', x, cy, { width: width - 90 });
  doc.text(euro(view.total), x + width - 90, cy, { width: 90, align: 'right' });
  return doc.y + 4;
}

export function createDocumentService(deps: Pick<Deps, 'bookings' | 'config'>) {
  const manageUrl = (reference: string, token: string) =>
    `${deps.config.publicSiteUrl}/manage-booking?ref=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`;

  async function renderVoucher(view: BookingView, accessLink: string): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, info: { Title: `Booking voucher ${view.reference}`, Author: company.name } });
    header(doc, 'Car rental voucher');
    const contentWidth = doc.page.width - 2 * PAGE_MARGIN;
    const colWidth = (contentWidth - 24) / 2;
    const left = PAGE_MARGIN;
    const right = PAGE_MARGIN + colWidth + 24;

    // Reference block with QR code
    const qr = await QRCode.toBuffer(accessLink, { margin: 0, width: 220, color: { dark: '#0B2A3C', light: '#FFFFFF' } });
    doc.roundedRect(left, 152, contentWidth, 78, 6).fillAndStroke('#F3F8FC', RULE);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Booking reference', left + 16, 166);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(INK).text(view.reference, left + 16, 180);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Status', left + 240, 166);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(view.status === 'Confirmed' ? '#1E7B46' : INK).text(statusLabel[view.status] ?? view.status, left + 240, 182);
    doc.image(qr, left + contentWidth - 78, 160, { width: 62, height: 62 });
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('Scan to manage', left + contentWidth - 150, 206, { width: 66, align: 'right' });

    // Customer | Vehicle
    let y = 248;
    const yCustomer = rows(
      doc,
      [
        ['Name', `${view.customer.firstName} ${view.customer.lastName}`],
        ['Email', view.customer.email],
        ['Mobile', view.customer.mobileNumber],
        ['Address', `${view.customer.address}, ${view.customer.city} ${view.customer.postalCode}`],
        ['Flight', view.travel.flightNumber],
        ['Arrival', view.travel.arrivalAt ? when(view.travel.arrivalAt) : null],
        ['Staying at', view.travel.accommodation],
      ],
      left,
      sectionTitle(doc, 'Customer', left, y, colWidth),
      colWidth,
    );
    const car = view.car;
    const yVehicle = rows(
      doc,
      [
        ['Vehicle', `${car.name} or similar`],
        ['Category', car.category],
        ['Transmission', car.transmission],
        ['Fuel', car.fuelType],
        ['Seats / doors', `${car.passengers} seats, ${car.doors} doors`],
        ['Luggage', `${car.luggage} large bag${car.luggage === 1 ? '' : 's'}`],
        ['Air conditioning', car.airConditioning ? 'Yes' : 'No'],
      ],
      right,
      sectionTitle(doc, 'Vehicle', right, y, colWidth),
      colWidth,
    );

    // Pickup | Return
    y = Math.max(yCustomer, yVehicle) + 10;
    const yPickup = rows(
      doc,
      [
        ['Date and time', when(view.pickup.at)],
        ['Location', view.pickup.location.name],
        ['Address', view.pickup.address ?? view.pickup.location.address],
      ],
      left,
      sectionTitle(doc, 'Pickup', left, y, colWidth),
      colWidth,
    );
    const yReturn = rows(
      doc,
      [
        ['Date and time', when(view.return.at)],
        ['Location', view.return.location.name],
        ['Address', view.return.address ?? view.return.location.address],
      ],
      right,
      sectionTitle(doc, 'Return', right, y, colWidth),
      colWidth,
    );

    // Price | Payment
    y = Math.max(yPickup, yReturn) + 10;
    const yPrice = chargesTable(doc, view, left, sectionTitle(doc, `Rental price (${view.rentalDays} days)`, left, y, colWidth), colWidth);
    const yPayment = rows(
      doc,
      [
        ['Amount paid', view.payment && view.payment.status !== 'Pending' ? euro(view.payment.amount) : 'Not paid'],
        ['Method', view.payment?.provider === 'Fake' ? 'Test payment' : view.payment?.provider ?? null],
        ['Payment ref.', view.payment?.transactionId ?? null],
        ['Paid on', view.payment?.paidAt ? when(view.payment.paidAt) : null],
        ['Deposit', view.securityDeposit ? `${euro(view.securityDeposit)} taken at pickup` : 'Taken at pickup'],
      ],
      right,
      sectionTitle(doc, 'Payment', right, y, colWidth),
      colWidth,
    );

    y = Math.max(yPrice, yPayment) + 10;
    y = bulletList(doc, rentalInstructions, left, sectionTitle(doc, 'Important rental instructions', left, y, contentWidth), contentWidth) + 6;
    // Key terms need about 120pt; move them to a second page only when they would run into the footer.
    if (y + 120 > doc.page.height - 66) {
      footer(doc);
      doc.addPage();
      y = PAGE_MARGIN;
    }
    bulletList(doc, keyTerms, left, sectionTitle(doc, 'Key terms and conditions', left, y, contentWidth), contentWidth);
    footer(doc);
    return toBuffer(doc);
  }

  async function renderCancellation(view: BookingView): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, info: { Title: `Cancellation ${view.reference}`, Author: company.name } });
    header(doc, 'Booking cancellation');
    const width = doc.page.width - 2 * PAGE_MARGIN;
    const c = view.cancellation;
    let y = sectionTitle(doc, 'Cancelled booking', PAGE_MARGIN, 160, width);
    y = rows(
      doc,
      [
        ['Reference', view.reference],
        ['Customer', `${view.customer.firstName} ${view.customer.lastName}`],
        ['Vehicle', `${view.car.name} or similar (${view.car.category})`],
        ['Rental', `${when(view.pickup.at)} to ${when(view.return.at)}`],
        ['Cancelled on', c ? when(c.cancelledAt) : null],
        ['Reason', c?.reason ?? null],
      ],
      PAGE_MARGIN,
      y,
      width,
    );
    y = sectionTitle(doc, 'Refund', PAGE_MARGIN, y + 12, width);
    const refundStatus: Record<string, string> = {
      NoRefundDue: 'No refund due',
      RefundPending: 'Refund being processed',
      Refunded: 'Refunded',
      RefundFailed: 'Refund being processed by our team',
    };
    rows(
      doc,
      [
        ['Amount paid', view.payment && view.payment.status !== 'Pending' && view.payment.status !== 'Cancelled' ? euro(view.payment.amount) : euro(0)],
        ['Cancellation fee', c ? `${euro(c.fee)} (${c.feePercent}%)` : null],
        ['Refund', c ? euro(c.refundAmount) : null],
        ['Refund status', c ? refundStatus[c.refundStatus] : null],
        ['Refund ref.', c?.refundReference ?? null],
      ],
      PAGE_MARGIN,
      y,
      width,
    );
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text('Refunds are returned to the PayPal account or card used for payment. Your bank may take a few days to show them.', PAGE_MARGIN, doc.y + 18, { width });
    footer(doc);
    return toBuffer(doc);
  }

  async function store(bookingId: number, reference: string, type: 'Voucher' | 'Cancellation', pdf: Buffer): Promise<string> {
    const dir = path.join(deps.config.storageDir, 'documents');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${reference}-${type.toLowerCase()}.pdf`);
    await fs.writeFile(file, pdf);
    await deps.bookings.addDocument(bookingId, type, path.relative(deps.config.storageDir, file));
    return file;
  }

  return { renderVoucher, renderCancellation, store, manageUrl };
}

export type DocumentService = ReturnType<typeof createDocumentService>;
