import { API_ENDPOINTS } from '@libs/constants';
import type { Booking, Filters } from '@libs/types';
import { bookings as bookingsData } from 'src/mock/booking';
import { api } from 'src/services/api.service';
import { applyPagination } from 'src/utils/apply-pagination';
import { applySort } from 'src/utils/apply-sort';
import { getByValue as getObjectFromArray } from 'src/utils/array';
import { deepCopy } from 'src/utils/deep-copy';
import { isMockData } from 'src/utils/verify-data-source';

type GetBookingsRequest = {
  filters?: Filters;
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

type GetBookingsResponse = Promise<{
  data: Booking[];
  count: number;
}>;

type GetBookingRequest = Pick<Booking, 'BookingId'>;

type GetBookingResponse = Promise<Booking>;

interface IBookingApi {
  getBookings(request: GetBookingsRequest): GetBookingsResponse;
  getBooking(request?: GetBookingRequest): GetBookingResponse;
}

class BookingApi implements IBookingApi {
  public async getBookings(request: GetBookingsRequest = {}): GetBookingsResponse {
    const { filters, page, rowsPerPage, sortBy, sortDir } = request;
    let data: Booking[] = [];

    if (isMockData()) {
      data = deepCopy(bookingsData) as Booking[];
    } else {
      const apiResponse = await api.get<Booking[]>(API_ENDPOINTS.BOOKINGS);
      data = apiResponse.data as Booking[];
    }

    let count = data.length;

    if (typeof filters !== 'undefined') {
      data = data.filter((booking) => {
        if (typeof filters.customerName !== 'undefined' && filters.customerName !== '') {
          const nameMatched = booking!
            .CustomerName!.toLowerCase()
            .includes(filters.customerName.toLowerCase());

          if (!nameMatched) {
            return false;
          }
        }

        if (typeof filters.pickupDate !== 'undefined') {
          const filterPickupDate = filters.pickupDate.toDateString();
          const bookingPickupDate = booking.PickUpDate.toDateString();
          const dateMatched = filterPickupDate === bookingPickupDate;

          if (!dateMatched) {
            return false;
          }
        }

        if (typeof filters.dropoffDate !== 'undefined') {
          const filterDropoffDate = filters.dropoffDate.toDateString();
          const bookingDropoffDate = booking.DropOffDate.toDateString();
          const dateMatched = filterDropoffDate === bookingDropoffDate;

          if (!dateMatched) {
            return false;
          }
        }

        return true;
      });
      count = data.length;
    }

    if (typeof sortBy !== 'undefined' && typeof sortDir !== 'undefined') {
      data = applySort(data, sortBy, sortDir);
    }

    if (typeof page !== 'undefined' && typeof rowsPerPage !== 'undefined') {
      data = applyPagination(data, page, rowsPerPage);
    }

    return Promise.resolve({
      data,
      count
    });
  }

  public async getBooking(request?: GetBookingRequest): GetBookingResponse {
    let data = {} as Booking;
    if (request) {
      if (isMockData()) {
        data = getObjectFromArray(bookingsData, 'BookingId', request.BookingId);
        return Promise.resolve(data);
      } else {
        const apiResponse = await api.get<Booking[]>(
          `${API_ENDPOINTS.BOOKINGS}/${request.BookingId}`
        );
        data = apiResponse.data![0];
        return Promise.resolve(data);
      }
    }

    if (isMockData()) {
      return Promise.resolve(deepCopy(bookingsData[0]));
    }
    return Promise.resolve(deepCopy((await this.getBookings()).data[0]));
  }
}

export const bookingApi = new BookingApi();
