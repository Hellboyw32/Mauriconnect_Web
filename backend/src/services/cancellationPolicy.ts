import type { BookingStatus, CancellationRule } from '../types/domain';

export interface CancellationQuote {
  allowed: boolean;
  reason?: 'NOT_CANCELLABLE_STATUS' | 'PICKUP_PASSED' | 'ALREADY_CANCELLED';
  policyId: number | null;
  hoursBeforePickup: number;
  feePercent: number;
  feeCents: number;
  refundCents: number;
}

/**
 * Cancellation fee from the active policy. The rule with the largest HoursBeforePickup that the
 * cancellation still meets applies. Only what was actually paid can be refunded.
 */
export function quoteCancellation(params: {
  status: BookingStatus;
  pickupUtc: Date;
  now: Date;
  paidCents: number;
  rules: CancellationRule[];
}): CancellationQuote {
  const hoursBeforePickup = Math.round(((params.pickupUtc.getTime() - params.now.getTime()) / 3_600_000) * 100) / 100;
  const base = { policyId: null, hoursBeforePickup, feePercent: 0, feeCents: 0, refundCents: 0 };

  if (params.status === 'Cancelled') return { ...base, allowed: false, reason: 'ALREADY_CANCELLED' };
  if (params.status !== 'Confirmed' && params.status !== 'PendingPayment') return { ...base, allowed: false, reason: 'NOT_CANCELLABLE_STATUS' };
  if (hoursBeforePickup <= 0) return { ...base, allowed: false, reason: 'PICKUP_PASSED' };

  // Unpaid bookings cost nothing to cancel.
  if (params.paidCents <= 0) return { ...base, allowed: true };

  const rule = [...params.rules].sort((a, b) => b.hoursBeforePickup - a.hoursBeforePickup).find((r) => hoursBeforePickup >= r.hoursBeforePickup);
  // No matching rule: be conservative and charge the full amount rather than promise a refund.
  const feePercent = rule ? rule.feePercent : 100;
  const feeCents = Math.min(params.paidCents, Math.round((params.paidCents * feePercent) / 100));
  return {
    allowed: true,
    policyId: rule?.policyId ?? null,
    hoursBeforePickup,
    feePercent,
    feeCents,
    refundCents: params.paidCents - feeCents,
  };
}
