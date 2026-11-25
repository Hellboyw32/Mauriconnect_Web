import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createServices } from '../../src/container';
import { getPool } from '../../src/database/pool';
import { FakePaymentProvider } from '../../src/payments/fakeProvider';
import { bookingRepository } from '../../src/repositories/bookingRepository';
import { catalogRepository } from '../../src/repositories/catalogRepository';
import { enquiryRepository } from '../../src/repositories/enquiryRepository';
import { outboxRepository } from '../../src/repositories/outboxRepository';
import { paymentRepository } from '../../src/repositories/paymentRepository';
import { MemoryMailer } from '../../src/services/mailer';
import { toLocalIso } from '../../src/utils/time';

export function buildTestApp(options: { adminApiKey?: string; showSampleReviews?: boolean } = {}) {
  const provider = new FakePaymentProvider();
  const mailer = new MemoryMailer();
  const services = createServices({
    catalog: catalogRepository,
    bookings: bookingRepository,
    payments: paymentRepository,
    outbox: outboxRepository,
    enquiries: enquiryRepository,
    provider,
    mailer,
    clock: () => new Date(),
    config: {
      officeEmail: 'office@example.test',
      publicSiteUrl: 'http://localhost:5173',
      jwtSecret: process.env.JWT_SECRET!,
      bookingTokenTtlMinutes: 60,
      linkTokenTtlDays: 30,
      storageDir: path.join(os.tmpdir(), `mauriconnect-test-${process.pid}`),
      cacheSeconds: 0,
      showSampleReviews: options.showSampleReviews ?? false,
    },
  });
  const app = createApp({
    services,
    corsOrigins: ['http://localhost:5173'],
    trustProxy: false,
    rateLimitsEnabled: false,
    adminApiKey: options.adminApiKey ?? 'test-admin-key',
    publicConfig: { paymentProvider: 'fake', paypalClientId: null },
  });
  return { app, api: request(app), provider, mailer, services };
}

/** Local Mauritius time "YYYY-MM-DDTHH:mm", `hours` from now, rounded to the hour. */
export function localIn(hours: number): string {
  const d = new Date(Date.now() + hours * 3_600_000);
  d.setUTCMinutes(0, 0, 0);
  return toLocalIso(d);
}

let windowBaseDays = 30;
let windowSeq = 0;

/** Each test file owns a separate range of dates (bookings persist across files in the shared test DB). */
export function useWindowBase(days: number) {
  windowBaseDays = days;
  windowSeq = 0;
}

/**
 * A unique rental window per test, 6 days apart, so tests never compete for the same cars
 * unless they intend to. Up to 18 windows per file.
 */
export function uniqueWindow(days = 4) {
  windowSeq++;
  if (windowSeq > 18) throw new Error('Too many windows for this file: give it another base');
  const startHours = (windowBaseDays + windowSeq * 6) * 24 + 10;
  return { pickupAt: localIn(startHours), returnAt: localIn(startHours + days * 24) };
}

export const customer = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Anna',
  lastName: 'Martin',
  email: 'anna.martin@example.com',
  mobileNumber: '+44 7400 123456',
  country: 'GB',
  nationality: 'FR',
  address: '10 Downing Street',
  city: 'London',
  postalCode: 'SW1A 2AA',
  ...overrides,
});

export function bookingBody(window: { pickupAt: string; returnAt: string }, overrides: Record<string, unknown> = {}) {
  return {
    search: { pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', ...window },
    carSlug: 'toyota-vitz',
    extras: [],
    customer: customer(),
    travel: { flightNumber: 'MK015', accommodation: 'Le Morne Beach Hotel' },
    ...overrides,
  };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function createBooking(api: ReturnType<typeof request>, body: Record<string, unknown>, key: string = randomUUID()) {
  return api.post('/api/bookings').set('Idempotency-Key', key).send(body);
}

/** Creates and pays a booking; returns reference + token. */
export async function createPaidBooking(api: ReturnType<typeof request>, body: Record<string, unknown>) {
  const created = await createBooking(api, body);
  if (created.status !== 201) throw new Error(`Booking failed: ${JSON.stringify(created.body)}`);
  const reference = created.body.booking.reference as string;
  const token = created.body.accessToken as string;
  const order = await api.post('/api/payments/paypal/create-order').set(auth(token)).send({ bookingReference: reference });
  const capture = await api.post('/api/payments/paypal/capture-order').set(auth(token)).send({ bookingReference: reference, orderId: order.body.orderId });
  if (capture.status !== 200) throw new Error(`Capture failed: ${JSON.stringify(capture.body)}`);
  return { reference, token, orderId: order.body.orderId as string };
}

/** Sends every due email in the shared outbox (other files' emails included). */
export async function drainOutbox(services: ReturnType<typeof buildTestApp>['services']) {
  for (let i = 0; i < 50 && (await services.emails.processOutbox(25)) > 0; i++);
}

export async function query<T = Record<string, unknown>>(text: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const req = (await getPool()).request();
  for (const [k, v] of Object.entries(params)) req.input(k, v);
  return (await req.query(text)).recordset as T[];
}
