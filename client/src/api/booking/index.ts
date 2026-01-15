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

type GetBookingsTodayCountResponse = Promise<number>;
type GetDropoffsTodayCountResponse = Promise<number>;
type GetPickupsTodayCountResponse = Promise<number>;
type GetRecentBookingsRequest = { limit?: number };
type GetRecentBookingsResponse = Promise<Booking[]>;

type CreateBookingRequest = { booking: any };
type CreateBookingResponse = Promise<{ status: number; message: string }>;
type UpdateBookingRequest = { bookingId: number; booking: any };
type UpdateBookingResponse = Promise<{ status: number; message: string }>;
type DeleteBookingRequest = { bookingId: number; createdBy: string };
type DeleteBookingResponse = Promise<{ status: number; message: string }>;

interface IBookingApi {
  getBookings(request: GetBookingsRequest): GetBookingsResponse;
  getBooking(request?: GetBookingRequest): GetBookingResponse;
  getBookingsTodayCount(): GetBookingsTodayCountResponse;
  getDropoffsTodayCount(): GetDropoffsTodayCountResponse;
  getPickupsTodayCount(): GetPickupsTodayCountResponse;
  getRecentBookings(request?: GetRecentBookingsRequest): GetRecentBookingsResponse;
  createBooking(request: CreateBookingRequest): CreateBookingResponse;
  updateBooking(request: UpdateBookingRequest): UpdateBookingResponse;
  deleteBooking(request: DeleteBookingRequest): DeleteBookingResponse;
}

class BookingApi implements IBookingApi {
  public async getBookings(request: GetBookingsRequest = {}): GetBookingsResponse {
    const { filters, page, rowsPerPage, sortBy, sortDir } = request;
    let data: Booking[] = [];
    let count = 0;

    if (isMockData()) {
      data = deepCopy(bookingsData) as Booking[];
      count = data.length;

      // Apply filters for mock data
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
      }
      count = data.length;
    } else {
      // Build query string for backend filtering
      let endpoint = API_ENDPOINTS.BOOKINGS;
      const params = new URLSearchParams();

      if (filters?.customerName) {
        params.append('customerName', filters.customerName);
      }

      if (filters?.pickupDate) {
        params.append('pickupDate', filters.pickupDate.toISOString());
      }

      if (filters?.dropoffDate) {
        params.append('dropoffDate', filters.dropoffDate.toISOString());
      }

      if (params.toString()) {
        endpoint = `${endpoint}?${params.toString()}`;
      }

      const response = await api.get<Booking[]>(endpoint);

      // Debug logging
      console.log('Bookings API Response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is Array:', Array.isArray(response.data));
      console.log('Response data length:', response.data?.length);
      console.log('First item:', response.data?.[0]);
      console.log('First item is Array:', Array.isArray(response.data?.[0]));

      // Handle the case where data might be wrapped in an extra array
      let responseData = response.data;
      if (
        Array.isArray(responseData) &&
        responseData.length === 1 &&
        Array.isArray(responseData[0])
      ) {
        console.log('Flattening nested array');
        responseData = responseData[0];
      }

      data = Array.isArray(responseData) ? responseData : [];

      console.log('Final data array length:', data.length);
      console.log('First booking in final data:', data[0]);

      count = data.length;
    }

    if (typeof sortBy !== 'undefined' && typeof sortDir !== 'undefined') {
      data = applySort(data, sortBy, sortDir);
    }

    count = data.length;

    if (typeof page !== 'undefined' && typeof rowsPerPage !== 'undefined') {
      data = applyPagination(data, page, rowsPerPage);
    }

    return Promise.resolve({
      data,
      count
    });
  }

  public async getBooking(request?: GetBookingRequest): Promise<GetBookingResponse> {
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

  public async getBookingsTodayCount(): GetBookingsTodayCountResponse {
    if (isMockData()) {
      // Filter bookings for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayBookings = bookingsData.filter((booking) => {
        const pickupDate = new Date(booking.PickUpDate);
        return pickupDate >= today && pickupDate <= todayEnd;
      });

      return Promise.resolve(todayBookings.length);
    } else {
      const apiResponse = await api.get<any>(`${API_ENDPOINTS.BOOKINGS}/today/count`);
      // Extract the count from the response object (e.g., { Booking: 5 } or { BookingCount: 5 })
      const countData = apiResponse.data;
      const count =
        typeof countData === 'number'
          ? countData
          : countData?.Booking ?? countData?.BookingCount ?? 0;
      return Promise.resolve(count);
    }
  }

  public async getDropoffsTodayCount(): GetDropoffsTodayCountResponse {
    if (isMockData()) {
      // Filter bookings with drop-off date today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayDropoffs = bookingsData.filter((booking) => {
        const dropoffDate = new Date(booking.DropOffDate);
        return dropoffDate >= today && dropoffDate <= todayEnd;
      });

      return Promise.resolve(todayDropoffs.length);
    } else {
      const apiResponse = await api.get<any>(`${API_ENDPOINTS.BOOKINGS}/dropoffs/today/count`);
      // Extract the count from the response object
      const countData = apiResponse.data;
      const count =
        typeof countData === 'number'
          ? countData
          : countData?.Dropoff ?? countData?.DropoffCount ?? 0;
      return Promise.resolve(count);
    }
  }

  public async getPickupsTodayCount(): GetPickupsTodayCountResponse {
    if (isMockData()) {
      // Filter bookings with pickup date today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayPickups = bookingsData.filter((booking) => {
        const pickupDate = new Date(booking.PickUpDate);
        return pickupDate >= today && pickupDate <= todayEnd;
      });

      return Promise.resolve(todayPickups.length);
    } else {
      const apiResponse = await api.get<any>(`${API_ENDPOINTS.BOOKINGS}/pickups/today/count`);
      // Extract the count from the response object
      const countData = apiResponse.data;
      const count =
        typeof countData === 'number'
          ? countData
          : countData?.Pickup ?? countData?.PickupCount ?? 0;
      return Promise.resolve(count);
    }
  }

  public async getRecentBookings(request?: GetRecentBookingsRequest): GetRecentBookingsResponse {
    const limit = request?.limit;

    if (isMockData()) {
      // Sort bookings by PickUpDate (as proxy for CreatedOn) and return top N
      const sortedBookings = (deepCopy(bookingsData) as Booking[])
        .sort(
          (a: Booking, b: Booking) =>
            new Date(b.PickUpDate).getTime() - new Date(a.PickUpDate).getTime()
        )
        .slice(0, limit || 5);

      return Promise.resolve(sortedBookings);
    } else {
      const endpoint = limit
        ? `${API_ENDPOINTS.BOOKINGS}/recent/${limit}`
        : `${API_ENDPOINTS.BOOKINGS}/recent`;
      const apiResponse = await api.get<Booking[]>(endpoint);
      const data = apiResponse.data;
      // Ensure we always return an array
      return Promise.resolve(Array.isArray(data) ? data : []);
    }
  }

  public async getBookingsCurrentWeek(): Promise<number[]> {
    if (isMockData()) {
      // Generate mock data for current week (Sunday to Saturday)
      return Promise.resolve([12, 15, 18, 22, 19, 25, 20]);
    } else {
      const apiResponse = await api.get<any[]>(`${API_ENDPOINTS.BOOKINGS}/week/current`);
      const data = apiResponse.data;

      if (Array.isArray(data)) {
        // Extract BookingCount from each day and return as array
        return Promise.resolve(data.map((day) => day?.BookingCount ?? 0));
      }

      return Promise.resolve([0, 0, 0, 0, 0, 0, 0]);
    }
  }

  public async createBooking(request: CreateBookingRequest): CreateBookingResponse {
    const { booking } = request;
    const response = await api.post<any>(API_ENDPOINTS.BOOKINGS, booking);
    return {
      status: response.status,
      message: response.message || 'Booking created successfully'
    };
  }

  public async updateBooking(request: UpdateBookingRequest): UpdateBookingResponse {
    const { bookingId, booking } = request;
    const response = await api.put<any>(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, booking);
    return {
      status: response.status,
      message: response.message || 'Booking updated successfully'
    };
  }

  public async deleteBooking(request: DeleteBookingRequest): DeleteBookingResponse {
    const { bookingId, createdBy } = request;
    const response = await api.delete<any>(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, { createdBy });
    return {
      status: response.status,
      message: response.message || 'Booking deleted successfully'
    };
  }
}

export const bookingApi = new BookingApi();
