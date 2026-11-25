/** Money is handled in integer cents inside the application to avoid floating point errors. */
export const toCents = (amount: number): number => Math.round(amount * 100);

export const fromCents = (cents: number): number => cents / 100;

/** "123.45" - the format PayPal expects. */
export const centsToDecimalString = (cents: number): string => (cents / 100).toFixed(2);

/** Parses a provider amount such as "123.45" into cents. */
export function decimalStringToCents(value: string): number {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) throw new Error(`Invalid amount: ${value}`);
  return Math.round(Number(value) * 100);
}

export const formatEuro = (cents: number): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(cents / 100);
