/*
  Display helpers. Local date-times from the API are Mauritius wall-clock strings
  ("YYYY-MM-DDTHH:mm"); they are formatted as-is and never shifted to the browser's time zone.
*/

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
const euroWhole = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const formatMoney = (amount: number) => euro.format(amount);
export const formatMoneyShort = (amount: number) => (Number.isInteger(amount) ? euroWhole.format(amount) : euro.format(amount));

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Splits "YYYY-MM-DDTHH:mm" into parts; the weekday is computed on the calendar date alone. */
function parts(local: string) {
  const [date, time = '00:00'] = local.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, time, weekday };
}

/** "Wed 10 Mar 2027" */
export function formatLocalDate(local: string): string {
  const p = parts(local);
  return `${WEEKDAYS[p.weekday]} ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "Tue 8 Dec" for "YYYY-MM-DD" in the current year, "Tue 8 Dec 2027" otherwise. */
export function formatShortDate(date: string, currentYear = new Date().getFullYear()): string {
  const p = parts(date);
  return `${WEEKDAYS[p.weekday]} ${p.d} ${MONTHS[p.m - 1]}${p.y === currentYear ? '' : ` ${p.y}`}`;
}

/** "Wed 10 Mar 2027, 10:00" */
export function formatLocalDateTime(local: string): string {
  return `${formatLocalDate(local)}, ${parts(local).time}`;
}

export const pluralDays = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export const BOOKING_STATUS_LABEL: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  PendingPayment: { label: 'Awaiting payment', color: 'warning' },
  Confirmed: { label: 'Confirmed', color: 'success' },
  InProgress: { label: 'In progress', color: 'info' },
  Completed: { label: 'Completed', color: 'default' },
  Cancelled: { label: 'Cancelled', color: 'error' },
  Expired: { label: 'Not paid', color: 'default' },
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending',
  Successful: 'Paid',
  Failed: 'Failed',
  Refunded: 'Refunded',
  PartiallyRefunded: 'Partially refunded',
  Cancelled: 'Cancelled',
};

export const REFUND_STATUS_LABEL: Record<string, string> = {
  NoRefundDue: 'No refund due',
  RefundPending: 'Refund in progress',
  Refunded: 'Refunded',
  RefundFailed: 'Refund being processed by our team',
};
