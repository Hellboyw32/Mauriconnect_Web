import { API_ENDPOINTS } from '@libs/constants';
import type {
  Booking,
  CarInsuranceRenewalReportItem,
  Filters,
  FitnessRenewalReportItem,
  InsuranceReportRow,
  RoadTaxRenewalReportItem,
  SettlementReportRow,
  SimCardReportRow
} from '@libs/types';
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

type GetRoadTaxRenewalReportRequest = {
  year: number;
  month: number;
};

type GetRoadTaxRenewalReportResponse = Promise<RoadTaxRenewalReportItem[]>;

type GetCarFitnessRenewalReportRequest = {
  year: number;
  month: number;
};

type GetCarFitnessRenewalReportResponse = Promise<FitnessRenewalReportItem[]>;

type GetCarInsuranceRenewalReportRequest = {
  year: number;
  month: number;
};

type GetCarInsuranceRenewalReportResponse = Promise<CarInsuranceRenewalReportItem[]>;

type GetSettlementReportRequest = {
  date: string;
};

type GetSettlementReportResponse = Promise<SettlementReportRow[]>;

type GetSimCardReportRequest = {
  startDate: string;
  endDate: string;
};

type GetSimCardReportResponse = Promise<SimCardReportRow[]>;

type GetInsuranceReportRequest = {
  startDate: string;
  endDate: string;
};

type GetInsuranceReportResponse = Promise<InsuranceReportRow[]>;

interface IReportApi {
  getDailyScheduleReports(request: GetDailyScheduleReportsRequest): GetDailyScheduleReportsResponse;
  getDailyScheduleReport(request?: GetDailyScheduleReportRequest): GetDailyScheduleReportResponse;
  getDropoffScheduleReport(
    request?: GetDropoffScheduleReportRequest
  ): GetDropoffScheduleReportResponse;
  getRoadTaxRenewalReport(
    request: GetRoadTaxRenewalReportRequest
  ): GetRoadTaxRenewalReportResponse;
  getCarFitnessRenewalReport(
    request: GetCarFitnessRenewalReportRequest
  ): GetCarFitnessRenewalReportResponse;
  getCarInsuranceRenewalReport(
    request: GetCarInsuranceRenewalReportRequest
  ): GetCarInsuranceRenewalReportResponse;
  getSettlementReport(request: GetSettlementReportRequest): GetSettlementReportResponse;
  getSimCardReport(request: GetSimCardReportRequest): GetSimCardReportResponse;
  getInsuranceReport(request: GetInsuranceReportRequest): GetInsuranceReportResponse;
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

  public async getRoadTaxRenewalReport(
    request: GetRoadTaxRenewalReportRequest
  ): GetRoadTaxRenewalReportResponse {
    const { year, month } = request;
    const apiResponse = await api.get<RoadTaxRenewalReportItem[]>(
      `${API_ENDPOINTS.REPORTS}/road-tax-renewals?year=${year}&month=${month}`
    );

    return Promise.resolve(apiResponse.data || []);
  }

  public async getCarFitnessRenewalReport(
    request: GetCarFitnessRenewalReportRequest
  ): GetCarFitnessRenewalReportResponse {
    const { year, month } = request;
    const apiResponse = await api.get<FitnessRenewalReportItem[]>(
      `${API_ENDPOINTS.REPORTS}/car-fitness-renewals?year=${year}&month=${month}`
    );

    return Promise.resolve(apiResponse.data || []);
  }

  public async getCarInsuranceRenewalReport(
    request: GetCarInsuranceRenewalReportRequest
  ): GetCarInsuranceRenewalReportResponse {
    const { year, month } = request;
    const apiResponse = await api.get<CarInsuranceRenewalReportItem[]>(
      `${API_ENDPOINTS.REPORTS}/car-insurance-renewals?year=${year}&month=${month}`
    );

    return Promise.resolve(apiResponse.data || []);
  }

  public async getSettlementReport(
    request: GetSettlementReportRequest
  ): GetSettlementReportResponse {
    const { date } = request;
    const apiResponse = await api.get<SettlementReportRow[]>(
      `${API_ENDPOINTS.REPORTS}/settlement?date=${encodeURIComponent(date)}`
    );

    // api.get returns { message, status } (no data) when the call failed - surface
    // that instead of silently showing an empty report.
    if (apiResponse.status < 200 || apiResponse.status >= 300) {
      throw new Error(apiResponse.message || 'Failed to load the settlement report');
    }

    let data = apiResponse.data;

    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  public async getSimCardReport(request: GetSimCardReportRequest): GetSimCardReportResponse {
    const { startDate, endDate } = request;
    const params = new URLSearchParams({ startDate, endDate });
    const apiResponse = await api.get<SimCardReportRow[]>(
      `${API_ENDPOINTS.REPORTS}/simcard?${params.toString()}`
    );

    let data = apiResponse.data;

    // FOR JSON PATH + parseJSON:true quirks don't apply here (plain recordset), but
    // stay defensive in case the driver ever surfaces a null/nested-array entry.
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  public async getInsuranceReport(request: GetInsuranceReportRequest): GetInsuranceReportResponse {
    const { startDate, endDate } = request;
    const params = new URLSearchParams({ startDate, endDate });
    const apiResponse = await api.get<InsuranceReportRow[]>(
      `${API_ENDPOINTS.REPORTS}/insurance?${params.toString()}`
    );

    let data = apiResponse.data;

    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }
}
export const reportApi = new ReportApi();
