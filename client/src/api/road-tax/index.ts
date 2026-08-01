import type { RoadTax, RoadTaxes, RoadTaxFormValues, RoadTaxFilters } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type GetRoadTaxesRequest = {
  filters?: RoadTaxFilters;
};

type GetRoadTaxesResponse = Promise<RoadTaxes>;

type GetRoadTaxRequest = {
  roadTaxId: number;
};

type GetRoadTaxResponse = Promise<RoadTax>;

type CreateRoadTaxRequest = {
  roadTax: RoadTaxFormValues;
};

type CreateRoadTaxResponse = Promise<{ success: boolean; message?: string }>;

type UpdateRoadTaxRequest = {
  roadTaxId: number;
  roadTax: RoadTaxFormValues;
};

type UpdateRoadTaxResponse = Promise<{ success: boolean; message?: string }>;

type DeleteRoadTaxRequest = {
  roadTaxId: number;
  createdBy?: string;
};

type DeleteRoadTaxResponse = Promise<{ success: boolean; message?: string }>;

class RoadTaxesApi {
  async getRoadTaxes(request: GetRoadTaxesRequest = {}): GetRoadTaxesResponse {
    const { filters } = request;
    const params = new URLSearchParams();

    if (filters?.carNumber) {
      params.append('carNumber', filters.carNumber);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.ROAD_TAX}?${queryString}`
      : API_ENDPOINTS.ROAD_TAX;

    const response = await api.get(url);
    let data = response.data;

    // FOR JSON PATH + parseJSON:true returns the array as data[0]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty/edge result
    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  async getRoadTax(request: GetRoadTaxRequest): GetRoadTaxResponse {
    const { roadTaxId } = request;
    const response = await api.get(`${API_ENDPOINTS.ROAD_TAX}/${roadTaxId}`);
    return response.data;
  }

  async createRoadTax(request: CreateRoadTaxRequest): CreateRoadTaxResponse {
    const { roadTax } = request;
    const response = await api.post(API_ENDPOINTS.ROAD_TAX, roadTax);
    return {
      success: response.status === 200 || response.status === 201,
      message: response.message
    };
  }

  async updateRoadTax(request: UpdateRoadTaxRequest): UpdateRoadTaxResponse {
    const { roadTaxId, roadTax } = request;
    const response = await api.put(`${API_ENDPOINTS.ROAD_TAX}/${roadTaxId}`, roadTax);
    return {
      success: response.status === 200,
      message: response.message
    };
  }

  async deleteRoadTax(request: DeleteRoadTaxRequest): DeleteRoadTaxResponse {
    const { roadTaxId, createdBy = 'system' } = request;
    const response = await api.delete(`${API_ENDPOINTS.ROAD_TAX}/${roadTaxId}`, { createdBy });
    return {
      success: response.status === 200,
      message: response.message
    };
  }
}

export const roadTaxesApi = new RoadTaxesApi();
