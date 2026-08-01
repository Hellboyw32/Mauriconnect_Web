import type {
  FitnessCertificate,
  FitnessCertificates,
  FitnessCertificateFormValues,
  FitnessCertificateFilters
} from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type GetFitnessCertificatesRequest = {
  filters?: FitnessCertificateFilters;
};

type GetFitnessCertificatesResponse = Promise<FitnessCertificates>;

type GetFitnessCertificateRequest = {
  fitnessId: number;
};

type GetFitnessCertificateResponse = Promise<FitnessCertificate>;

type CreateFitnessCertificateRequest = {
  fitnessCertificate: FitnessCertificateFormValues;
};

type CreateFitnessCertificateResponse = Promise<{ success: boolean; message?: string }>;

type UpdateFitnessCertificateRequest = {
  fitnessId: number;
  fitnessCertificate: FitnessCertificateFormValues;
};

type UpdateFitnessCertificateResponse = Promise<{ success: boolean; message?: string }>;

type DeleteFitnessCertificateRequest = {
  fitnessId: number;
  createdBy?: string;
};

type DeleteFitnessCertificateResponse = Promise<{ success: boolean; message?: string }>;

class FitnessCertificatesApi {
  async getFitnessCertificates(
    request: GetFitnessCertificatesRequest = {}
  ): GetFitnessCertificatesResponse {
    const { filters } = request;
    const params = new URLSearchParams();

    if (filters?.carNumber) {
      params.append('carNumber', filters.carNumber);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.FITNESS_CERTIFICATE}?${queryString}`
      : API_ENDPOINTS.FITNESS_CERTIFICATE;

    const response = await api.get(url);
    let data = response.data;

    // FOR JSON PATH + parseJSON:true returns the array as data[0]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty/edge result
    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  async getFitnessCertificate(
    request: GetFitnessCertificateRequest
  ): GetFitnessCertificateResponse {
    const { fitnessId } = request;
    const response = await api.get(`${API_ENDPOINTS.FITNESS_CERTIFICATE}/${fitnessId}`);
    return response.data;
  }

  async createFitnessCertificate(
    request: CreateFitnessCertificateRequest
  ): CreateFitnessCertificateResponse {
    const { fitnessCertificate } = request;
    const response = await api.post(API_ENDPOINTS.FITNESS_CERTIFICATE, fitnessCertificate);
    return {
      success: response.status === 200 || response.status === 201,
      message: response.message
    };
  }

  async updateFitnessCertificate(
    request: UpdateFitnessCertificateRequest
  ): UpdateFitnessCertificateResponse {
    const { fitnessId, fitnessCertificate } = request;
    const response = await api.put(
      `${API_ENDPOINTS.FITNESS_CERTIFICATE}/${fitnessId}`,
      fitnessCertificate
    );
    return {
      success: response.status === 200,
      message: response.message
    };
  }

  async deleteFitnessCertificate(
    request: DeleteFitnessCertificateRequest
  ): DeleteFitnessCertificateResponse {
    const { fitnessId, createdBy = 'system' } = request;
    const response = await api.delete(`${API_ENDPOINTS.FITNESS_CERTIFICATE}/${fitnessId}`, {
      createdBy
    });
    return {
      success: response.status === 200,
      message: response.message
    };
  }
}

export const fitnessCertificatesApi = new FitnessCertificatesApi();
