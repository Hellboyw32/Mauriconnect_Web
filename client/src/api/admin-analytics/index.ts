import type { AuditLogs, LoginAnalytics, UserAnalytics } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

export interface AdminAnalytics {
  users: UserAnalytics;
  logins: LoginAnalytics;
  recentActivity: AuditLogs;
}

class AdminAnalyticsApi {
  async getAnalytics(): Promise<AdminAnalytics> {
    const response = await api.get<AdminAnalytics>(`${API_ENDPOINTS.ADMIN}/analytics`);

    if (!response.data) {
      throw new Error(response.message || 'Failed to load analytics');
    }

    return response.data;
  }
}

export const adminAnalyticsApi = new AdminAnalyticsApi();
