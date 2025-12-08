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
}

export const api = new ApiService();
