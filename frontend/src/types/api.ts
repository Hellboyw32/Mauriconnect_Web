/*
  Types for the MauriConnect REST API. They mirror the backend's public views
  (backend/src/services/catalogService.ts and bookingView.ts).
  Local date-times are strings "YYYY-MM-DDTHH:mm" in Mauritius time.
*/

export type BookingStatus = 'PendingPayment' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'Expired';
export type PaymentStatus = 'Pending' | 'Successful' | 'Failed' | 'Refunded' | 'PartiallyRefunded' | 'Cancelled';
export type RefundStatus = 'NoRefundDue' | 'RefundPending' | 'Refunded' | 'RefundFailed';

export interface Location {
  code: string;
  name: string;
  type: 'Office' | 'DeliveryZone';
  address: string | null;
  deliveryFee: number;
  requiresAddress: boolean;
}

export interface Category {
  name: string;
  slug: string;
  description: string | null;
}

export interface Extra {
  code: string;
  name: string;
  description: string | null;
  pricingType: 'PerDay' | 'PerRental';
  price: number;
  maxCharge: number | null;
  maxQuantity: number;
}

export interface PublicSettings {
  minRentalDays: number;
  maxRentalDays: number;
  minLeadHours: number;
  openingTime: string;
  closingTime: string;
  holdMinutes: number;
  currency: 'EUR';
  timeZone: string;
}

export interface AppConfig {
  paymentProvider: 'paypal' | 'fake';
  paypalClientId: string | null;
  settings: PublicSettings;
}

export interface Car {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  transmission: string;
  fuelType: string;
  passengers: number;
  doors: number;
  luggage: number;
  airConditioning: boolean;
  securityDeposit: number | null;
}

export interface ChargeLine {
  type: 'Rental' | 'Discount' | 'Delivery' | 'OutOfHours' | 'Extra';
  description: string;
  quantity: number;
  amount: number;
}

export interface Price {
  rentalDays: number;
  dailyRate: number;
  subTotal: number;
  additionalCharges: number;
  total: number;
  currency: 'EUR';
  charges: ChargeLine[];
}

export type Badge = 'MostRented' | 'MostLiked';

/** Star rating of a model. `sample` is true when it includes demo ratings (development only). */
export interface CarRating {
  average: number;
  count: number;
  sample: boolean;
}

export interface CarHighlights {
  rating: CarRating | null;
  badges: Badge[];
}

export type SearchCar = Car & Price & CarHighlights & { fleetAvailable: boolean };

export interface SearchCriteria {
  pickupLocation: string;
  returnLocation: string;
  pickupAt: string;
  returnAt: string;
}

export interface SearchSummary {
  pickupLocation: Location;
  returnLocation: Location;
  pickupAt: string;
  returnAt: string;
  rentalDays: number;
}

export interface SearchResult {
  search: SearchSummary;
  categories: { name: string; slug: string; cars: SearchCar[] }[];
}

export interface QuoteResult {
  search: SearchSummary;
  car: Car;
  price: Price;
}

export interface SelectedExtra {
  code: string;
  quantity: number;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  country: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  drivingLicenceNumber?: string | null;
}

export interface TravelDetails {
  flightNumber?: string | null;
  arrivalAt?: string | null;
  accommodation?: string | null;
  pickupAddress?: string | null;
  returnAddress?: string | null;
  specialRequests?: string | null;
}

export interface CreateBookingRequest {
  search: SearchCriteria;
  carSlug: string;
  extras: SelectedExtra[];
  customer: CustomerDetails;
  travel: TravelDetails;
}

export interface Booking {
  reference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  confirmedAt: string | null;
  /** UTC ISO instant while an unpaid booking holds a car. */
  holdExpiresAt: string | null;
  car: Omit<Car, 'description' | 'categorySlug' | 'securityDeposit'>;
  pickup: { location: Location; at: string; address: string | null };
  return: { location: Location; at: string; address: string | null };
  rentalDays: number;
  charges: ChargeLine[];
  subTotal: number;
  additionalCharges: number;
  total: number;
  currency: 'EUR';
  securityDeposit: number | null;
  customer: CustomerDetails;
  travel: { flightNumber: string | null; arrivalAt: string | null; accommodation: string | null; specialRequests: string | null };
  payment: {
    provider: string;
    status: PaymentStatus;
    transactionId: string | null;
    amount: number;
    currency: string;
    paidAt: string | null;
    refundAmount: number;
    refundReference: string | null;
  } | null;
  cancellation: {
    cancelledAt: string;
    reason: string | null;
    fee: number;
    feePercent: number;
    refundAmount: number;
    refundStatus: RefundStatus;
    refundReference: string | null;
  } | null;
  canPay: boolean;
  canCancel: boolean;
  documents: { voucher: boolean; cancellation: boolean };
}

export interface BookingWithToken {
  booking: Booking;
  accessToken: string;
}

export interface CancellationQuote {
  allowed: boolean;
  reason: string | null;
  hoursBeforePickup: number;
  feePercent: number;
  fee: number;
  refundAmount: number;
  paidAmount: number;
  currency: 'EUR';
  policy: { hoursBeforePickup: number; feePercent: number }[];
}

export interface CaptureResult {
  outcome: 'Confirmed' | 'PaymentPending';
  booking: Booking;
}

export interface EnquiryRequest {
  type: 'Quote' | 'Contact';
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { path?: string; message: string }[] };
}
