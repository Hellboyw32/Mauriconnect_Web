import { describe, expect, it } from 'vitest';
import { bestDiscount, calculateQuote, calculateRentalDays, dailyRates, extraCharge, isOutOfHours, type QuoteInput } from '../../src/services/pricing';
import type { BusinessSettings, Extra, Location, PricingRange } from '../../src/types/domain';
import { parseLocalDateTime } from '../../src/utils/time';

const at = (local: string) => {
  const d = parseLocalDateTime(local);
  if (!d) throw new Error(`bad date ${local}`);
  return d;
};

const settings: BusinessSettings = {
  minRentalDays: 3,
  maxRentalDays: 90,
  graceMinutes: 59,
  holdMinutes: 30,
  minLeadHours: 24,
  openingTime: '08:00',
  closingTime: '18:00',
  outOfHoursFee: 0,
};

const airport: Location = { id: 1, code: 'ssr-airport', name: 'SSR Intl Airport', type: 'Office', address: 'Plaine Magnien', deliveryFee: 0, requiresAddress: false };
const north: Location = { id: 2, code: 'hotel-north', name: 'Hotel Delivery – North', type: 'DeliveryZone', address: null, deliveryFee: 15, requiresAddress: true };

const extra = (overrides: Partial<Extra> = {}): Extra => ({
  id: 1,
  code: 'gps',
  name: 'GPS navigation',
  description: null,
  pricingType: 'PerDay',
  price: 3,
  maxCharge: 30,
  maxQuantity: 1,
  ...overrides,
});

const flat: PricingRange[] = [{ carModelId: 7, rangeStart: '2027-01-01', rangeEnd: '2027-12-31', dailyRate: 24 }];

function quote(overrides: Partial<QuoteInput> = {}) {
  return calculateQuote({
    carModelId: 7,
    pickupUtc: at('2027-03-10T10:00'),
    returnUtc: at('2027-03-15T10:00'),
    ranges: flat,
    discounts: [],
    pickupLocation: airport,
    returnLocation: airport,
    extras: [],
    settings,
    ...overrides,
  });
}

describe('calculateRentalDays', () => {
  it('counts whole 24-hour blocks', () => {
    expect(calculateRentalDays(at('2027-03-10T10:00'), at('2027-03-13T10:00'), 59)).toBe(3);
  });

  it('allows a return within the grace period without charging another day', () => {
    expect(calculateRentalDays(at('2027-03-10T10:00'), at('2027-03-13T10:59'), 59)).toBe(3);
  });

  it('charges a started day once the grace period is exceeded', () => {
    expect(calculateRentalDays(at('2027-03-10T10:00'), at('2027-03-13T11:00'), 59)).toBe(4);
  });

  it('charges at least one day', () => {
    expect(calculateRentalDays(at('2027-03-10T10:00'), at('2027-03-10T10:30'), 59)).toBe(1);
  });

  it('rejects a return at or before pickup', () => {
    expect(() => calculateRentalDays(at('2027-03-10T10:00'), at('2027-03-10T10:00'), 59)).toThrow(RangeError);
    expect(() => calculateRentalDays(at('2027-03-10T10:00'), at('2027-03-09T10:00'), 59)).toThrow(RangeError);
  });

  it('measures in Mauritius time across the UTC date line', () => {
    // 02:00 local is 22:00 UTC the previous day.
    expect(calculateRentalDays(at('2027-03-10T02:00'), at('2027-03-13T02:00'), 59)).toBe(3);
  });
});

describe('dailyRates (date-range pricing)', () => {
  const seasonal: PricingRange[] = [
    { carModelId: 7, rangeStart: '2027-01-01', rangeEnd: '2027-06-30', dailyRate: 24 },
    { carModelId: 7, rangeStart: '2027-07-01', rangeEnd: '2027-08-31', dailyRate: 35 },
  ];

  it('charges each day at the rate in force on that local date', () => {
    const rates = dailyRates(at('2027-06-29T10:00'), 4, seasonal);
    expect(rates).toEqual([2400, 2400, 3500, 3500]);
  });

  it('uses the local calendar date, not the UTC one', () => {
    // 01:00 on 1 July in Mauritius is still 30 June in UTC.
    expect(dailyRates(at('2027-07-01T01:00'), 1, seasonal)).toEqual([3500]);
  });

  it('returns null when a day has no rate', () => {
    expect(dailyRates(at('2027-08-30T10:00'), 3, seasonal)).toBeNull();
  });
});

describe('bestDiscount', () => {
  const discounts = [
    { carModelId: null, minDays: 7, percentOff: 5 },
    { carModelId: null, minDays: 14, percentOff: 10 },
    { carModelId: 9, minDays: 7, percentOff: 20 },
  ];

  it('picks the largest discount the rental qualifies for', () => {
    expect(bestDiscount(15, 7, discounts)?.percentOff).toBe(10);
    expect(bestDiscount(8, 7, discounts)?.percentOff).toBe(5);
  });

  it('applies model-specific discounts only to that model', () => {
    expect(bestDiscount(8, 9, discounts)?.percentOff).toBe(20);
  });

  it('returns nothing below the minimum length', () => {
    expect(bestDiscount(6, 7, discounts)).toBeUndefined();
  });
});

describe('extraCharge', () => {
  it('charges per day and caps at the maximum', () => {
    expect(extraCharge(extra(), 1, 5)).toBe(1500);
    expect(extraCharge(extra(), 1, 12)).toBe(3000);
  });

  it('applies the cap per unit before multiplying by quantity', () => {
    expect(extraCharge(extra({ code: 'child-seat', maxQuantity: 2 }), 2, 12)).toBe(6000);
  });

  it('charges a per-rental extra once', () => {
    expect(extraCharge(extra({ pricingType: 'PerRental', price: 10, maxCharge: null }), 1, 9)).toBe(1000);
  });
});

describe('isOutOfHours', () => {
  it('uses office hours in Mauritius time, inclusive of opening and closing', () => {
    expect(isOutOfHours(at('2027-03-10T08:00'), settings)).toBe(false);
    expect(isOutOfHours(at('2027-03-10T18:00'), settings)).toBe(false);
    expect(isOutOfHours(at('2027-03-10T07:59'), settings)).toBe(true);
    expect(isOutOfHours(at('2027-03-10T18:01'), settings)).toBe(true);
  });
});

describe('calculateQuote', () => {
  it('prices a simple rental with no additional charges', () => {
    const q = quote()!;
    expect(q).toMatchObject({ rentalDays: 5, dailyRateCents: 2400, subTotalCents: 12000, additionalCents: 0, totalCents: 12000 });
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]).toMatchObject({ type: 'Rental', quantity: 5, amountCents: 12000 });
  });

  it('applies a duration discount to the rental only', () => {
    const q = quote({ returnUtc: at('2027-03-20T10:00'), discounts: [{ carModelId: null, minDays: 7, percentOff: 10 }], extras: [{ extra: extra(), quantity: 1 }] })!;
    // 10 days x 24 = 240, -10% = 216; GPS 10 x 3 = 30 (cap 30)
    expect(q.subTotalCents).toBe(21600);
    expect(q.additionalCents).toBe(3000);
    expect(q.totalCents).toBe(24600);
    expect(q.lines.find((l) => l.type === 'Discount')?.amountCents).toBe(-2400);
  });

  it('itemises delivery, collection and out-of-hours fees as additional charges', () => {
    const q = quote({
      pickupLocation: north,
      returnLocation: north,
      pickupUtc: at('2027-03-10T07:00'),
      returnUtc: at('2027-03-15T07:00'),
      settings: { ...settings, outOfHoursFee: 10 },
    })!;
    expect(q.lines.map((l) => l.type)).toEqual(['Rental', 'Delivery', 'Delivery', 'OutOfHours', 'OutOfHours']);
    expect(q.additionalCents).toBe(1500 + 1500 + 1000 + 1000);
    expect(q.totalCents).toBe(12000 + 5000);
  });

  it('leaves out zero-value charges', () => {
    const q = quote({ pickupUtc: at('2027-03-10T07:00'), returnUtc: at('2027-03-15T07:00') })!;
    expect(q.lines.map((l) => l.type)).toEqual(['Rental']);
  });

  it('describes mixed seasonal rates and averages the daily rate', () => {
    const q = quote({
      pickupUtc: at('2027-06-29T10:00'),
      returnUtc: at('2027-07-03T10:00'),
      ranges: [
        { carModelId: 7, rangeStart: '2027-01-01', rangeEnd: '2027-06-30', dailyRate: 24 },
        { carModelId: 7, rangeStart: '2027-07-01', rangeEnd: '2027-12-31', dailyRate: 36 },
      ],
    })!;
    expect(q.subTotalCents).toBe(2 * 2400 + 2 * 3600);
    expect(q.dailyRateCents).toBe(3000);
    expect(q.lines[0].description).toContain('seasonal');
  });

  it('ignores ranges belonging to other models', () => {
    expect(quote({ ranges: [{ ...flat[0], carModelId: 8 }] })).toBeNull();
  });

  it('keeps the total equal to the sum of the itemised lines', () => {
    const q = quote({
      pickupLocation: north,
      returnUtc: at('2027-03-25T10:00'),
      discounts: [{ carModelId: null, minDays: 14, percentOff: 7 }],
      extras: [
        { extra: extra(), quantity: 1 },
        { extra: extra({ id: 2, code: 'child-seat', maxQuantity: 2 }), quantity: 2 },
      ],
    })!;
    expect(q.lines.reduce((sum, l) => sum + l.amountCents, 0)).toBe(q.totalCents);
  });
});
