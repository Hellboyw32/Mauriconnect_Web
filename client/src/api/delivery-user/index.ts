import type { DeliveryUsers } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type GetDeliveryUsersResponse = Promise<DeliveryUsers>;

class DeliveryUserApi {
  async getDeliveryUsers(): GetDeliveryUsersResponse {
    const apiResponse = await api.get<DeliveryUsers>(API_ENDPOINTS.DELIVERY_USERS);
    const data = apiResponse.data;
    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }
}

export const deliveryUserApi = new DeliveryUserApi();
