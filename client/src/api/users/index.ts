import type { ManagedUser, ManagedUsers, UserFilters, UserFormValues } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type MutationResponse = { success: boolean; message?: string };

class UsersApi {
  async getUsers(filters: UserFilters = {}): Promise<ManagedUsers> {
    const params = new URLSearchParams();

    if (filters.username) params.append('username', filters.username);
    if (filters.userType) params.append('userType', filters.userType);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.USERS}?${queryString}` : API_ENDPOINTS.USERS;

    const response = await api.get(url);
    let data = response.data;

    // FOR JSON PATH + parseJSON:true returns the array as data[0]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      data = data[0];
    }

    return Array.isArray(data) ? data.filter((item) => item != null) : [];
  }

  async getUser(userId: number): Promise<ManagedUser> {
    const response = await api.get<ManagedUser>(`${API_ENDPOINTS.USERS}/${userId}`);

    if (!response.data) {
      throw new Error(response.message || 'User not found');
    }

    return response.data;
  }

  async createUser(values: UserFormValues): Promise<MutationResponse> {
    const response = await api.post(API_ENDPOINTS.USERS, values);

    if (response.status >= 400) {
      throw new Error(response.message || 'Failed to create user');
    }

    return { success: true, message: response.message };
  }

  async updateUser(userId: number, values: UserFormValues): Promise<MutationResponse> {
    const response = await api.put(`${API_ENDPOINTS.USERS}/${userId}`, values);

    if (response.status >= 400) {
      throw new Error(response.message || 'Failed to update user');
    }

    return { success: true, message: response.message };
  }

  async lockUser(userId: number): Promise<MutationResponse> {
    const response = await api.post(`${API_ENDPOINTS.USERS}/${userId}/lock`, {});

    if (response.status >= 400) {
      throw new Error(response.message || 'Failed to lock user');
    }

    return { success: true, message: response.message };
  }

  async unlockUser(userId: number): Promise<MutationResponse> {
    const response = await api.post(`${API_ENDPOINTS.USERS}/${userId}/unlock`, {});

    if (response.status >= 400) {
      throw new Error(response.message || 'Failed to unlock user');
    }

    return { success: true, message: response.message };
  }

  async changePassword(userId: number, password: string): Promise<MutationResponse> {
    const response = await api.post(`${API_ENDPOINTS.USERS}/${userId}/change-password`, {
      password
    });

    if (response.status >= 400) {
      throw new Error(response.message || 'Failed to change password');
    }

    return { success: true, message: response.message };
  }
}

export const usersApi = new UsersApi();
