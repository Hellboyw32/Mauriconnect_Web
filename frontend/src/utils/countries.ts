import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
}

const names = new Intl.DisplayNames(['en'], { type: 'region' });

/** All countries, sorted by English name, with their dialling code. */
export const COUNTRIES: CountryOption[] = getCountries()
  .map((code) => ({ code, name: names.of(code) ?? code, callingCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Where most MauriConnect customers come from: listed first in the dropdowns.
const POPULAR: CountryCode[] = ['MU', 'FR', 'GB', 'DE', 'IT', 'ZA', 'RE', 'IN', 'CH', 'BE'];
export const COUNTRIES_POPULAR_FIRST: CountryOption[] = [
  ...POPULAR.map((c) => COUNTRIES.find((x) => x.code === c)!).filter(Boolean),
  ...COUNTRIES.filter((c) => !POPULAR.includes(c.code)),
];

export const countryName = (code: string | null | undefined) => (code ? (COUNTRIES.find((c) => c.code === code)?.name ?? code) : '');

/** Joins the dialling-code dropdown and the number field into "+<code> <number>". */
export function joinPhone(country: CountryCode, national: string): string {
  const digits = national.trim();
  if (digits.startsWith('+')) return digits;
  return `+${getCountryCallingCode(country)} ${digits.replace(/^0+/, '')}`;
}

/** Splits a stored number back into the dropdown and the national part. */
export function splitPhone(value: string | null | undefined, fallback: CountryCode): { country: CountryCode; national: string } {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  if (parsed?.country) return { country: parsed.country, national: parsed.formatNational() };
  return { country: fallback, national: value ?? '' };
}

export const isValidPhone = (value: string) => isValidPhoneNumber(value);
