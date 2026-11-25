export type BookingStatus = 'PendingPayment' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'Expired';
export type PaymentStatus = 'Pending' | 'Successful' | 'Failed' | 'Refunded' | 'PartiallyRefunded' | 'Cancelled';
export type CancellationStatus = 'NoRefundDue' | 'RefundPending' | 'Refunded' | 'RefundFailed';
export type ChargeType = 'Rental' | 'Discount' | 'Delivery' | 'OutOfHours' | 'Extra';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
}

export interface CarModel {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  categoryName: string;
  categorySlug: string;
  categoryOrder: number;
  transmission: string;
  fuelType: string;
  passengers: number;
  doors: number;
  luggage: number;
  airConditioning: boolean;
  imageUrl: string | null;
  securityDeposit: number | null;
  displayOrder: number;
}

/** Ratings and real rentals per model, for the car cards and the "Most rented" / "Most liked" badges. */
export interface ModelStats {
  carModelId: number;
  reviewCount: number;
  averageRating: number | null;
  sampleReviewCount: number;
  rentalsLastYear: number;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  type: 'Office' | 'DeliveryZone';
  address: string | null;
  deliveryFee: number;
  requiresAddress: boolean;
}

export interface Extra {
  id: number;
  code: string;
  name: string;
  description: string | null;
  pricingType: 'PerDay' | 'PerRental';
  price: number;
  maxCharge: number | null;
  maxQuantity: number;
}

export interface PricingRange {
  carModelId: number;
  rangeStart: string; // YYYY-MM-DD inclusive
  rangeEnd: string; // YYYY-MM-DD inclusive
  dailyRate: number;
}

export interface DurationDiscount {
  carModelId: number | null;
  minDays: number;
  percentOff: number;
}

export interface BusinessSettings {
  minRentalDays: number;
  maxRentalDays: number;
  graceMinutes: number;
  holdMinutes: number;
  minLeadHours: number;
  openingTime: string;
  closingTime: string;
  outOfHoursFee: number;
}

export interface CancellationRule {
  policyId: number;
  hoursBeforePickup: number;
  feePercent: number;
}

export interface ChargeLine {
  type: ChargeType;
  description: string;
  quantity: number;
  amountCents: number;
  extraId?: number;
  extraCode?: string;
}

export interface Quote {
  rentalDays: number;
  dailyRateCents: number; // average, for display
  lines: ChargeLine[];
  subTotalCents: number; // rental after discount
  additionalCents: number; // delivery, fees and extras
  totalCents: number;
}
