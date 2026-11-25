import { randomInt } from 'node:crypto';
import { formatLocal } from './time';

// No 0/O or 1/I so references are easy to read over the phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const BOOKING_REFERENCE_PATTERN = /^MC-\d{6}-[A-HJ-NP-Z2-9]{4}$/;

/** Booking reference such as MC-261030-K7QM (creation date in Mauritius time + 4 random characters). */
export function generateBookingReference(now: Date = new Date()): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `MC-${formatLocal(now, 'yyMMdd')}-${suffix}`;
}
