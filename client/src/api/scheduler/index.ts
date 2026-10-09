import type { SchedulerData } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

class SchedulerApi {
  async getSchedulerData(): Promise<SchedulerData> {
    const response = await api.get<SchedulerData>(API_ENDPOINTS.SCHEDULER);

    return {
      categories: response.data?.categories ?? [],
      cars: response.data?.cars ?? [],
      bookings: response.data?.bookings ?? []
    };
  }
}

export const schedulerApi = new SchedulerApi();
