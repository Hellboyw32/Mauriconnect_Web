import type { CarInsurance, CarInsurances, CarInsuranceFormValues, CarInsuranceFilters } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type GetCarInsurancesRequest = {
  filters?: CarInsuranceFilters;
};

type GetCarInsurancesResponse = Promise<CarInsurances>;

type GetCarInsuranceRequest = {
  carInsuranceId: number;
};

type GetCarInsuranceResponse = Promise<CarInsurance>;

type CreateCarInsuranceRequest = {
  carInsurance: CarInsuranceFormValues;
};

type CreateCarInsuranceResponse = Promise<{ success: boolean; message?: string }>;

type UpdateCarInsuranceRequest = {
  carInsuranceId: number;
  carInsurance: CarInsuranceFormValues;
};

type UpdateCarInsuranceResponse = Promise<{ success: boolean; message?: string }>;

type DeleteCarInsuranceRequest = {
  carInsuranceId: number;
  createdBy?: string;
};

type DeleteCarInsuranceResponse = Promise<{ success: boolean; message?: string }>;

class CarInsurancesApi {
  async getCarInsurances(request: GetCarInsurancesRequest = {}): GetCarInsurancesResponse {
    const { filters } = request;
    const params = new URLSearchParams();

    if (filters?.carNumber) {
      params.append('carNumber', filters.carNumber);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.CAR_INSURANCE}?${queryString}`
      : API_ENDPOINTS.CAR_INSURANCE;

    const response = await api.get(url);
    let data = response.data;

    // FOR JSON PATH + parseJSON:true returns the array as data[0]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty/edge result
    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  async getCarInsurance(request: GetCarInsuranceRequest): GetCarInsuranceResponse {
    const { carInsuranceId } = request;
    const response = await api.get(`${API_ENDPOINTS.CAR_INSURANCE}/${carInsuranceId}`);
    return response.data;
  }

  async createCarInsurance(request: CreateCarInsuranceRequest): CreateCarInsuranceResponse {
    const { carInsurance } = request;
    const response = await api.post(API_ENDPOINTS.CAR_INSURANCE, carInsurance);
    return {
      success: response.status === 200 || response.status === 201,
      message: response.message
    };
  }

  async updateCarInsurance(request: UpdateCarInsuranceRequest): UpdateCarInsuranceResponse {
    const { carInsuranceId, carInsurance } = request;
    const response = await api.put(
      `${API_ENDPOINTS.CAR_INSURANCE}/${carInsuranceId}`,
      carInsurance
    );
    return {
      success: response.status === 200,
      message: response.message
    };
  }

  async deleteCarInsurance(request: DeleteCarInsuranceRequest): DeleteCarInsuranceResponse {
    const { carInsuranceId, createdBy = 'system' } = request;
    const response = await api.delete(`${API_ENDPOINTS.CAR_INSURANCE}/${carInsuranceId}`, {
      createdBy
    });
    return {
      success: response.status === 200,
      message: response.message
    };
  }
}

export const carInsurancesApi = new CarInsurancesApi();
