import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closePool } from '../../src/database/pool';
import { bookingBody, buildTestApp, createBooking, createPaidBooking, localIn, query, uniqueWindow, useWindowBase } from './helpers';

const { api } = buildTestApp();

beforeAll(() => useWindowBase(20));
afterAll(() => closePool());

describe('GET catalogue', () => {
  it('lists the six rental locations with the airport first', async () => {
    const res = await api.get('/api/locations').expect(200);
    expect(res.body).toHaveLength(6);
    expect(res.body[0]).toMatchObject({ code: 'ssr-airport', name: 'SSR Intl Airport', type: 'Office' });
    expect(res.body[0]).not.toHaveProperty('id');
  });

  it('lists the car categories in display order', async () => {
    const res = await api.get('/api/cars/categories').expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual(['Mini', 'Economy', 'Intermediate', 'Full Size']);
  });

  it('returns one car by slug and 404 for an unknown one', async () => {
    const res = await api.get('/api/cars/suzuki-ertiga').expect(200);
    expect(res.body).toMatchObject({ name: 'Suzuki Ertiga', passengers: 7, category: 'Full Size' });
    await api.get('/api/cars/unknown-car').expect(404);
  });
});

describe('POST /api/cars/search', () => {
  it('returns every car grouped by category with server-side prices', async () => {
    const w = uniqueWindow(5);
    const res = await api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w }).expect(200);
    expect(res.body.search.rentalDays).toBe(5);
    expect(res.body.categories.map((c: { name: string }) => c.name)).toEqual(['Mini', 'Economy', 'Intermediate', 'Full Size']);
    const cars = res.body.categories.flatMap((c: { cars: unknown[] }) => c.cars);
    expect(cars).toHaveLength(11);
    const presso = cars.find((c: { slug: string }) => c.slug === 'suzuki-s-presso');
    expect(presso).toMatchObject({ dailyRate: 20, total: 100, currency: 'EUR', fleetAvailable: true });
  });

  it('counts a started day after the grace period', async () => {
    const pickupAt = localIn(40 * 24);
    const returnAt = localIn(40 * 24 + 3 * 24 + 1); // 3 days + 1 hour > 59 min grace
    const res = await api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt, returnAt }).expect(200);
    expect(res.body.search.rentalDays).toBe(4);
  });

  it('rejects a return before pickup', async () => {
    const res = await api
      .post('/api/cars/search')
      .send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt: localIn(24 * 30), returnAt: localIn(24 * 29) })
      .expect(422);
    expect(res.body.error.code).toBe('RETURN_BEFORE_PICKUP');
  });

  it('enforces the 3-day minimum rental', async () => {
    const res = await api
      .post('/api/cars/search')
      .send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt: localIn(24 * 30), returnAt: localIn(24 * 32) })
      .expect(422);
    expect(res.body.error.code).toBe('RENTAL_TOO_SHORT');
  });

  it('requires 24 hours notice', async () => {
    const res = await api
      .post('/api/cars/search')
      .send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt: localIn(5), returnAt: localIn(5 + 96) })
      .expect(422);
    expect(res.body.error.code).toBe('PICKUP_TOO_SOON');
  });

  it('validates input format and unknown locations', async () => {
    const bad = await api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt: '10/12/2026', returnAt: 'x' }).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    expect(bad.body.error.details.map((d: { path: string }) => d.path)).toEqual(expect.arrayContaining(['pickupAt', 'returnAt']));
    const w = uniqueWindow();
    const unknown = await api.post('/api/cars/search').send({ pickupLocation: 'mars', returnLocation: 'ssr-airport', ...w }).expect(400);
    expect(unknown.body.error.code).toBe('INVALID_LOCATION');
  });

  it('shows the fleet as unavailable once every car of a model is held, but still sells it', async () => {
    const w = uniqueWindow(4);
    // Two fleet cars per model in the development seed.
    for (let i = 0; i < 2; i++) expect((await createBooking(api, bookingBody(w, { carSlug: 'suzuki-ciaz' }))).status).toBe(201);
    const res = await api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w }).expect(200);
    const ciaz = res.body.categories.flatMap((c: { cars: unknown[] }) => c.cars).find((c: { slug: string }) => c.slug === 'suzuki-ciaz');
    expect(ciaz).toMatchObject({ fleetAvailable: false });
    const another = res.body.categories.flatMap((c: { cars: unknown[] }) => c.cars).find((c: { slug: string }) => c.slug === 'nissan-almera');
    expect(another).toMatchObject({ fleetAvailable: true });
  });
});

describe('POST /api/quotes', () => {
  it('prices extras with per-day rates and caps', async () => {
    const w = uniqueWindow(12);
    const res = await api
      .post('/api/quotes')
      .send({
        pickupLocation: 'ssr-airport',
        returnLocation: 'ssr-airport',
        ...w,
        carSlug: 'toyota-vitz',
        extras: [
          { code: 'full-insurance', quantity: 1 },
          { code: 'child-seat', quantity: 2 },
        ],
      })
      .expect(200);
    // 12 days x 24 = 288; insurance 12 x 8 = 96; child seat 12 x 3 = 36 capped at 30, x2 = 60
    expect(res.body.price).toMatchObject({ rentalDays: 12, subTotal: 288, additionalCharges: 156, total: 444 });
  });

  it('rejects unknown extras and too many units', async () => {
    const w = uniqueWindow();
    const base = { pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w, carSlug: 'toyota-vitz' };
    expect((await api.post('/api/quotes').send({ ...base, extras: [{ code: 'jetpack', quantity: 1 }] })).body.error.code).toBe('INVALID_EXTRA');
    expect((await api.post('/api/quotes').send({ ...base, extras: [{ code: 'gps', quantity: 2 }] })).body.error.code).toBe('INVALID_EXTRA');
  });
});

describe('ratings and badges', () => {
  const searchCars = async () => {
    const w = uniqueWindow();
    const res = await api.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w }).expect(200);
    return res.body.categories.flatMap((c: { cars: unknown[] }) => c.cars) as { slug: string; rating: unknown; badges: string[] }[];
  };

  it('never shows sample ratings unless SHOW_SAMPLE_REVIEWS is on', async () => {
    await query(`INSERT INTO rental.CarReviews (CarModelId, Rating, IsSample)
                 SELECT CarModelId, 5, 1 FROM rental.CarModels CROSS JOIN (VALUES (1),(2),(3),(4),(5)) n(n) WHERE Slug = 'suzuki-s-presso'`);
    const presso = (await searchCars()).find((c) => c.slug === 'suzuki-s-presso')!;
    expect(presso.rating).toBeNull();

    // The same API configured to include demo data, as in development.
    const demoApi = buildTestApp({ showSampleReviews: true }).api;
    const w = uniqueWindow();
    const res = await demoApi.post('/api/cars/search').send({ pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...w }).expect(200);
    const demoPresso = res.body.categories.flatMap((c: { cars: unknown[] }) => c.cars).find((c: { slug: string }) => c.slug === 'suzuki-s-presso');
    expect(demoPresso.rating).toEqual({ average: 5, count: 5, sample: true });
  });

  it('shows ratings from real renters, one per booking', async () => {
    const bookings = [];
    for (let i = 0; i < 3; i++) bookings.push(await createPaidBooking(api, bookingBody(uniqueWindow(), { carSlug: 'nissan-almera' })));
    for (const [i, b] of bookings.entries()) {
      await query(
        `INSERT INTO rental.CarReviews (CarModelId, BookingId, Rating)
         SELECT CarModelId, BookingId, @rating FROM rental.Bookings WHERE BookingReference = @ref`,
        { ref: b.reference, rating: [5, 4, 4][i] },
      );
    }
    await expect(
      query(`INSERT INTO rental.CarReviews (CarModelId, BookingId, Rating) SELECT CarModelId, BookingId, 1 FROM rental.Bookings WHERE BookingReference = @ref`, { ref: bookings[0].reference }),
    ).rejects.toThrow(/UX_CarReviews_Booking/);
    await expect(query(`INSERT INTO rental.CarReviews (CarModelId, Rating) SELECT CarModelId, 5 FROM rental.CarModels WHERE Slug = 'nissan-almera'`)).rejects.toThrow(
      /CK_CarReviews_Verified/,
    );

    const almera = (await searchCars()).find((c) => c.slug === 'nissan-almera')!;
    expect(almera.rating).toEqual({ average: 4.3, count: 3, sample: false });
    const car = await api.get('/api/cars/nissan-almera').expect(200);
    expect(car.body.rating).toEqual({ average: 4.3, count: 3, sample: false });
  });

  it('gives "Most rented" to exactly one car once there are enough rentals', async () => {
    const cars = await searchCars();
    expect(cars.filter((c) => c.badges.includes('MostRented'))).toHaveLength(1);
  });
});
