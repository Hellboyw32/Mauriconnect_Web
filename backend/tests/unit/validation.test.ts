import { describe, expect, it } from 'vitest';
import { bookingReference, createBookingSchema, customerSchema, enquirySchema, searchSchema, travelSchema } from '../../src/validation/schemas';

const validCustomer = {
  firstName: 'Anna',
  lastName: 'Martin',
  email: 'Anna.Martin@Example.com ',
  mobileNumber: '+44 7400 123456',
  country: 'gb',
  nationality: 'FR',
  address: '10 Downing Street',
  city: 'London',
  postalCode: 'SW1A 2AA',
};

const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.path.join('.'));

describe('customerSchema', () => {
  it('accepts a valid customer and normalises email, phone and countries', () => {
    const parsed = customerSchema.parse(validCustomer);
    expect(parsed).toMatchObject({ email: 'anna.martin@example.com', mobileNumber: '+447400123456', country: 'GB', nationality: 'FR', drivingLicenceNumber: null });
  });

  it('requires every mandatory field', () => {
    const result = customerSchema.safeParse({});
    expect(issues(result)).toEqual(
      expect.arrayContaining(['firstName', 'lastName', 'email', 'mobileNumber', 'country', 'nationality', 'address', 'city', 'postalCode']),
    );
  });

  it('treats whitespace-only fields as missing', () => {
    expect(issues(customerSchema.safeParse({ ...validCustomer, firstName: '   ', city: '\t' }))).toEqual(['firstName', 'city']);
  });

  it('rejects an invalid email address', () => {
    expect(issues(customerSchema.safeParse({ ...validCustomer, email: 'anna@' }))).toEqual(['email']);
  });

  it.each(['07400 123456', '+44 12', '+44 7700 900123', 'call me'])('rejects the mobile number %s', (mobileNumber) => {
    expect(issues(customerSchema.safeParse({ ...validCustomer, mobileNumber }))).toEqual(['mobileNumber']);
  });

  it('accepts a Mauritian mobile number', () => {
    expect(customerSchema.parse({ ...validCustomer, mobileNumber: '+230 5251 2345' }).mobileNumber).toBe('+23052512345');
  });

  it('rejects unknown country codes', () => {
    expect(issues(customerSchema.safeParse({ ...validCustomer, country: 'XX', nationality: 'France' }))).toEqual(['country', 'nationality']);
  });

  it('strips control characters and enforces length limits', () => {
    expect(customerSchema.parse({ ...validCustomer, city: 'Lon\u0000don' }).city).toBe('London');
    expect(issues(customerSchema.safeParse({ ...validCustomer, postalCode: 'x'.repeat(21) }))).toEqual(['postalCode']);
  });

  it('example number in the error message is itself valid', () => {
    const message = customerSchema.safeParse({ ...validCustomer, mobileNumber: 'x' }).error!.issues[0].message;
    const example = /e\.g\. (\+[\d ]+)/.exec(message)![1].trim();
    expect(customerSchema.safeParse({ ...validCustomer, mobileNumber: example }).success).toBe(true);
  });
});

describe('travelSchema', () => {
  it('defaults to empty travel details', () => {
    expect(travelSchema.parse(undefined)).toMatchObject({ flightNumber: null, arrivalAt: null, accommodation: null, specialRequests: null });
  });

  it('normalises flight numbers and blank values', () => {
    expect(travelSchema.parse({ flightNumber: ' mk015 ', arrivalAt: '', accommodation: '  ' })).toMatchObject({ flightNumber: 'MK015', arrivalAt: null, accommodation: null });
  });

  it('rejects malformed flight numbers and dates', () => {
    expect(issues(travelSchema.safeParse({ flightNumber: 'not a flight', arrivalAt: '2027-03-10 10:00' }))).toEqual(
      expect.arrayContaining(['flightNumber', 'arrivalAt']),
    );
  });
});

describe('searchSchema and createBookingSchema', () => {
  it('requires local date-times as YYYY-MM-DDTHH:mm', () => {
    expect(searchSchema.safeParse({ pickupLocation: 'a', returnLocation: 'a', pickupAt: '2027-03-10T10:00', returnAt: '2027-03-13T10:00' }).success).toBe(true);
    expect(issues(searchSchema.safeParse({ pickupLocation: 'a', returnLocation: 'a', pickupAt: '2027-03-10T10:00:00Z', returnAt: '13/03/2027' }))).toEqual([
      'pickupAt',
      'returnAt',
    ]);
  });

  it('does not accept prices from the client', () => {
    const parsed = createBookingSchema.parse({
      search: { pickupLocation: 'ssr-airport', returnLocation: 'ssr-airport', pickupAt: '2027-03-10T10:00', returnAt: '2027-03-13T10:00' },
      carSlug: 'toyota-vitz',
      customer: validCustomer,
      total: 1,
    });
    expect(parsed).not.toHaveProperty('total');
    expect(parsed.extras).toEqual([]);
  });

  it('limits extras quantities', () => {
    const base = { pickupLocation: 'a', returnLocation: 'a', pickupAt: '2027-03-10T10:00', returnAt: '2027-03-13T10:00' };
    expect(
      issues(createBookingSchema.safeParse({ search: base, carSlug: 'x', customer: validCustomer, extras: [{ code: 'gps', quantity: 11 }] })),
    ).toEqual(['extras.0.quantity']);
  });
});

describe('bookingReference', () => {
  it('normalises case and whitespace', () => {
    expect(bookingReference.parse(' mc-261030-k7qm ')).toBe('MC-261030-K7QM');
  });

  it.each(['MC-261030-K7Q', 'MC-261030-K7Q0', 'XX-261030-K7QM', "MC-261030-K7QM' OR 1=1"])('rejects %s', (value) => {
    expect(bookingReference.safeParse(value).success).toBe(false);
  });
});

describe('enquirySchema', () => {
  it('accepts a contact message without a phone number', () => {
    expect(enquirySchema.parse({ type: 'Contact', name: 'Anna', email: 'a@example.com', message: 'Hello' }).phone).toBeNull();
  });

  it('requires a message', () => {
    expect(issues(enquirySchema.safeParse({ type: 'Quote', name: 'Anna', email: 'a@example.com', message: ' ' }))).toEqual(['message']);
  });
});
