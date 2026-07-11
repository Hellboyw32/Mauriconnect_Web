import { RecordLogs } from './base';
import { Car } from './car';
import { Document } from './documents';

export type PaymentMethods = 'Card' | 'Cash' | 'AlreadyPaid' | 'Paypal';

export interface Booking extends RecordLogs {
  AttachmentPath?: string | null;
  BookingId: number;
  Car: Car;
  CarInsurance?: Date | null;
  ContactDetails?: string | null;
  ContractNumber?: string | null;
  CreatedBy?: string | null;
  CreatedOn?: Date | null;
  Currency?: string | null;
  CustomerName?: string;
  DeliveryUser?: string | null;
  documents?: Document[];
  DropOffDate: Date;
  DropOffPlace?: string | null;
  FlightNumber?: string;
  FuelLevel?: string | null;
  hasInsurance?: boolean | null;
  Insurance?: string | null;
  InsuranceAmount?: number | null;
  IsActive?: boolean;
  IsBoosterSeat?: boolean | null;
  IsCarSeat?: boolean | null;
  IsGps?: boolean | null;
  Mileage?: number | null;
  NoShow?: boolean | null;
  NumberOfDays?: number;
  PaymentMethod?: PaymentMethods | null;
  PickUpDate: Date;
  PickupLocation?: string | null;
  POSMachine?: string | null;
  Price?: string;
  ReferenceNo?: string;
  RoadTax?: Date | null;
  SimCard?: number | null;
  SpecialRequest?: string;
  uploadId?: number | null;
}

export type Bookings = Booking[];

export interface BookingsSearchState {
  filters: Filters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface Filters {
  customerName?: string;
  dropoffDate: Date | undefined;
  pickupDate: Date | undefined;
}

export interface BookingFormValues {
  car?: number;
  CarCategory: string | number;
  CarInsurance?: Date;
  ContactDetails: string;
  ContractNumber?: string;
  CreatedBy?: string;
  CurrencyOption: string;
  CustomerName: string;
  DeliveryUser?: string;
  DropOffDate: Date;
  DropOffPlace: string;
  FlightNumber: string;
  FuelLevel?: string;
  Insurance: number;
  IsBoosterSeat: boolean;
  IsCarSeat: boolean;
  IsGps: boolean;
  Mileage?: number;
  NoShow?: boolean;
  NumberOfDays?: number;
  PaymentMethod: string;
  PickUpDate: Date;
  PickupLocation: string;
  POSMachine?: string;
  Price: string;
  ReferenceNo: string;
  RoadTax?: Date;
  SimCard?: number;
  SpecialRequest: string;
}
