import type { AuditLogFilters, AuditLogs, UserLoginLogFilters, UserLoginLogs } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

const unwrapArray = (data: any): any[] => {
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    data = data[0];
  }
  return Array.isArray(data) ? data.filter((item) => item != null) : [];
};

class AdminLogsApi {
  async getLoginLogs(filters: UserLoginLogFilters = {}): Promise<UserLoginLogs> {
    const params = new URLSearchParams();

    if (filters.username) params.append('username', filters.username);
    if (filters.fromDate) params.append('fromDate', filters.fromDate.toISOString());
    if (filters.toDate) params.append('toDate', filters.toDate.toISOString());
    if (filters.loginSuccessful !== '' && filters.loginSuccessful !== undefined) {
      params.append('loginSuccessful', String(filters.loginSuccessful));
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.USERS}/logs?${queryString}`
      : `${API_ENDPOINTS.USERS}/logs`;

    const response = await api.get(url);
    return unwrapArray(response.data);
  }

  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogs> {
    const params = new URLSearchParams();

    if (filters.username) params.append('username', filters.username);
    if (filters.action) params.append('action', filters.action);
    if (filters.fromDate) params.append('fromDate', filters.fromDate.toISOString());
    if (filters.toDate) params.append('toDate', filters.toDate.toISOString());

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.USERS}/audit-logs?${queryString}`
      : `${API_ENDPOINTS.USERS}/audit-logs`;

    const response = await api.get(url);
    return unwrapArray(response.data);
  }
}

export const adminLogsApi = new AdminLogsApi();
