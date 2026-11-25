import { describe, expect, it } from 'vitest';
import { buildBookingRequest } from '../src/utils/bookingRequest';
import { joinPhone, splitPhone } from '../src/utils/countries';
import { addDays, defaultSearchDates, minutesBetween, nowInMauritius, rentalDays } from '../src/utils/datetime';
import { formatLocalDate, formatLocalDateTime, formatMoney } from '../src/utils/format';
import { searchFromQuery, searchToQuery } from '../src/utils/searchParams';
import { customerFormRefined, lookupSchema, serverFieldName, type CustomerFormValues } from '../src/utils/validation';

describe('Mauritius date helpers', () => {
  it('gives Mauritius wall-clock time whatever the browser time zone', () => {
    expect(nowInMauritius(new Date('2027-03-09T21:30:00Z'))).toBe('2027-03-10T01:30');
  });

  it('defaults the search to a week starting in two days', () => {
    expect(defaultSearchDates(new Date('2027-12-30T08:00:00Z'))).toEqual({ pickupDate: '2028-01-01', pickupTime: '10:00', returnDate: '2028-01-08', returnTime: '10:00' });
  });

  it('previews rental days like the server', () => {
    expect(rentalDays('2027-03-10T10:00', '2027-03-13T10:59')).toBe(3);
    expect(rentalDays('2027-03-10T10:00', '2027-03-13T11:00')).toBe(4);
    expect(rentalDays('2027-03-10T10:00', '2027-03-10T09:00')).toBe(0);
    expect(minutesBetween('2027-03-31T23:00', '2027-04-01T01:00')).toBe(120);
    expect(addDays('2028-02-28', 2)).toBe('2028-03-01');
  });

  it('formats local times without shifting them', () => {
    expect(formatLocalDate('2027-03-10T23:30')).toBe('Wed 10 Mar 2027');
    expect(formatLocalDateTime('2027-03-10T23:30')).toBe('Wed 10 Mar 2027, 23:30');
    expect(formatMoney(1234.5)).toBe('€1,234.50');
  });
});

describe('search URL', () => {
  it('round-trips and rejects incomplete criteria', () => {
    const c = { pickupLocation: 'ssr-airport', returnLocation: 'hotel-north', pickupAt: '2027-03-10T10:00', returnAt: '2027-03-17T10:00' };
    expect(searchFromQuery(new URLSearchParams(searchToQuery(c)))).toEqual(c);
    expect(searchFromQuery(new URLSearchParams('from=ssr-airport&to=ssr-airport&pickup=tomorrow'))).toBeNull();
  });
});

describe('phone numbers', () => {
  it('joins the dialling code and drops a national leading zero', () => {
    expect(joinPhone('GB', '07400 123456')).toBe('+44 7400 123456');
    expect(joinPhone('MU', '+230 5251 2345')).toBe('+230 5251 2345');
  });

  it('splits a stored number back for editing', () => {
    expect(splitPhone('+33612345678', 'MU')).toEqual({ country: 'FR', national: '06 12 34 56 78' });
    expect(splitPhone('', 'MU')).toEqual({ country: 'MU', national: '' });
  });
});

const valid: CustomerFormValues = {
  firstName: 'Anna',
  lastName: 'Martin',
  email: 'anna@example.com',
  phoneCountry: 'GB',
  phoneNational: '07400 123456',
  country: 'GB',
  nationality: 'FR',
  address: '1 High St',
  city: 'London',
  postalCode: 'SW1A 2AA',
  drivingLicenceNumber: '',
  flightNumber: '',
  arrivalDate: '',
  arrivalTime: '',
  accommodation: '',
  pickupAddress: '',
  returnAddress: '',
  specialRequests: '',
};

describe('customer form validation', () => {
  const schema = (pickup = false) => customerFormRefined({ pickupNeedsAddress: pickup, returnNeedsAddress: false, joinPhone: (c, n) => joinPhone(c as 'GB', n) });
  const errors = (v: Partial<CustomerFormValues>, pickup = false) => {
    const r = schema(pickup).safeParse({ ...valid, ...v });
    return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
  };

  it('accepts a complete form', () => {
    expect(errors({})).toEqual([]);
  });

  it('flags missing fields, a bad email and a bad mobile number', () => {
    expect(errors({ firstName: ' ', email: 'anna@', phoneNational: '123' })).toEqual(expect.arrayContaining(['firstName', 'email', 'phoneNational']));
  });

  it('requires a delivery address for hotel delivery', () => {
    expect(errors({}, true)).toEqual(['pickupAddress']);
    expect(errors({ pickupAddress: 'Hotel Ocean, Grand Baie' }, true)).toEqual([]);
  });

  it('requires both arrival date and time', () => {
    expect(errors({ arrivalDate: '2027-03-10' })).toEqual(['arrivalTime']);
  });

  it('maps server field paths to form fields', () => {
    expect(serverFieldName('customer.mobileNumber')).toBe('phoneNational');
    expect(serverFieldName('travel.pickupAddress')).toBe('pickupAddress');
    expect(serverFieldName('search.pickupAt')).toBeNull();
  });

  it('validates booking lookups', () => {
    expect(lookupSchema.safeParse({ reference: ' mc-261030-k7qm ', email: 'a@example.com' }).success).toBe(true);
    expect(lookupSchema.safeParse({ reference: 'MC-261030-K7Q0', email: 'a@example.com' }).success).toBe(false);
  });
});

describe('buildBookingRequest', () => {
  const search = { pickupLocation: 'hotel-north', returnLocation: 'ssr-airport', pickupAt: '2027-03-10T10:00', returnAt: '2027-03-17T10:00' };

  it('builds the API request without any price and only the addresses that apply', () => {
    const r = buildBookingRequest(
      search,
      'toyota-vitz',
      [{ code: 'gps', quantity: 1 }, { code: 'child-seat', quantity: 0 }],
      { ...valid, email: ' Anna@Example.com ', flightNumber: 'mk015', arrivalDate: '2027-03-10', arrivalTime: '06:35', pickupAddress: 'Hotel Ocean', returnAddress: 'ignored' },
      { pickupAddress: true, returnAddress: false },
    );
    expect(r.customer).toMatchObject({ email: 'anna@example.com', mobileNumber: '+44 7400 123456', drivingLicenceNumber: null });
    expect(r.travel).toEqual({ flightNumber: 'MK015', arrivalAt: '2027-03-10T06:35', accommodation: null, pickupAddress: 'Hotel Ocean', returnAddress: null, specialRequests: null });
    expect(r.extras).toEqual([{ code: 'gps', quantity: 1 }]);
    expect(JSON.stringify(r)).not.toMatch(/total|price|amount/i);
  });
});
