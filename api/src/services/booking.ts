import { BOOKING_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { Booking, BookingFormValues, Bookings } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IBookingService {
  getBookings(): Promise<Response<Bookings>>;
  getBooking(bookingId: number): Promise<Response<Booking>>;
  getBookingsTodayCount(): Promise<Response<number>>;
  getDropoffsTodayCount(): Promise<Response<number>>;
  getPickupsTodayCount(): Promise<Response<number>>;
  getRecentBookings(limit: number): Promise<Response<Bookings>>;
  createBooking(booking: BookingFormValues): Promise<Response>;
  updateBooking(bookingId: number, booking: any): Promise<Response>;
  deleteBooking(bookingId: number, body: { createdBy: string }): Promise<Response>;
}

@Service()
export class BookingService implements IBookingService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getBookings(): Promise<Response<Bookings>> {
    const storedProcedure = STORED_PROCEDURES.GET_BOOKINGS_DETAILS_JSON;
    return await this.mssqlService.requestByStoredProcedure<Bookings>(storedProcedure, [], false);
  }

  async getBooking(bookingId: number): Promise<Response<Booking>> {
    const storedProcedure = STORED_PROCEDURES.GET_BOOKING_DETAILS_JSON;
    const inputs = [{ 'bookingId': bookingId }];

    return await this.mssqlService.requestByStoredProcedure<Booking>(storedProcedure, inputs, true);
  }

  async getBookingsTodayCount(): Promise<Response<number>> {
    const storedProcedure = STORED_PROCEDURES.GET_BOOKINGS_TODAY_COUNT;

    return await this.mssqlService.requestByStoredProcedure<number>(storedProcedure, [], true);
  }

  async getDropoffsTodayCount(): Promise<Response<number>> {
    const storedProcedure = STORED_PROCEDURES.GET_DROPOFFS_TODAY_COUNT;

    return await this.mssqlService.requestByStoredProcedure<number>(storedProcedure, [], true);
  }

  async getPickupsTodayCount(): Promise<Response<number>> {
    const storedProcedure = STORED_PROCEDURES.GET_PICKUPS_TODAY_COUNT;

    return await this.mssqlService.requestByStoredProcedure<number>(storedProcedure, [], true);
  }

  async getRecentBookings(limit?: number): Promise<Response<Bookings>> {
    const storedProcedure = STORED_PROCEDURES.GET_RECENT_BOOKINGS;
    const inputs = limit ? [{ 'limit': limit }] : [];

    return await this.mssqlService.requestByStoredProcedure<Bookings>(
      storedProcedure,
      inputs,
      false
    );
  }

  async getBookingsCurrentWeek(): Promise<Response<any>> {
    const storedProcedure = STORED_PROCEDURES.GET_BOOKINGS_CURRENT_WEEK;

    return await this.mssqlService.requestByStoredProcedure<any>(storedProcedure, [], false);
  }

  async createBooking(booking: BookingFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.CREATE_BOOKING;
    const inputs = [
      {
        'CustomerName': booking.CustomerName,
        'ContactDetails': booking.ContactDetails,
        'FlightNo': booking.FlightNumber,
        'PickUpDate': booking.PickUpDate,
        'DropOffDate': booking.DropOffDate,
        'NumberOfDays': booking.NumberOfDays,
        'Price': booking.Price,
        'CategoryId': booking.CarCategory,
        'SpecialRequest': booking.SpecialRequest,
        'Login': booking.CreatedBy,
        'ReferenceNo': booking.ReferenceNo,
        'Insurance': booking.Insurance,
        'Currency': booking.CurrencyOption,
        'PaymentMethod': booking.PaymentMethod,
        'IsGps': booking.IsGps,
        'IsCarSeat': booking.IsCarSeat,
        'IsBoosterSeat': booking.IsBoosterSeat,
        'DropOffPlace': booking.DropOffPlace
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async updateBooking(bookingId: number, booking: any): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_BOOKING;
    const inputs = [
      {
        'BookingId': bookingId,
        'CustomerName': booking.CustomerName,
        'ContactDetails': booking.ContactDetails,
        'FlightNo': booking.FlightNumber,
        'PickUpDate': booking.PickUpDate,
        'DropOffDate': booking.DropOffDate,
        'NumberOfDays': booking.NumberOfDays,
        'Price': booking.Price,
        'CarId': booking.CarId,
        'SpecialRequest': booking.SpecialRequest,
        'Login': booking.LastModifiedUserId,
        'Action': 'Update',
        'ReferenceNo': booking.ReferenceNo,
        'NoShow': booking.NoShow,
        'Mileage': booking.Mileage,
        'Insurance': booking.Insurance,
        'Currency': booking.CurrencyOption,
        'PaymentMethod': booking.PaymentMethod,
        'POSMachine': booking.POSMachine,
        'IsGPS': booking.IsGps,
        'IsCarSeat': booking.IsCarSeat,
        'IsBoosterSeat': booking.IsBoosterSeat,
        'DropOffPlace': booking.DropOffPlace,
        'DeliveryUser': booking.DeliveryUser,
        'InsuranceAmount': booking.InsuranceAmount,
        'SimCard': booking.SimCard,
        'HasInsurance': booking.HasInsurance,
        'FuelLevel': booking.FuelLevel,
        'CarInsurance': booking.CarInsurance,
        'RoadTax': booking.RoadTax
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async deleteBooking(bookingId: number, body: { createdBy: string }): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.DELETE_BOOKING;
    const { createdBy } = body;
    const inputs = [{ 'BookingId': bookingId, 'Login': createdBy }];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
