import { API_ENDPOINTS } from '@libs/constants';
import type { Booking, Filters } from '@libs/types';
import { bookings as bookingsData } from 'src/mock/booking';
import { api } from 'src/services/api.service';
import { applyPagination } from 'src/utils/apply-pagination';
import { applySort } from 'src/utils/apply-sort';
import { getByValue as getObjectFromArray } from 'src/utils/array';
import { deepCopy } from 'src/utils/deep-copy';
import { isMockData } from 'src/utils/verify-data-source';

type GetDailyScheduleReportsRequest = {
  filters?: Filters;
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
};

type GetDailyScheduleReportsResponse = Promise<{
  data: Booking[];
  count: number;
}>;

type GetDailyScheduleReportRequest = {
  pickupDate?: string;
};

type GetDailyScheduleReportResponse = Promise<Booking[]>;

type GetDropoffScheduleReportRequest = {
  dropoffDate?: string;
};

type GetDropoffScheduleReportResponse = Promise<Booking[]>;

interface IReportApi {
  getDailyScheduleReports(request: GetDailyScheduleReportsRequest): GetDailyScheduleReportsResponse;
  getDailyScheduleReport(request?: GetDailyScheduleReportRequest): GetDailyScheduleReportResponse;
  getDropoffScheduleReport(
    request?: GetDropoffScheduleReportRequest
  ): GetDropoffScheduleReportResponse;
}

class ReportApi implements IReportApi {
  public async getDailyScheduleReports(
    request: GetDailyScheduleReportsRequest = {}
  ): GetDailyScheduleReportsResponse {
    const { filters, page, rowsPerPage, sortBy, sortDir } = request;
    let data: Booking[] = [];

    if (isMockData()) {
      data = deepCopy(bookingsData) as Booking[];
    } else {
      const apiResponse = await api.get<Booking[]>(API_ENDPOINTS.REPORTS);
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

  public async getDailyScheduleReport(
    request?: GetDailyScheduleReportRequest
  ): GetDailyScheduleReportResponse {
    if (isMockData()) {
      return Promise.resolve(deepCopy(bookingsData));
    }

    const queryString = request?.pickupDate
      ? `?pickupdate=${encodeURIComponent(request.pickupDate)}`
      : '';
    const apiResponse = await api.get<Booking[]>(
      `${API_ENDPOINTS.REPORTS}/schedule/pickup${queryString}`
    );

    return Promise.resolve(apiResponse.data || []);
  }

  public async getDropoffScheduleReport(
    request?: GetDropoffScheduleReportRequest
  ): GetDropoffScheduleReportResponse {
    if (isMockData()) {
      return Promise.resolve(deepCopy(bookingsData));
    }

    const queryString = request?.dropoffDate
      ? `?dropoffdate=${encodeURIComponent(request.dropoffDate)}`
      : '';
    const apiResponse = await api.get<Booking[]>(
      `${API_ENDPOINTS.REPORTS}/schedule/dropoff${queryString}`
    );

    return Promise.resolve(apiResponse.data || []);
  }
}
export const reportApi = new ReportApi();
