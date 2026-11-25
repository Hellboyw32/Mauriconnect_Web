import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool } from '../../src/database/pool';
import { auth, bookingBody, buildTestApp, createBooking, createPaidBooking, drainOutbox, query, uniqueWindow, useWindowBase } from './helpers';

const { api, provider, mailer, services } = buildTestApp();

beforeAll(() => useWindowBase(270));
afterAll(() => closePool());

async function newBooking(overrides: Record<string, unknown> = {}) {
  const res = await createBooking(api, bookingBody(uniqueWindow(), overrides));
  expect(res.status).toBe(201);
  return { reference: res.body.booking.reference as string, token: res.body.accessToken as string, total: res.body.booking.total as number };
}

const createOrder = (reference: string, token: string) => api.post('/api/payments/paypal/create-order').set(auth(token)).send({ bookingReference: reference });
const capture = (reference: string, token: string, orderId: string) =>
  api.post('/api/payments/paypal/capture-order').set(auth(token)).send({ bookingReference: reference, orderId });

const paymentsFor = (reference: string) =>
  query<{ PaymentStatus: string; PayPalOrderId: string; PayPalCaptureId: string | null; Amount: number; RefundAmount: number }>(
    `SELECT p.PaymentStatus, p.PayPalOrderId, p.PayPalCaptureId, p.Amount, p.RefundAmount
     FROM rental.Payments p JOIN rental.Bookings b ON b.BookingId = p.BookingId
     WHERE b.BookingReference = @r ORDER BY p.PaymentId`,
    { r: reference },
  );

describe('POST /api/payments/paypal/create-order', () => {
  it('creates an order for the amount stored on the booking', async () => {
    const { reference, token, total } = await newBooking();
    const res = await createOrder(reference, token).expect(201);
    expect(res.body.orderId).toMatch(/^FAKE-/);
    expect(provider.orders.get(res.body.orderId)).toMatchObject({ reference, amountCents: Math.round(total * 100), currency: 'EUR' });
    expect(await paymentsFor(reference)).toEqual([expect.objectContaining({ PaymentStatus: 'Pending', Amount: total })]);
  });

  it('reuses the open order when the customer clicks pay again', async () => {
    const { reference, token } = await newBooking();
    const first = await createOrder(reference, token).expect(201);
    const second = await createOrder(reference, token).expect(201);
    expect(second.body.orderId).toBe(first.body.orderId);
  });

  it('requires the booking token', async () => {
    const { reference } = await newBooking();
    await api.post('/api/payments/paypal/create-order').send({ bookingReference: reference }).expect(401);
    const other = await newBooking();
    await createOrder(reference, other.token).expect(403);
  });

  it('refuses to create an order for a paid booking', async () => {
    const paid = await createPaidBooking(api, bookingBody(uniqueWindow()));
    const res = await createOrder(paid.reference, paid.token).expect(409);
    expect(res.body.error.code).toBe('ALREADY_PAID');
  });

  it('renews an expired hold when payment restarts', async () => {
    const { reference, token } = await newBooking();
    await query("UPDATE rental.Bookings SET BookingStatus = 'Expired' WHERE BookingReference = @r", { r: reference });
    await createOrder(reference, token).expect(201);
    const [row] = await query<{ BookingStatus: string }>('SELECT BookingStatus FROM rental.Bookings WHERE BookingReference = @r', { r: reference });
    expect(row.BookingStatus).toBe('PendingPayment');
  });
});

describe('POST /api/payments/paypal/capture-order', () => {
  it('confirms the booking only after the server captures and verifies the payment', async () => {
    const { reference, token, total } = await newBooking();
    const { orderId } = (await createOrder(reference, token)).body;

    // Before capture: still unconfirmed, whatever the browser claims.
    expect((await api.get(`/api/bookings/${reference}`).set(auth(token))).body.status).toBe('PendingPayment');

    const res = await capture(reference, token, orderId).expect(200);
    expect(res.body.outcome).toBe('Confirmed');
    expect(res.body.booking).toMatchObject({
      status: 'Confirmed',
      paymentStatus: 'Successful',
      canPay: false,
      documents: { voucher: true },
      payment: { provider: 'Fake', status: 'Successful', amount: total, currency: 'EUR', transactionId: expect.stringMatching(/^FAKECAP-/) },
    });
    expect(provider.captureCalls).toContain(orderId);

    const [payment] = await paymentsFor(reference);
    expect(payment).toMatchObject({ PaymentStatus: 'Successful', PayPalOrderId: orderId, PayPalCaptureId: res.body.booking.payment.transactionId });
  });

  it('processes a repeated capture only once', async () => {
    const { reference, token } = await newBooking();
    const { orderId } = (await createOrder(reference, token)).body;
    const results = await Promise.all([capture(reference, token, orderId), capture(reference, token, orderId)]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    await capture(reference, token, orderId).expect(200);

    const payments = await paymentsFor(reference);
    expect(payments.filter((p) => p.PaymentStatus === 'Successful')).toHaveLength(1);
    const [{ n }] = await query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM rental.EmailOutbox o JOIN rental.Bookings b ON b.BookingId = o.BookingId
       WHERE b.BookingReference = @r AND o.Template = 'BookingConfirmed'`,
      { r: reference },
    );
    expect(n).toBe(1);
  });

  it('lets the customer retry after a declined payment without creating another booking', async () => {
    const { reference, token } = await newBooking();
    const first = (await createOrder(reference, token)).body.orderId;
    provider.queueCapture('decline');
    const declined = await capture(reference, token, first).expect(402);
    expect(declined.body.error.code).toBe('PAYMENT_DECLINED');
    let view = (await api.get(`/api/bookings/${reference}`).set(auth(token))).body;
    expect(view).toMatchObject({ status: 'PendingPayment', paymentStatus: 'Failed', canPay: true });

    // The failed order cannot be captured again; a new order is created for the retry.
    expect((await capture(reference, token, first)).body.error.code).toBe('PAYMENT_NOT_PENDING');
    const second = (await createOrder(reference, token).expect(201)).body.orderId;
    expect(second).not.toBe(first);
    await capture(reference, token, second).expect(200);

    view = (await api.get(`/api/bookings/${reference}`).set(auth(token))).body;
    expect(view).toMatchObject({ status: 'Confirmed', paymentStatus: 'Successful' });
    expect((await paymentsFor(reference)).map((p) => p.PaymentStatus)).toEqual(['Failed', 'Successful']);
  });

  it('reports a failed capture without charging or confirming', async () => {
    const { reference, token } = await newBooking();
    const { orderId } = (await createOrder(reference, token)).body;
    provider.queueCapture('fail');
    expect((await capture(reference, token, orderId).expect(402)).body.error.code).toBe('PAYMENT_FAILED');
    expect((await api.get(`/api/bookings/${reference}`).set(auth(token))).body.status).toBe('PendingPayment');
  });

  it('refunds and rejects a capture whose amount does not match the booking', async () => {
    const { reference, token } = await newBooking();
    const { orderId } = (await createOrder(reference, token)).body;
    provider.queueCapture('wrongAmount');
    const res = await capture(reference, token, orderId).expect(422);
    expect(res.body.error.code).toBe('PAYMENT_MISMATCH');

    const view = (await api.get(`/api/bookings/${reference}`).set(auth(token))).body;
    expect(view.status).toBe('PendingPayment');
    const [payment] = await paymentsFor(reference);
    expect(payment.PaymentStatus).toBe('Failed');
    expect(provider.refunds.some((r) => r.requestId.startsWith('refund-rejected-'))).toBe(true);
  });

  it('keeps the booking unconfirmed while the capture is pending', async () => {
    const { reference, token } = await newBooking();
    const { orderId } = (await createOrder(reference, token)).body;
    provider.queueCapture('pending');
    const res = await capture(reference, token, orderId).expect(202);
    expect(res.body).toMatchObject({ outcome: 'PaymentPending', booking: { status: 'PendingPayment' } });
  });

  it('rejects an order id that belongs to another booking', async () => {
    const a = await newBooking();
    const b = await newBooking();
    const { orderId } = (await createOrder(a.reference, a.token)).body;
    expect((await capture(b.reference, b.token, orderId).expect(404)).body.error.code).toBe('PAYMENT_NOT_FOUND');
  });
});

describe('PayPal webhook', () => {
  const send = (body: unknown, signature = 'valid') =>
    api.post('/api/payments/paypal/webhook').set('Content-Type', 'application/json').set('x-fake-signature', signature).send(JSON.stringify(body));

  it('confirms a booking whose browser never came back, once per event', async () => {
    const { reference, token, total } = await newBooking();
    const { orderId } = (await createOrder(reference, token)).body;
    const event = {
      id: `WH-${orderId}`,
      eventType: 'PAYMENT.CAPTURE.COMPLETED',
      orderId,
      captureId: `CAP-${orderId}`.slice(0, 30),
      amountCents: Math.round(total * 100),
      currency: 'EUR',
      customId: reference,
    };
    await send(event).expect(200);
    await send(event).expect(200);
    expect((await api.get(`/api/bookings/${reference}`).set(auth(token))).body).toMatchObject({ status: 'Confirmed', paymentStatus: 'Successful' });
    const [{ n }] = await query<{ n: number }>('SELECT COUNT(*) AS n FROM rental.PaymentEvents WHERE ProviderEventId = @id', { id: event.id });
    expect(n).toBe(1);
  });

  it('rejects an unsigned webhook', async () => {
    await send({ id: 'WH-forged', eventType: 'PAYMENT.CAPTURE.COMPLETED' }, 'forged').expect(401);
  });
});

describe('confirmation email and voucher', () => {
  it('emails the customer and the office with the PDF voucher after payment', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    await drainOutbox(services);

    const toCustomer = mailer.sent.find((m) => m.to === 'anna.martin@example.com' && m.subject.includes(reference));
    expect(toCustomer).toBeDefined();
    expect(toCustomer!.html).toContain('Anna');
    expect(toCustomer!.html).toContain('Toyota Vitz');
    expect(toCustomer!.text).toContain(reference);
    const attachment = toCustomer!.attachments?.[0];
    expect(attachment?.filename).toBe(`MauriConnect-voucher-${reference}.pdf`);
    expect(attachment?.content.subarray(0, 5).toString()).toBe('%PDF-');

    expect(mailer.sent.some((m) => m.to === 'office@example.test' && m.subject.includes(reference))).toBe(true);

    const docs = await query<{ DocumentType: string }>(
      'SELECT d.DocumentType FROM rental.BookingDocuments d JOIN rental.Bookings b ON b.BookingId = d.BookingId WHERE b.BookingReference = @r',
      { r: reference },
    );
    expect(docs.map((d) => d.DocumentType)).toContain('Voucher');

    const voucher = await api.get(`/api/bookings/${reference}/voucher`).set(auth(token)).buffer(true).expect(200);
    expect(voucher.headers['content-type']).toBe('application/pdf');
    expect(voucher.headers['content-disposition']).toContain(`MauriConnect-voucher-${reference}.pdf`);
    expect(Buffer.from(voucher.body).subarray(0, 5).toString()).toBe('%PDF-');
    // Footers sit in the bottom margin; a regression there adds blank pages.
    expect((Buffer.from(voucher.body).toString("latin1").match(/[/]Type [/]Page[^s]/g) ?? []).length).toBeLessThanOrEqual(2);
  });

  it('accepts the token as a query parameter for the voucher download link', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    await api.get(`/api/bookings/${reference}/voucher?token=${token}`).expect(200);
    await api.get(`/api/bookings/${reference}/voucher?token=nope`).expect(401);
  });

  it('keeps the booking confirmed and retries when the mail server is down', async () => {
    await drainOutbox(services);
    const { reference } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    mailer.failuresLeft = 100;
    await services.emails.processOutbox(25);
    mailer.failuresLeft = 0;

    const pending = await query<{ Status: string; Attempts: number; LastError: string }>(
      `SELECT o.Status, o.Attempts, o.LastError FROM rental.EmailOutbox o JOIN rental.Bookings b ON b.BookingId = o.BookingId
       WHERE b.BookingReference = @r AND o.Template = 'BookingConfirmed'`,
      { r: reference },
    );
    expect(pending[0]).toMatchObject({ Status: 'Pending', Attempts: 1, LastError: expect.stringContaining('SMTP') });
    const [booking] = await query<{ BookingStatus: string }>('SELECT BookingStatus FROM rental.Bookings WHERE BookingReference = @r', { r: reference });
    expect(booking.BookingStatus).toBe('Confirmed');

    // Next attempt is scheduled with backoff; bring it forward and the email goes out.
    await query("UPDATE rental.EmailOutbox SET NextAttemptAtUtc = SYSUTCDATETIME() WHERE Status = 'Pending'");
    await drainOutbox(services);
    expect(mailer.sent.some((m) => m.subject.includes(reference) && m.to === 'anna.martin@example.com')).toBe(true);
  });
});
