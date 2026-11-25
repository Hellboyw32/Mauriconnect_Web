import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool } from '../../src/database/pool';
import { auth, bookingBody, buildTestApp, createBooking, customer, query, uniqueWindow, useWindowBase } from './helpers';

const { api, services } = buildTestApp();

beforeAll(() => useWindowBase(150));
afterAll(() => closePool());

type BookingRow = { BookingReference: string; CarId: number | null; IsOutsourced: boolean; BookingStatus: string };
const rowsFor = (refs: string[]) =>
  query<BookingRow>(
    `SELECT BookingReference, CarId, IsOutsourced, BookingStatus FROM rental.Bookings
     WHERE BookingReference IN (SELECT value FROM STRING_SPLIT(@refs, ','))`,
    { refs: refs.join(',') },
  );

describe('POST /api/bookings', () => {
  it('creates an unpaid booking that holds a car, priced on the server', async () => {
    const w = uniqueWindow(4);
    const res = await createBooking(api, { ...bookingBody(w), total: 1, price: { total: 1 } });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    const booking = res.body.booking;
    expect(booking).toMatchObject({
      status: 'PendingPayment',
      paymentStatus: 'Pending',
      rentalDays: 4,
      subTotal: 96,
      additionalCharges: 0,
      total: 96,
      currency: 'EUR',
      canPay: true,
      canCancel: true,
      car: { slug: 'toyota-vitz', name: 'Toyota Vitz', category: 'Economy' },
      pickup: { at: w.pickupAt, location: { code: 'ssr-airport' } },
      customer: { email: 'anna.martin@example.com', mobileNumber: '+447400123456' },
      travel: { flightNumber: 'MK015', accommodation: 'Le Morne Beach Hotel' },
      documents: { voucher: false },
    });
    expect(booking.reference).toMatch(/^MC-\d{6}-[A-Z2-9]{4}$/);
    expect(booking.holdExpiresAt).toEqual(expect.any(String));
    // No internal ids in the public view.
    expect(JSON.stringify(booking)).not.toMatch(/"(bookingId|customerId|carId|carModelId|paymentId)"/);

    const [row] = await rowsFor([booking.reference]);
    expect(row).toMatchObject({ BookingStatus: 'PendingPayment', IsOutsourced: false });
    expect(row.CarId).not.toBeNull();
    const audit = await query('SELECT Action FROM rental.BookingAuditLog a JOIN rental.Bookings b ON b.BookingId = a.BookingId WHERE b.BookingReference = @r', {
      r: booking.reference,
    });
    expect(audit.map((a) => a.Action)).toEqual(['Created']);
  });

  it('returns the same booking when the request is repeated with the same Idempotency-Key', async () => {
    const body = bookingBody(uniqueWindow());
    const key = randomUUID();
    const first = await createBooking(api, body, key);
    const second = await createBooking(api, body, key);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.booking.reference).toBe(first.body.booking.reference);
  });

  it('rejects a malformed Idempotency-Key', async () => {
    const res = await createBooking(api, bookingBody(uniqueWindow()), 'short');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('validates the customer details and reports every invalid field', async () => {
    const res = await createBooking(api, bookingBody(uniqueWindow(), { customer: customer({ email: 'nope', mobileNumber: '123', firstName: '' }) }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(['customer.email', 'customer.mobileNumber', 'customer.firstName']),
    );
  });

  it('requires an address for hotel delivery and stores it', async () => {
    const w = uniqueWindow();
    const search = { pickupLocation: 'hotel-north', returnLocation: 'ssr-airport', ...w };
    const missing = await createBooking(api, bookingBody(w, { search }));
    expect(missing.status).toBe(422);
    expect(missing.body.error.code).toBe('ADDRESS_REQUIRED');

    const ok = await createBooking(api, bookingBody(w, { search, travel: { pickupAddress: 'LUX* Grand Baie, room 12' } }));
    expect(ok.status).toBe(201);
    expect(ok.body.booking.pickup).toMatchObject({ address: 'LUX* Grand Baie, room 12', location: { code: 'hotel-north' } });
  });

  it('rejects an unknown car and an invalid rental period', async () => {
    expect((await createBooking(api, bookingBody(uniqueWindow(), { carSlug: 'flying-car' }))).status).toBe(404);
    const w = uniqueWindow();
    const res = await createBooking(api, bookingBody({ pickupAt: w.pickupAt, returnAt: w.pickupAt }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('RETURN_BEFORE_PICKUP');
  });
});

describe('overlapping booking prevention', () => {
  it('never assigns the same car twice when bookings arrive at the same moment', async () => {
    const w = uniqueWindow(5);
    const results = await Promise.all(Array.from({ length: 4 }, () => createBooking(api, bookingBody(w, { carSlug: 'hyundai-accent' }))));
    expect(results.map((r) => r.status)).toEqual([201, 201, 201, 201]);

    const rows = await rowsFor(results.map((r) => r.body.booking.reference));
    const fleet = rows.filter((r) => !r.IsOutsourced);
    // Two fleet cars per model: two bookings get them, the rest are flagged for an outsourced car.
    expect(fleet).toHaveLength(2);
    expect(new Set(fleet.map((r) => r.CarId)).size).toBe(2);
    expect(rows.filter((r) => r.IsOutsourced).every((r) => r.CarId === null)).toBe(true);
  });

  it('refuses at the database level to put a car on two overlapping bookings', async () => {
    const w = uniqueWindow(4);
    const a = await createBooking(api, bookingBody(w, { carSlug: 'nissan-march' }));
    const b = await createBooking(api, bookingBody(w, { carSlug: 'nissan-march' }));
    const [rowA, rowB] = await rowsFor([a.body.booking.reference, b.body.booking.reference]).then((rows) =>
      [a, b].map((x) => rows.find((r) => r.BookingReference === x.body.booking.reference)!),
    );
    expect(rowA.CarId).not.toBe(rowB.CarId);
    await expect(query('UPDATE rental.Bookings SET CarId = @car WHERE BookingReference = @ref', { car: rowA.CarId, ref: rowB.BookingReference })).rejects.toThrow(
      /CAR_DOUBLE_BOOKED/,
    );
  });

  it('lets back-to-back rentals share a car', async () => {
    const w = uniqueWindow(3);
    const next = { pickupAt: w.returnAt, returnAt: uniqueWindow(3).returnAt };
    const refs: string[] = [];
    for (const window of [w, w, next, next]) refs.push((await createBooking(api, bookingBody(window, { carSlug: 'suzuki-swift' }))).body.booking.reference);
    const rows = await rowsFor(refs);
    expect(rows.every((r) => !r.IsOutsourced)).toBe(true);
  });

  it('holds no car invariant violation anywhere in the database', async () => {
    const clashes = await query(`
      SELECT a.BookingId FROM rental.Bookings a
      JOIN rental.Bookings b ON b.CarId = a.CarId AND b.BookingId > a.BookingId
       AND b.PickupDateTimeUtc < a.ReturnDateTimeUtc AND b.ReturnDateTimeUtc > a.PickupDateTimeUtc
      WHERE (a.BookingStatus IN ('Confirmed','InProgress') OR (a.BookingStatus = 'PendingPayment' AND a.HoldExpiresAtUtc > SYSUTCDATETIME()))
        AND (b.BookingStatus IN ('Confirmed','InProgress') OR (b.BookingStatus = 'PendingPayment' AND b.HoldExpiresAtUtc > SYSUTCDATETIME()))`);
    expect(clashes).toEqual([]);
  });
});

describe('booking holds', () => {
  it('frees the car when an unpaid hold expires', async () => {
    const w = uniqueWindow(4);
    const search = () => api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w });
    const fleetAvailable = async () =>
      (await search()).body.categories.flatMap((c: { cars: { slug: string; fleetAvailable: boolean }[] }) => c.cars).find((c: { slug: string }) => c.slug === 'toyota-rush')
        .fleetAvailable;

    const refs = [];
    for (let i = 0; i < 2; i++) refs.push((await createBooking(api, bookingBody(w, { carSlug: 'toyota-rush' }))).body.booking.reference);
    expect(await fleetAvailable()).toBe(false);

    await query('UPDATE rental.Bookings SET HoldExpiresAtUtc = DATEADD(MINUTE, -1, SYSUTCDATETIME()) WHERE BookingReference = @r', { r: refs[0] });
    expect(await fleetAvailable()).toBe(true);
    expect(await services.bookings.expireHolds()).toBeGreaterThanOrEqual(1);
    expect((await rowsFor([refs[0]]))[0].BookingStatus).toBe('Expired');
  });

  it('releases the hold when the customer goes back to choose another car', async () => {
    const created = await createBooking(api, bookingBody(uniqueWindow()));
    const { reference } = created.body.booking;
    const res = await api.post(`/api/bookings/${reference}/abandon`).set(auth(created.body.accessToken)).expect(200);
    expect(res.body).toMatchObject({ status: 'Expired', canPay: true });
  });
});

describe('booking lookup', () => {
  let reference: string;
  let token: string;

  beforeAll(async () => {
    const created = await createBooking(api, bookingBody(uniqueWindow()));
    reference = created.body.booking.reference;
    token = created.body.accessToken;
  });

  it('does not reveal a booking from its reference alone', async () => {
    const res = await api.get(`/api/bookings/${reference}`).expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(JSON.stringify(res.body)).not.toContain('Anna');
  });

  it('rejects a token issued for another booking', async () => {
    const other = await createBooking(api, bookingBody(uniqueWindow()));
    await api.get(`/api/bookings/${reference}`).set(auth(other.body.accessToken)).expect(403);
  });

  it('gives the same answer for a wrong email and an unknown reference', async () => {
    const wrongEmail = await api.post(`/api/bookings/${reference}/verify`).send({ email: 'someone@example.com' }).expect(404);
    const unknown = await api.post('/api/bookings/MC-200101-AAAA/verify').send({ email: 'anna.martin@example.com' }).expect(404);
    expect(wrongEmail.body.error).toEqual(unknown.body.error);
  });

  it('verifies with the booking email (any case) and issues an access token', async () => {
    const res = await api.post(`/api/bookings/${reference.toLowerCase()}/verify`).send({ email: ' Anna.Martin@EXAMPLE.com' }).expect(200);
    expect(res.body.booking.reference).toBe(reference);
    const view = await api.get(`/api/bookings/${reference}`).set(auth(res.body.accessToken)).expect(200);
    expect(view.body).toMatchObject({ reference, status: 'PendingPayment', customer: { lastName: 'Martin' } });
  });

  it('rejects a malformed reference before touching the database', async () => {
    const res = await api.post("/api/bookings/MC-1'%20OR%201=1/verify").send({ email: 'a@example.com' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('offers no voucher before payment', async () => {
    const res = await api.get(`/api/bookings/${reference}/voucher`).set(auth(token)).expect(404);
    expect(res.body.error.code).toBe('VOUCHER_NOT_AVAILABLE');
  });
});
