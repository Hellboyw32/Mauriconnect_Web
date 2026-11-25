import { describe, expect, it } from 'vitest';
import { quoteCancellation } from '../../src/services/cancellationPolicy';
import type { BookingStatus } from '../../src/types/domain';

const now = new Date('2027-03-01T08:00:00Z');
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000);
const rules = [
  { policyId: 1, hoursBeforePickup: 48, feePercent: 0 },
  { policyId: 1, hoursBeforePickup: 0, feePercent: 50 },
];

const quote = (overrides: Partial<Parameters<typeof quoteCancellation>[0]> = {}) =>
  quoteCancellation({ status: 'Confirmed', pickupUtc: hoursFromNow(72), now, paidCents: 20_000, rules, ...overrides });

describe('quoteCancellation', () => {
  it('refunds in full when cancelling 48 hours or more before pickup', () => {
    expect(quote()).toMatchObject({ allowed: true, policyId: 1, feePercent: 0, feeCents: 0, refundCents: 20_000 });
    expect(quote({ pickupUtc: hoursFromNow(48) })).toMatchObject({ feePercent: 0, refundCents: 20_000 });
  });

  it('charges the fee for a late cancellation', () => {
    expect(quote({ pickupUtc: hoursFromNow(47.5) })).toMatchObject({ allowed: true, feePercent: 50, feeCents: 10_000, refundCents: 10_000 });
  });

  it('rounds the fee to the cent and never refunds more than was paid', () => {
    const q = quote({ pickupUtc: hoursFromNow(10), paidCents: 12_345 });
    expect(q.feeCents).toBe(6_173);
    expect(q.feeCents + q.refundCents).toBe(12_345);
  });

  it('charges the full amount when no rule matches rather than promising a refund', () => {
    expect(quote({ rules: [{ policyId: 2, hoursBeforePickup: 72, feePercent: 0 }], pickupUtc: hoursFromNow(24) })).toMatchObject({
      allowed: true,
      policyId: null,
      feePercent: 100,
      refundCents: 0,
    });
  });

  it('costs nothing to cancel an unpaid booking', () => {
    expect(quote({ status: 'PendingPayment', paidCents: 0, pickupUtc: hoursFromNow(10) })).toMatchObject({ allowed: true, feeCents: 0, refundCents: 0 });
  });

  it('refuses once the pickup time has passed', () => {
    expect(quote({ pickupUtc: hoursFromNow(-1) })).toMatchObject({ allowed: false, reason: 'PICKUP_PASSED', refundCents: 0 });
  });

  it.each<BookingStatus>(['InProgress', 'Completed', 'Expired'])('refuses a %s booking', (status) => {
    expect(quote({ status })).toMatchObject({ allowed: false, reason: 'NOT_CANCELLABLE_STATUS' });
  });

  it('refuses a booking that is already cancelled', () => {
    expect(quote({ status: 'Cancelled' })).toMatchObject({ allowed: false, reason: 'ALREADY_CANCELLED' });
  });
});
