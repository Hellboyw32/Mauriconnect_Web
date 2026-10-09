export interface SchedulerCategory {
  CategoryId: number;
  CategoryName: string;
}

export interface SchedulerCar {
  CarId: number;
  CarNumber: string;
  Model?: string | null;
  CategoryId: number;
  CategoryName: string;
}

export interface SchedulerBooking {
  BookingId: number;
  CustomerName: string;
  ReferenceNo?: string | null;
  ContactDetails?: string | null;
  FlightNo?: string | null;
  PickUpDate: string;
  DropOffDate: string;
  NumberOfDays?: number | null;
  Price?: string | null;
  Currency?: string | null;
  CarId: number;
  CategoryId: number;
  SpecialRequest?: string | null;
  NoShow?: boolean | null;
}

export interface SchedulerData {
  categories: SchedulerCategory[];
  cars: SchedulerCar[];
  bookings: SchedulerBooking[];
}
