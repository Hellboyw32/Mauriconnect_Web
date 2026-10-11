import type { Psvl, Psvls, PsvlFormValues } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type MutationResult = { success: boolean; message?: string };

const isOk = (status: number) => status >= 200 && status < 300;

// api.* never rejects on an HTTP error (it returns { status, message }), so a
// failed save would otherwise look like a success. Business-rule failures from
// the API (e.g. overlapping PSVL dates) are surfaced as thrown errors.
const toResult = (response: { status: number; message?: string }): MutationResult => {
  if (!isOk(response.status)) {
    throw new Error(response.message || 'Request failed');
  }

  return { success: true, message: response.message };
};

class PsvlApi {
  async getPsvls(carId?: number): Promise<Psvls> {
    const url = carId ? `${API_ENDPOINTS.PSVL}?carId=${carId}` : API_ENDPOINTS.PSVL;
    const response = await api.get(url);
    let data = response.data;

    // FOR JSON PATH + parseJSON:true returns the array as data[0]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  async getPsvl(psvlId: number): Promise<Psvl> {
    const response = await api.get(`${API_ENDPOINTS.PSVL}/${psvlId}`);
    return response.data;
  }

  async createPsvl(psvl: PsvlFormValues): Promise<MutationResult> {
    return toResult(await api.post(API_ENDPOINTS.PSVL, psvl));
  }

  async updatePsvl(psvlId: number, psvl: PsvlFormValues): Promise<MutationResult> {
    return toResult(await api.put(`${API_ENDPOINTS.PSVL}/${psvlId}`, psvl));
  }

  async deletePsvl(psvlId: number, createdBy = 'system'): Promise<MutationResult> {
    return toResult(await api.delete(`${API_ENDPOINTS.PSVL}/${psvlId}`, { createdBy }));
  }
}

export const psvlApi = new PsvlApi();
