/*
  Pure pricing rules. No I/O here, so every rule is unit-tested in isolation.
  All money is in integer cents.
*/
import type { BusinessSettings, ChargeLine, DurationDiscount, Extra, Location, PricingRange, Quote } from '../types/domain';
import { toCents, formatEuro } from '../utils/money';
import { addDaysToDate, localDate, localMinutesOfDay, parseClock } from '../utils/time';

const MINUTES_PER_DAY = 24 * 60;

/**
 * Rental days: each started 24-hour block counts as a day, except that a return up to
 * `graceMinutes` after a full block is free. Minimum 1 day.
 */
export function calculateRentalDays(pickupUtc: Date, returnUtc: Date, graceMinutes: number): number {
  const minutes = Math.round((returnUtc.getTime() - pickupUtc.getTime()) / 60_000);
  if (minutes <= 0) throw new RangeError('Return must be after pickup');
  const fullDays = Math.floor(minutes / MINUTES_PER_DAY);
  const remainder = minutes % MINUTES_PER_DAY;
  const days = fullDays + (remainder > graceMinutes ? 1 : 0);
  return Math.max(1, days);
}

/**
 * Daily rate for each rental day. Day N is charged at the rate in force on the local calendar
 * date of pickup + N days. Returns null when any day has no active rate (model not bookable).
 */
export function dailyRates(pickupUtc: Date, rentalDays: number, ranges: PricingRange[]): number[] | null {
  const start = localDate(pickupUtc);
  const rates: number[] = [];
  for (let i = 0; i < rentalDays; i++) {
    const day = addDaysToDate(start, i);
    const range = ranges.find((r) => r.rangeStart <= day && r.rangeEnd >= day);
    if (!range) return null;
    rates.push(toCents(range.dailyRate));
  }
  return rates;
}

/** Best applicable rental-length discount (model specific or global). */
export function bestDiscount(rentalDays: number, carModelId: number, discounts: DurationDiscount[]): DurationDiscount | undefined {
  return discounts
    .filter((d) => (d.carModelId === null || d.carModelId === carModelId) && d.minDays <= rentalDays)
    .sort((a, b) => b.percentOff - a.percentOff)[0];
}

export function extraCharge(extra: Extra, quantity: number, rentalDays: number): number {
  const unit = toCents(extra.price);
  let perUnit = extra.pricingType === 'PerDay' ? unit * rentalDays : unit;
  if (extra.maxCharge !== null) perUnit = Math.min(perUnit, toCents(extra.maxCharge));
  return perUnit * quantity;
}

export function isOutOfHours(instantUtc: Date, settings: Pick<BusinessSettings, 'openingTime' | 'closingTime'>): boolean {
  const minutes = localMinutesOfDay(instantUtc);
  return minutes < parseClock(settings.openingTime) || minutes > parseClock(settings.closingTime);
}

export interface QuoteInput {
  carModelId: number;
  pickupUtc: Date;
  returnUtc: Date;
  ranges: PricingRange[];
  discounts: DurationDiscount[];
  pickupLocation: Location;
  returnLocation: Location;
  extras: { extra: Extra; quantity: number }[];
  settings: BusinessSettings;
}

/** Full itemised price for one model. Returns null when the model has no rate for every day. */
export function calculateQuote(input: QuoteInput): Quote | null {
  const { settings } = input;
  const rentalDays = calculateRentalDays(input.pickupUtc, input.returnUtc, settings.graceMinutes);
  const rates = dailyRates(input.pickupUtc, rentalDays, input.ranges.filter((r) => r.carModelId === input.carModelId));
  if (!rates) return null;

  const lines: ChargeLine[] = [];
  const rentalCents = rates.reduce((a, b) => a + b, 0);
  const uniform = rates.every((r) => r === rates[0]);
  lines.push({
    type: 'Rental',
    description: uniform
      ? `Car rental: ${rentalDays} day${rentalDays === 1 ? '' : 's'} × ${formatEuro(rates[0])}`
      : `Car rental: ${rentalDays} days (seasonal rates)`,
    quantity: rentalDays,
    amountCents: rentalCents,
  });

  let subTotalCents = rentalCents;
  const discount = bestDiscount(rentalDays, input.carModelId, input.discounts);
  if (discount) {
    const discountCents = Math.round((rentalCents * discount.percentOff) / 100);
    if (discountCents > 0) {
      lines.push({ type: 'Discount', description: `${discount.percentOff}% discount for ${discount.minDays}+ days`, quantity: 1, amountCents: -discountCents });
      subTotalCents -= discountCents;
    }
  }

  let additionalCents = 0;
  const add = (line: ChargeLine) => {
    if (line.amountCents <= 0) return;
    lines.push(line);
    additionalCents += line.amountCents;
  };

  add({ type: 'Delivery', description: `Delivery: ${input.pickupLocation.name}`, quantity: 1, amountCents: toCents(input.pickupLocation.deliveryFee) });
  add({ type: 'Delivery', description: `Collection: ${input.returnLocation.name}`, quantity: 1, amountCents: toCents(input.returnLocation.deliveryFee) });

  const outOfHoursCents = toCents(settings.outOfHoursFee);
  if (isOutOfHours(input.pickupUtc, settings)) add({ type: 'OutOfHours', description: 'Out-of-hours pickup', quantity: 1, amountCents: outOfHoursCents });
  if (isOutOfHours(input.returnUtc, settings)) add({ type: 'OutOfHours', description: 'Out-of-hours return', quantity: 1, amountCents: outOfHoursCents });

  for (const { extra, quantity } of input.extras) {
    if (quantity <= 0) continue;
    add({
      type: 'Extra',
      description: quantity > 1 ? `${extra.name} × ${quantity}` : extra.name,
      quantity,
      amountCents: extraCharge(extra, quantity, rentalDays),
      extraId: extra.id,
      extraCode: extra.code,
    });
  }

  return {
    rentalDays,
    dailyRateCents: Math.round(subTotalCents / rentalDays),
    lines,
    subTotalCents,
    additionalCents,
    totalCents: subTotalCents + additionalCents,
  };
}
