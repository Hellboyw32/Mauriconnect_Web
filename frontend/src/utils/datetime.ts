/*
  The business runs on Mauritius time (UTC+4, no daylight saving). Customers pick dates and
  times as Mauritius wall-clock values wherever they are; the API receives "YYYY-MM-DDTHH:mm".
*/

const MAURITIUS_OFFSET_MINUTES = 4 * 60;

const pad = (n: number) => String(n).padStart(2, '0');

/** Calendar date picked in a date picker (local Date object) -> "YYYY-MM-DD". */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" -> Date at local midnight (for date pickers). */
export function fromIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const combine = (date: string, time: string) => `${date}T${time}`;

export function splitLocal(local: string): { date: string; time: string } {
  const [date, time] = local.split('T');
  return { date, time };
}

/** The current Mauritius wall-clock time as "YYYY-MM-DDTHH:mm". */
export function nowInMauritius(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + MAURITIUS_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/** Adds days to "YYYY-MM-DD". */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Minutes between two local strings (both Mauritius time, so no offset needed). */
export function minutesBetween(fromLocal: string, toLocal: string): number {
  const ms = (v: string) => Date.parse(`${v}:00Z`);
  return Math.round((ms(toLocal) - ms(fromLocal)) / 60_000);
}

/**
 * Rental days as the backend counts them: started 24-hour blocks, with a grace period.
 * Shown as a preview only; the price and the final day count always come from the server.
 */
export function rentalDays(pickupLocal: string, returnLocal: string, graceMinutes = 59): number {
  const minutes = minutesBetween(pickupLocal, returnLocal);
  if (minutes <= 0) return 0;
  const full = Math.floor(minutes / 1440);
  return Math.max(1, full + (minutes % 1440 > graceMinutes ? 1 : 0));
}

/** Pickup/return times offered in the search form: every 30 minutes. */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);

/** Default search: pickup in two days at 10:00 for a week. */
export function defaultSearchDates(now: Date = new Date()) {
  const today = nowInMauritius(now).slice(0, 10);
  const pickupDate = addDays(today, 2);
  return { pickupDate, pickupTime: '10:00', returnDate: addDays(pickupDate, 7), returnTime: '10:00' };
}
