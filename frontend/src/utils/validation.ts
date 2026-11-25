import { z } from 'zod';
import { isValidPhone } from './countries';

/*
  Client-side validation for instant feedback. The API validates everything again and its
  field errors are shown on the same fields (see applyServerErrors).
*/

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

const optional = (max: number, label = 'This field') => z.string().trim().max(max, `${label} is too long.`).optional().or(z.literal(''));

export const customerFormSchema = z.object({
  firstName: required('First name', 100),
  lastName: required('Last name', 100),
  email: z.string().trim().min(1, 'Email address is required.').pipe(z.email('Enter a valid email address.')),
  phoneCountry: z.string().min(2, 'Choose a country code.'),
  phoneNational: z.string().trim().min(1, 'Mobile number is required.'),
  country: z.string().min(2, 'Country is required.'),
  nationality: z.string().min(2, 'Nationality is required.'),
  address: required('Address', 300),
  city: required('City', 100),
  postalCode: required('Postal code', 20),
  drivingLicenceNumber: optional(50, 'Driving licence number'),
  flightNumber: z
    .string()
    .trim()
    .regex(/^([A-Za-z0-9]{2,3}\s?\d{1,5}[A-Za-z]?)?$/, 'Enter a valid flight number, e.g. MK015.')
    .optional(),
  arrivalDate: z.string().optional(),
  arrivalTime: z.string().optional(),
  accommodation: optional(200, 'Accommodation'),
  pickupAddress: optional(300, 'Delivery address'),
  returnAddress: optional(300, 'Collection address'),
  specialRequests: optional(1000, 'Special requests'),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

/** Adds the rules that depend on other fields or on the chosen locations. */
export function customerFormRefined(options: { pickupNeedsAddress: boolean; returnNeedsAddress: boolean; joinPhone: (c: string, n: string) => string }) {
  return customerFormSchema.superRefine((v, ctx) => {
    if (v.phoneNational && !isValidPhone(options.joinPhone(v.phoneCountry, v.phoneNational))) {
      ctx.addIssue({ code: 'custom', path: ['phoneNational'], message: 'Enter a valid mobile number for the selected country code.' });
    }
    if (options.pickupNeedsAddress && !v.pickupAddress?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['pickupAddress'], message: 'Tell us the hotel or address where we should deliver the car.' });
    }
    if (options.returnNeedsAddress && !v.returnAddress?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['returnAddress'], message: 'Tell us the hotel or address where we should collect the car.' });
    }
    if (!!v.arrivalDate !== !!v.arrivalTime) {
      ctx.addIssue({ code: 'custom', path: [v.arrivalDate ? 'arrivalTime' : 'arrivalDate'], message: 'Enter both the arrival date and time.' });
    }
  });
}

export const lookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^MC-\d{6}-[A-HJ-NP-Z2-9]{4}$/, 'Booking ID looks like MC-261030-K7QM.'),
  email: z.string().trim().min(1, 'Email address is required.').pipe(z.email('Enter a valid email address.')),
});
export type LookupValues = z.infer<typeof lookupSchema>;

export const contactSchema = z.object({
  type: z.enum(['Contact', 'Quote']),
  name: required('Name', 200),
  email: z.string().trim().min(1, 'Email address is required.').pipe(z.email('Enter a valid email address.')),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || isValidPhone(v), 'Enter the number with its country code, e.g. +230 5255 1144.')
    .optional(),
  message: required('Message', 2000),
});
export type ContactValues = z.infer<typeof contactSchema>;

/** Maps API field paths ("customer.email", "travel.pickupAddress") to form field names. */
export function serverFieldName(path: string | undefined): keyof CustomerFormValues | null {
  if (!path) return null;
  const last = path.split('.').pop()!;
  if (last === 'mobileNumber') return 'phoneNational';
  if (last === 'arrivalAt') return 'arrivalDate';
  return last in customerFormSchema.shape ? (last as keyof CustomerFormValues) : null;
}
