import axios, { isAxiosError, type AxiosResponse } from 'axios';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

// Attach the session's JWT to every outgoing request - the api now requires
// it on every route except /auth/login (see api/src/api/index.ts).
axios.interceptors.request.use((requestConfig) => {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  if (accessToken) {
    requestConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  return requestConfig;
});

// A 401 means the token is missing/expired/invalid - drop it and send the
// user back to the login page rather than leaving them stuck on a page that
// silently fails every request.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

type Response<T> = {
  data?: T;
  message?: string;
  status: number;
};

type OverrideAxiosResponse<T> = Omit<AxiosResponse, 'data'> & {
  data: Response<T>;
};

class ApiService {
  public baseUrl: string;
  private envBaseUrl: string = import.meta.env.VITE_API_BASE_URL;

  constructor() {
    this.baseUrl = this.envBaseUrl;
  }

  public async get<T = any>(endpoint: string): Promise<Response<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response: OverrideAxiosResponse<T> = await axios.get(url);
      return {
        data: response.data.data,
        status: response.status
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {
          message: (error.response?.data as { message?: string })?.message || error.message,
          status: error.response?.status as number
        };
      }
      return error;
    }
  }

  public async post<T = any>(endpoint: string, data: any): Promise<Response<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response: OverrideAxiosResponse<T> = await axios.post(url, data);
      return {
        data: response.data.data,
        message: response.data.message,
        status: response.status
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {
          message: (error.response?.data as { message?: string })?.message || error.message,
          status: error.response?.status as number
        };
      }
      return error;
    }
  }

  public async put<T = any>(endpoint: string, data: any): Promise<Response<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response: OverrideAxiosResponse<T> = await axios.put(url, data);
      return {
        data: response.data.data,
        message: response.data.message,
        status: response.status
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {
          message: (error.response?.data as { message?: string })?.message || error.message,
          status: error.response?.status as number
        };
      }
      return error;
    }
  }

  public async delete<T = any>(endpoint: string, data?: any): Promise<Response<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response: OverrideAxiosResponse<T> = await axios.delete(url, { data });
      return {
        data: response.data.data,
        message: response.data.message,
        status: response.status
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {
          message: (error.response?.data as { message?: string })?.message || error.message,
          status: error.response?.status as number
        };
      }
      return error;
    }
  }
}

export const api = new ApiService();
