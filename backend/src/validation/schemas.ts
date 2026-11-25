import { getCountries, isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { z } from 'zod';
import { BOOKING_REFERENCE_PATTERN } from '../utils/reference';
import { cleanLine, cleanText } from '../utils/text';

const COUNTRIES = new Set<string>(getCountries());

const line = (max: number) => z.string().max(max * 2).transform(cleanLine).pipe(z.string().max(max));
const requiredLine = (label: string, max: number) =>
  z.string({ error: `${label} is required.` }).max(max * 2).transform(cleanLine).pipe(z.string().min(1, `${label} is required.`).max(max, `${label} is too long.`));
const optionalLine = (max: number) =>
  line(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use the format YYYY-MM-DDTHH:mm.');

const countryCode = (label: string) =>
  z
    .string({ error: `${label} is required.` })
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => COUNTRIES.has(v), `${label} is not a valid country.`);

export const bookingReference = z
  .string()
  .transform((v) => v.trim().toUpperCase())
  .refine((v) => BOOKING_REFERENCE_PATTERN.test(v), 'Booking reference format is MC-YYMMDD-XXXX.');

export const searchSchema = z.object({
  pickupLocation: z.string().min(1).max(40),
  returnLocation: z.string().min(1).max(40),
  pickupAt: localDateTime,
  returnAt: localDateTime,
});
export type SearchInput = z.infer<typeof searchSchema>;

export const customerSchema = z.object({
  firstName: requiredLine('First name', 100),
  lastName: requiredLine('Last name', 100),
  email: z
    .string({ error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address.').max(254)),
  mobileNumber: z
    .string({ error: 'Mobile number is required.' })
    .trim()
    .refine((v) => isValidPhoneNumber(v), 'Enter a valid mobile number including the country code, e.g. +44 7400 123456.')
    .transform((v) => parsePhoneNumberWithError(v).number),
  country: countryCode('Country'),
  nationality: countryCode('Nationality'),
  address: requiredLine('Address', 300),
  city: requiredLine('City', 100),
  postalCode: requiredLine('Postal code', 20),
  drivingLicenceNumber: optionalLine(50),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const travelSchema = z
  .object({
    flightNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{2,3}\s?\d{1,5}[A-Z]?$/, 'Enter a valid flight number, e.g. MK015.')
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    arrivalAt: localDateTime.optional().nullable().or(z.literal('').transform(() => null)),
    accommodation: optionalLine(200),
    pickupAddress: optionalLine(300),
    returnAddress: optionalLine(300),
    specialRequests: z
      .string()
      .max(2000)
      .transform(cleanText)
      .pipe(z.string().max(1000, 'Special requests are too long.'))
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
  })
  .default({ flightNumber: null, arrivalAt: null, accommodation: null, pickupAddress: null, returnAddress: null, specialRequests: null });

export const extrasSchema = z
  .array(z.object({ code: z.string().min(1).max(40), quantity: z.number().int().min(0).max(10) }))
  .max(20)
  .default([]);

export const quoteSchema = searchSchema.extend({
  carSlug: z.string().min(1).max(80),
  extras: extrasSchema,
});

export const createBookingSchema = z.object({
  search: searchSchema,
  carSlug: z.string().min(1).max(80),
  extras: extrasSchema,
  customer: customerSchema,
  travel: travelSchema,
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const verifyBookingSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(254)),
});

export const cancelBookingSchema = z.object({
  reason: optionalLine(500),
});

export const createOrderSchema = z.object({ bookingReference });
export const captureOrderSchema = z.object({ bookingReference, orderId: z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/) });
export const refundSchema = z.object({ bookingReference, amount: z.number().positive().max(100_000).optional() });

export const enquirySchema = z.object({
  type: z.enum(['Quote', 'Contact']),
  name: requiredLine('Name', 200),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(254)),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .refine((v) => !v || isValidPhoneNumber(v), 'Enter a valid phone number including the country code.')
    .transform((v) => (v ? parsePhoneNumberWithError(v).number : null)),
  message: z
    .string({ error: 'Message is required.' })
    .max(4000)
    .transform(cleanText)
    .pipe(z.string().min(1, 'Message is required.').max(2000, 'Message is too long.')),
});
