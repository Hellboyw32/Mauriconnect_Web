import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/** All business rules use Mauritius local time (UTC+4, no daylight saving). */
export const BUSINESS_TZ = 'Indian/Mauritius';

const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Parses "YYYY-MM-DDTHH:mm" entered in Mauritius time into a UTC instant. Returns null when invalid. */
export function parseLocalDateTime(value: string): Date | null {
  const m = LOCAL_DATETIME.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  // Reject impossible calendar dates such as 2026-02-30.
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return fromZonedTime(value, BUSINESS_TZ);
}

/** Formats a UTC instant in Mauritius time. */
export function formatLocal(date: Date, pattern = 'yyyy-MM-dd HH:mm'): string {
  return formatInTimeZone(date, BUSINESS_TZ, pattern);
}

/** "YYYY-MM-DDTHH:mm" in Mauritius time: the API's wire format for local times. */
export function toLocalIso(date: Date): string {
  return formatInTimeZone(date, BUSINESS_TZ, "yyyy-MM-dd'T'HH:mm");
}

/** Calendar date (YYYY-MM-DD) in Mauritius time. */
export function localDate(date: Date): string {
  return formatInTimeZone(date, BUSINESS_TZ, 'yyyy-MM-dd');
}

/** Minutes since local midnight in Mauritius time. */
export function localMinutesOfDay(date: Date): number {
  const [h, m] = formatInTimeZone(date, BUSINESS_TZ, 'HH:mm').split(':').map(Number);
  return h * 60 + m;
}

/** Adds whole days to a YYYY-MM-DD date string. */
export function addDaysToDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Parses "HH:mm" into minutes since midnight. */
export function parseClock(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export const humanDateTime = (date: Date) => formatLocal(date, 'EEE d MMM yyyy, HH:mm');
