import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool } from '../../src/database/pool';
import { auth, bookingBody, buildTestApp, createBooking, createPaidBooking, drainOutbox, localIn, query, uniqueWindow, useWindowBase } from './helpers';

const { api, provider, mailer, services } = buildTestApp({ adminApiKey: 'test-admin-key' });

beforeAll(() => useWindowBase(390));
afterAll(() => closePool());

/** A pickup about 30 hours away: inside the 48-hour late-cancellation window. */
const soonWindow = () => ({ pickupAt: localIn(30), returnAt: localIn(30 + 4 * 24) });

const cancel = (reference: string, token: string, reason: string | null = 'Change of plans') =>
  api.post(`/api/bookings/${reference}/cancel`).set(auth(token)).send({ reason });
const quote = (reference: string, token: string) => api.get(`/api/bookings/${reference}/cancellation-quote`).set(auth(token));

const auditFor = async (reference: string) =>
  (
    await query<{ Action: string }>(
      'SELECT a.Action FROM rental.BookingAuditLog a JOIN rental.Bookings b ON b.BookingId = a.BookingId WHERE b.BookingReference = @r ORDER BY a.AuditId',
      { r: reference },
    )
  ).map((a) => a.Action);

describe('cancellation quote', () => {
  it('shows the policy, the fee and the refund before the customer confirms', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow(4)));
    const res = await quote(reference, token).expect(200);
    expect(res.body).toMatchObject({ allowed: true, reason: null, feePercent: 0, fee: 0, refundAmount: 96, paidAmount: 96, currency: 'EUR' });
    expect(res.body.policy).toEqual([
      { hoursBeforePickup: 48, feePercent: 0 },
      { hoursBeforePickup: 0, feePercent: 50 },
    ]);
  });

  it('applies the late-cancellation fee inside 48 hours', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(soonWindow(), { carSlug: 'hyundai-creta' }));
    const res = await quote(reference, token).expect(200);
    // 4 days x 45 = 180, 50 % fee
    expect(res.body).toMatchObject({ allowed: true, feePercent: 50, fee: 90, refundAmount: 90 });
  });
});

describe('POST /api/bookings/:reference/cancel', () => {
  it('cancels a paid booking, refunds it in full and emails a cancellation document', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow(4)));
    const res = await cancel(reference, token).expect(200);
    expect(res.body.alreadyCancelled).toBe(false);
    expect(res.body.booking).toMatchObject({
      status: 'Cancelled',
      paymentStatus: 'Refunded',
      canCancel: false,
      canPay: false,
      documents: { voucher: false, cancellation: true },
      cancellation: { reason: 'Change of plans', fee: 0, refundAmount: 96, refundStatus: 'Refunded', refundReference: `FAKEREF-refund-${reference}` },
      payment: { status: 'Refunded', refundAmount: 96 },
    });
    expect(provider.refunds.filter((r) => r.requestId === `refund-${reference}`)).toEqual([expect.objectContaining({ amountCents: 9600 })]);

    expect(await auditFor(reference)).toEqual(['Created', 'PaymentCaptured', 'Cancelled', 'Refunded']);

    await drainOutbox(services);
    const email = mailer.sent.find((m) => m.to === 'anna.martin@example.com' && m.subject.includes(reference) && /cancel/i.test(m.subject));
    expect(email?.attachments?.[0].filename).toBe(`MauriConnect-cancellation-${reference}.pdf`);
    expect(mailer.sent.some((m) => m.to === 'office@example.test' && m.subject.includes(reference) && /cancel/i.test(m.subject))).toBe(true);

    const doc = await api.get(`/api/bookings/${reference}/cancellation-document`).set(auth(token)).buffer(true).expect(200);
    expect(Buffer.from(doc.body).subarray(0, 5).toString()).toBe('%PDF-');
    await api.get(`/api/bookings/${reference}/voucher`).set(auth(token)).expect(404);
  });

  it('keeps the fee on a late cancellation and refunds the rest', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(soonWindow(), { carSlug: 'hyundai-creta' }));
    const res = await cancel(reference, token).expect(200);
    expect(res.body.booking).toMatchObject({
      status: 'Cancelled',
      paymentStatus: 'PartiallyRefunded',
      cancellation: { feePercent: 50, fee: 90, refundAmount: 90, refundStatus: 'Refunded' },
      payment: { refundAmount: 90 },
    });
  });

  it('cancels an unpaid booking without promising a refund', async () => {
    const created = await createBooking(api, bookingBody(uniqueWindow()));
    const { reference } = created.body.booking;
    const res = await cancel(reference, created.body.accessToken, null).expect(200);
    expect(res.body.booking).toMatchObject({ status: 'Cancelled', paymentStatus: 'Cancelled', cancellation: { refundAmount: 0, refundStatus: 'NoRefundDue' } });
    expect(provider.refunds.some((r) => r.requestId === `refund-${reference}`)).toBe(false);
  });

  it('handles duplicate cancellation requests once', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    const results = await Promise.all([cancel(reference, token), cancel(reference, token), cancel(reference, token)]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(results.filter((r) => r.body.alreadyCancelled === false)).toHaveLength(1);

    const [{ n }] = await query<{ n: number }>(
      'SELECT COUNT(*) AS n FROM rental.BookingCancellation c JOIN rental.Bookings b ON b.BookingId = c.BookingId WHERE b.BookingReference = @r',
      { r: reference },
    );
    expect(n).toBe(1);
    expect(provider.refunds.filter((r) => r.requestId === `refund-${reference}`)).toHaveLength(1);
    expect((await auditFor(reference)).filter((a) => a === 'Refunded')).toHaveLength(1);
  });

  it('records a failed refund, alerts the office and retries on the next request', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    provider.failRefunds(true);
    try {
      const failed = await cancel(reference, token).expect(200);
      expect(failed.body.booking).toMatchObject({ status: 'Cancelled', paymentStatus: 'Successful', cancellation: { refundStatus: 'RefundFailed' } });
    } finally {
      provider.failRefunds(false);
    }
    const alerts = await query(
      `SELECT o.ToAddress FROM rental.EmailOutbox o JOIN rental.Bookings b ON b.BookingId = o.BookingId
       WHERE b.BookingReference = @r AND o.Template = 'OfficeRefundFailed'`,
      { r: reference },
    );
    expect(alerts).toEqual([{ ToAddress: 'office@example.test' }]);

    const retried = await cancel(reference, token).expect(200);
    expect(retried.body).toMatchObject({ alreadyCancelled: true, booking: { paymentStatus: 'Refunded', cancellation: { refundStatus: 'Refunded' } } });
  });

  it('never cancels a completed rental', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    await query("UPDATE rental.Bookings SET BookingStatus = 'Completed' WHERE BookingReference = @r", { r: reference });
    expect((await quote(reference, token)).body).toMatchObject({ allowed: false, refundAmount: 0 });
    const res = await cancel(reference, token).expect(409);
    expect(res.body.error.code).toBe('BOOKING_NOT_CANCELLABLE');
    expect(provider.refunds.some((r) => r.requestId === `refund-${reference}`)).toBe(false);
  });

  it('refuses online cancellation once the pickup time has passed', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    await query(
      `UPDATE rental.Bookings SET PickupDateTimeUtc = DATEADD(DAY, -2, SYSUTCDATETIME()), ReturnDateTimeUtc = DATEADD(HOUR, -1, SYSUTCDATETIME())
       WHERE BookingReference = @r`,
      { r: reference },
    );
    const res = await cancel(reference, token).expect(409);
    expect(res.body.error.message).toMatch(/pickup time has passed/);
  });

  it('frees the car for other customers', async () => {
    const w = uniqueWindow(4);
    const paid = [];
    for (let i = 0; i < 2; i++) paid.push(await createPaidBooking(api, bookingBody(w, { carSlug: 'suzuki-ertiga' })));
    const ertiga = async () =>
      (await api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w })).body.categories
        .flatMap((c: { cars: { slug: string }[] }) => c.cars)
        .find((c: { slug: string }) => c.slug === 'suzuki-ertiga');
    expect((await ertiga()).fleetAvailable).toBe(false);
    await cancel(paid[0].reference, paid[0].token).expect(200);
    expect((await ertiga()).fleetAvailable).toBe(true);
  });
});

describe('POST /api/payments/paypal/refund (office)', () => {
  const refund = (body: Record<string, unknown>, key?: string) => {
    const req = api.post('/api/payments/paypal/refund');
    if (key) req.set('x-api-key', key);
    return req.send(body);
  };

  it('requires the office API key', async () => {
    const { reference } = await createPaidBooking(api, bookingBody(uniqueWindow()));
    await refund({ bookingReference: reference }).expect(401);
    await refund({ bookingReference: reference }, 'wrong-key').expect(401);
  });

  it('issues a partial goodwill refund on a paid booking', async () => {
    const { reference } = await createPaidBooking(api, bookingBody(uniqueWindow(4)));
    const res = await refund({ bookingReference: reference, amount: 20 }, 'test-admin-key').expect(200);
    expect(res.body).toMatchObject({ status: 'Confirmed', paymentStatus: 'PartiallyRefunded', payment: { refundAmount: 20 } });
  });

  it('refunds the fee kept on a late cancellation as a separate refund', async () => {
    const { reference, token } = await createPaidBooking(api, bookingBody(soonWindow(), { carSlug: 'toyota-rush' }));
    await cancel(reference, token).expect(200); // 4 x 43 = 172, refund 86, fee 86
    const res = await refund({ bookingReference: reference }, 'test-admin-key').expect(200);
    expect(res.body).toMatchObject({ paymentStatus: 'Refunded', payment: { refundAmount: 172 } });
    const issued = provider.refunds.filter((r) => r.requestId.startsWith(`refund-${reference}`));
    expect(issued.map((r) => r.amountCents)).toEqual([8600, 8600]);

    // Nothing left to refund.
    expect((await refund({ bookingReference: reference }, 'test-admin-key').expect(409)).body.error.code).toBe('NOTHING_TO_REFUND');
  });
});
