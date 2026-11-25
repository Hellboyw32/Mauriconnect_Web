import { describe, expect, it } from 'vitest';
import { createTokenService } from '../../src/services/tokens';
import { centsToDecimalString, decimalStringToCents, toCents } from '../../src/utils/money';
import { BOOKING_REFERENCE_PATTERN, generateBookingReference } from '../../src/utils/reference';
import { addDaysToDate, localDate, parseLocalDateTime, toLocalIso } from '../../src/utils/time';
import { translateSqlError } from '../../src/utils/errors';

describe('Mauritius time', () => {
  it('parses local time as UTC+4', () => {
    expect(parseLocalDateTime('2027-03-10T10:00')?.toISOString()).toBe('2027-03-10T06:00:00.000Z');
  });

  it('rejects impossible dates and times', () => {
    for (const v of ['2027-02-30T10:00', '2027-13-01T10:00', '2027-03-10T24:00', '2027-03-10T10:60', '2027-03-10']) {
      expect(parseLocalDateTime(v)).toBeNull();
    }
  });

  it('round-trips through the wire format', () => {
    expect(toLocalIso(parseLocalDateTime('2027-12-31T23:30')!)).toBe('2027-12-31T23:30');
  });

  it('gives the local calendar date', () => {
    expect(localDate(new Date('2027-03-09T21:00:00Z'))).toBe('2027-03-10');
  });

  it('adds days across month and year ends', () => {
    expect(addDaysToDate('2027-12-30', 3)).toBe('2028-01-02');
    expect(addDaysToDate('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('money', () => {
  it('converts without floating point drift', () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
    expect(centsToDecimalString(12345)).toBe('123.45');
    expect(centsToDecimalString(100)).toBe('1.00');
  });

  it('parses provider amounts strictly', () => {
    expect(decimalStringToCents('123.45')).toBe(12345);
    expect(decimalStringToCents('7')).toBe(700);
    expect(() => decimalStringToCents('1.234')).toThrow();
    expect(() => decimalStringToCents('1e3')).toThrow();
  });
});

describe('booking reference', () => {
  it('uses the Mauritius creation date and an unambiguous suffix', () => {
    const ref = generateBookingReference(new Date('2027-03-09T21:00:00Z'));
    expect(ref).toMatch(/^MC-270310-/);
    expect(ref).toMatch(BOOKING_REFERENCE_PATTERN);
    expect(ref.slice(-4)).not.toMatch(/[01IO]/);
  });

  it('is random', () => {
    const refs = new Set(Array.from({ length: 200 }, () => generateBookingReference()));
    expect(refs.size).toBeGreaterThan(195);
  });
});

describe('booking tokens', () => {
  const tokens = createTokenService({ jwtSecret: 'unit-test-secret-unit-test-secret', bookingTokenTtlMinutes: 60, linkTokenTtlDays: 30 });

  it('grants access to exactly one booking', () => {
    expect(tokens.verify(tokens.issueBookingToken('MC-270310-ABCD'))).toBe('MC-270310-ABCD');
    expect(tokens.verify(tokens.issueLinkToken('MC-270310-ABCD'))).toBe('MC-270310-ABCD');
  });

  it('rejects tokens signed with another secret, tampered or expired', () => {
    const other = createTokenService({ jwtSecret: 'another-secret-another-secret-xx', bookingTokenTtlMinutes: 60, linkTokenTtlDays: 30 });
    const token = other.issueBookingToken('MC-270310-ABCD');
    expect(tokens.verify(token)).toBeNull();
    expect(tokens.verify(tokens.issueBookingToken('MC-270310-ABCD').slice(0, -2) + 'xx')).toBeNull();
    const expired = createTokenService({ jwtSecret: 'unit-test-secret-unit-test-secret', bookingTokenTtlMinutes: -1, linkTokenTtlDays: 30 });
    expect(tokens.verify(expired.issueBookingToken('MC-270310-ABCD'))).toBeNull();
    expect(tokens.verify('garbage')).toBeNull();
  });
});

describe('translateSqlError', () => {
  it('maps stored procedure errors to HTTP errors', () => {
    expect(translateSqlError({ number: 50010, message: 'CAR_DOUBLE_BOOKED' })).toMatchObject({ status: 409, code: 'CAR_DOUBLE_BOOKED' });
    expect(translateSqlError({ originalError: { info: { number: 50030, message: 'BOOKING_NOT_CANCELLABLE' } } })).toMatchObject({ status: 409 });
  });

  it('maps deadlocks to a retryable error and ignores anything else', () => {
    expect(translateSqlError({ number: 1205, message: 'deadlock' })).toMatchObject({ status: 503, code: 'BUSY' });
    expect(translateSqlError({ number: 547, message: 'FK violation' })).toBeUndefined();
    expect(translateSqlError(new Error('boom'))).toBeUndefined();
  });
});
