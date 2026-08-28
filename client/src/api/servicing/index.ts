import type { Servicing, ServicingRecords, ServicingFormValues, ServicingFilters } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type GetServicingHistoryRequest = {
  filters?: ServicingFilters;
};

type GetServicingHistoryResponse = Promise<ServicingRecords>;

type GetServicingRecordRequest = {
  servicingId: number;
};

type GetServicingRecordResponse = Promise<Servicing>;

type AddServicingRecordRequest = {
  servicing: ServicingFormValues;
};

type AddServicingRecordResponse = Promise<{ success: boolean; message?: string }>;

type UpdateServicingRecordRequest = {
  servicingId: number;
  servicing: ServicingFormValues;
};

type UpdateServicingRecordResponse = Promise<{ success: boolean; message?: string }>;

class ServicingApi {
  async getServicingHistory(request: GetServicingHistoryRequest = {}): GetServicingHistoryResponse {
    const { filters } = request;
    const params = new URLSearchParams();

    if (filters?.carNumber) {
      params.append('carNumber', filters.carNumber);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.SERVICING}?${queryString}`
      : API_ENDPOINTS.SERVICING;

    const response = await api.get(url);
    let data = response.data;

    // FOR JSON PATH + parseJSON:true returns the array as data[0]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty/edge result
    return Array.isArray(data) ? data.filter((item: Servicing | null) => item != null) : [];
  }

  async getServicingRecord(request: GetServicingRecordRequest): GetServicingRecordResponse {
    const { servicingId } = request;
    const response = await api.get(`${API_ENDPOINTS.SERVICING}/${servicingId}`);
    return response.data;
  }

  async addServicingRecord(request: AddServicingRecordRequest): AddServicingRecordResponse {
    const { servicing } = request;
    const response = await api.post(API_ENDPOINTS.SERVICING, servicing);
    return {
      success: response.status === 200 || response.status === 201,
      message: response.message
    };
  }

  async updateServicingRecord(request: UpdateServicingRecordRequest): UpdateServicingRecordResponse {
    const { servicingId, servicing } = request;
    const response = await api.put(`${API_ENDPOINTS.SERVICING}/${servicingId}`, servicing);
    return {
      success: response.status === 200,
      message: response.message
    };
  }
}

export const servicingApi = new ServicingApi();
