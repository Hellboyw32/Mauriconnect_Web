import type { User } from '@libs/types';
import { API_ENDPOINTS } from '@libs/constants';
import { api } from 'src/services/api.service';

type SignInRequest = {
  username: string;
  password: string;
};

type SignInResponse = {
  accessToken: string;
  loginLogId?: number;
  user: User;
};

class AuthApi {
  async signIn(request: SignInRequest): Promise<SignInResponse> {
    const response = await api.post<SignInResponse>(`${API_ENDPOINTS.AUTH}/login`, request);

    if (!response.data) {
      throw new Error(response.message || 'Please check your username and password');
    }

    return response.data;
  }

  async signOut(loginLogId?: number): Promise<void> {
    await api.post(`${API_ENDPOINTS.AUTH}/logout`, { loginLogId });
  }

  async me(): Promise<User> {
    const response = await api.get<User>(`${API_ENDPOINTS.AUTH}/me`);

    if (!response.data) {
      throw new Error(response.message || 'Invalid authorization token');
    }

    return response.data;
  }
}

export const authApi = new AuthApi();
