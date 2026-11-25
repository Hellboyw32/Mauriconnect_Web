import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

/** An API failure with the server's error code, message and field errors. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: { path?: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data?.error;
    if (body) return Promise.reject(new ApiError(error.response!.status, body.code, body.message, body.details ?? []));
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError(0, 'TIMEOUT', 'The server took too long to respond. Please try again.'));
    }
    return Promise.reject(
      new ApiError(error.response?.status ?? 0, 'NETWORK_ERROR', 'We could not reach our booking system. Check your connection and try again.'),
    );
  },
);

export const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}
