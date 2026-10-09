const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
const DEDUPE_WINDOW_MS = 5000;

export type ClientErrorCategory =
  | 'ApiError'
  | 'ApplicationError'
  | 'Timeout'
  | 'NetworkError'
  | 'AuthError'
  | 'ClientError'
  | 'Other';

export interface ClientErrorReport {
  errorCategory: ClientErrorCategory;
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
  httpMethod?: string;
  requestUrl?: string;
  statusCode?: number;
  componentName?: string;
  severity?: 'Warning' | 'Error' | 'Fatal';
}

const recentlyReported = new Map<string, number>();

// Sends an error captured in the browser to POST /client-errors (stored in
// AppLogError). Uses fetch rather than axios so a failing report can never
// re-enter the axios interceptors, and swallows every failure.
export const logClientError = (report: ClientErrorReport): void => {
  try {
    const key = `${report.errorCategory}|${report.requestUrl ?? ''}|${report.errorMessage}`;
    const now = Date.now();
    const last = recentlyReported.get(key);

    if (last && now - last < DEDUPE_WINDOW_MS) {
      return;
    }
    recentlyReported.set(key, now);

    const accessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!accessToken) {
      // The endpoint requires a session; nothing to attribute the error to.
      return;
    }

    void fetch(`${import.meta.env.VITE_API_BASE_URL}/client-errors`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        ...report,
        requestUrl: report.requestUrl ?? window.location.href
      })
    }).catch(() => undefined);
  } catch {
    // Reporting must never throw.
  }
};

// window.onerror + unhandled promise rejections. Call once at startup.
export const registerGlobalErrorHandlers = (): void => {
  window.addEventListener('error', (event) => {
    logClientError({
      errorCategory: 'ClientError',
      errorMessage: event.message || 'Unknown script error',
      stackTrace: event.error?.stack,
      componentName: `${event.filename}:${event.lineno}:${event.colno}`
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logClientError({
      errorCategory: 'ClientError',
      errorMessage: reason?.message || String(reason),
      stackTrace: reason?.stack,
      componentName: 'unhandledrejection'
    });
  });
};
