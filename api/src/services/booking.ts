import { BOOKING_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { Booking, BookingFormValues, Bookings } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IBookingService {
  getBookings(): Promise<Response<Bookings>>;
  getBooking(bookingId: number): Promise<Response<Booking>>;
  createBooking(booking: BookingFormValues): Promise<Response>;
  deleteBooking(bookingId: number, body: { createdBy: string }): Promise<Response>;
}

@Service()
export class BookingService implements IBookingService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getBookings(): Promise<Response<Bookings>> {
    const storedProcedure = STORED_PROCEDURES.GET_BOOKINGS_DETAILS_JSON;

    return await this.mssqlService.requestByStoredProcedure<Bookings>(storedProcedure, [], true);
  }

  async getBooking(bookingId: number): Promise<Response<Booking>> {
    const storedProcedure = STORED_PROCEDURES.GET_BOOKING_DETAILS_JSON;
    const inputs = [{ 'bookingId': bookingId }];

    return await this.mssqlService.requestByStoredProcedure<Booking>(storedProcedure, inputs, true);
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

  // TODO: Complete the delete booking logic
  async deleteBooking(bookingId: number, body: { createdBy: string }): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.DELETE_BOOKING;
    const { createdBy } = body;
    const inputs = [{ 'BookingId': bookingId, 'Login': createdBy }];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
