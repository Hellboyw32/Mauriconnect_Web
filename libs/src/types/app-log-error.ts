export const APP_LOG_ERROR_CATEGORIES = [
  'ApiError',
  'ApplicationError',
  'Timeout',
  'DatabaseError',
  'NetworkError',
  'ValidationError',
  'AuthError',
  'FtpError',
  'ClientError',
  'Other'
] as const;

export type AppLogErrorCategory = (typeof APP_LOG_ERROR_CATEGORIES)[number];
export type AppLogErrorSeverity = 'Warning' | 'Error' | 'Fatal';
export type AppLogErrorSource = 'Api' | 'Client';

export interface AppLogErrorInput {
  errorCategory: AppLogErrorCategory;
  severity?: AppLogErrorSeverity;
  source?: AppLogErrorSource;
  errorCode?: string | null;
  errorMessage: string;
  stackTrace?: string | null;
  httpMethod?: string | null;
  requestUrl?: string | null;
  statusCode?: number | null;
  requestBody?: unknown;
  componentName?: string | null;
}
