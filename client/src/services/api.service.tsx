import axios, { isAxiosError, type AxiosResponse } from 'axios';

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
          message: error.message,
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
          message: error.message,
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
          message: error.message,
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
          message: error.message,
          status: error.response?.status as number
        };
      }
      return error;
    }
  }
}

export const api = new ApiService();
