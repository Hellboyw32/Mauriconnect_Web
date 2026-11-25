import { describe, expect, it } from 'vitest';
import { bookingSessionReducer, emptySession, fingerprint, loadSession, saveSession } from '../src/hooks/bookingSession';
import type { CreateBookingRequest } from '../src/types/api';

const search = { pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt: '2027-03-10T10:00', returnAt: '2027-03-17T10:00' };

const request = (overrides: Partial<CreateBookingRequest> = {}): CreateBookingRequest => ({
  search,
  carSlug: 'toyota-vitz',
  extras: [],
  customer: {
    firstName: 'Anna',
    lastName: 'Martin',
    email: 'anna@example.com',
    mobileNumber: '+44 7400 123456',
    country: 'GB',
    nationality: 'FR',
    address: '1 High St',
    city: 'London',
    postalCode: 'SW1',
  },
  travel: {},
  ...overrides,
});

describe('bookingSessionReducer', () => {
  it('keeps the customer details when the search or the car changes', () => {
    let s = bookingSessionReducer(emptySession, { type: 'search', search });
    s = bookingSessionReducer(s, { type: 'selectCar', carSlug: 'toyota-vitz' });
    s = bookingSessionReducer(s, { type: 'form', values: { firstName: 'Anna' } });
    s = bookingSessionReducer(s, { type: 'selectCar', carSlug: 'suzuki-ciaz' });
    expect(s.form).toEqual({ firstName: 'Anna' });
    s = bookingSessionReducer(s, { type: 'search', search: { ...search, returnAt: '2027-03-18T10:00' } });
    expect(s).toMatchObject({ carSlug: null, form: { firstName: 'Anna' } });
  });

  it('keeps the chosen car and extras when the same search is repeated', () => {
    let s = bookingSessionReducer(emptySession, { type: 'search', search });
    s = bookingSessionReducer(s, { type: 'selectCar', carSlug: 'toyota-vitz' });
    s = bookingSessionReducer(s, { type: 'extras', extras: [{ code: 'gps', quantity: 1 }] });
    s = bookingSessionReducer(s, { type: 'search', search: { ...search } });
    expect(s).toMatchObject({ carSlug: 'toyota-vitz', extras: [{ code: 'gps', quantity: 1 }] });
  });

  it('resets extras when another car is chosen and drops zero quantities', () => {
    let s = bookingSessionReducer(emptySession, { type: 'extras', extras: [{ code: 'gps', quantity: 1 }, { code: 'child-seat', quantity: 0 }] });
    expect(s.extras).toEqual([{ code: 'gps', quantity: 1 }]);
    s = bookingSessionReducer(s, { type: 'selectCar', carSlug: 'nissan-march' });
    expect(s.extras).toEqual([]);
  });

  it('clears the pending idempotency key once the booking exists', () => {
    let s = bookingSessionReducer(emptySession, { type: 'pendingKey', fingerprint: 'fp', key: 'k' });
    s = bookingSessionReducer(s, { type: 'bookingCreated', booking: { reference: 'MC-270310-ABCD', token: 't', fingerprint: 'fp' } });
    expect(s).toMatchObject({ pendingKey: null, booking: { reference: 'MC-270310-ABCD' } });
    expect(bookingSessionReducer(s, { type: 'reset' })).toEqual(emptySession);
  });
});

describe('fingerprint', () => {
  it('ignores the order of extras and zero quantities', () => {
    const a = fingerprint(request({ extras: [{ code: 'gps', quantity: 1 }, { code: 'child-seat', quantity: 2 }] }));
    const b = fingerprint(request({ extras: [{ code: 'child-seat', quantity: 2 }, { code: 'booster-seat', quantity: 0 }, { code: 'gps', quantity: 1 }] }));
    expect(a).toBe(b);
  });

  it('changes when anything that affects the booking changes', () => {
    expect(fingerprint(request())).not.toBe(fingerprint(request({ carSlug: 'suzuki-ciaz' })));
    expect(fingerprint(request())).not.toBe(fingerprint(request({ travel: { flightNumber: 'MK015' } })));
  });
});

describe('session persistence', () => {
  it('round-trips through storage and survives corrupt data', () => {
    const s = bookingSessionReducer(emptySession, { type: 'search', search });
    saveSession(s, sessionStorage);
    expect(loadSession(sessionStorage)).toEqual(s);
    sessionStorage.setItem('mauriconnect.booking.v1', '{not json');
    expect(loadSession(sessionStorage)).toEqual(emptySession);
  });
});
