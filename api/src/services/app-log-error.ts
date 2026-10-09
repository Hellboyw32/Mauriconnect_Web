import { APP_LOG_ERROR_STORED_PROCEDURES } from '@/constants';
import { APP_LOG_ERROR_CATEGORIES } from '@libs/types';
import type {
  AppLogErrorCategory,
  AppLogErrorInput,
  AppLogErrorSeverity,
  AppLogErrorSource
} from '@libs/types';
import { Container, Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { BaseMSSqlService } from '../base/base-mssql';

export interface AppLogErrorContext {
  userId?: number | null;
  username?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const TIMEOUT_CODES = ['ETIMEDOUT', 'ETIMEOUT', 'ECONNABORTED', 'ESOCKETTIMEDOUT'];
const DATABASE_CODES = ['EREQUEST', 'ELOGIN', 'ESOCKET', 'ECONNCLOSED', 'ENOTOPEN', 'EABORT'];
const SENSITIVE_KEYS = /pass(word)?|token|secret|authorization/i;

const truncate = (value: string | null | undefined, max: number): string | null =>
  value ? value.slice(0, max) : null;

const redact = (value: unknown, depth = 0): unknown => {
  if (value == null || depth > 5) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redact(val, depth + 1)
      ])
    );
  }
  return value;
};

// Work out which AppLogError category an arbitrary thrown value belongs to.
export const classifyError = (error: any, statusCode?: number): AppLogErrorCategory => {
  const code: string | undefined = error?.code;

  if (code && TIMEOUT_CODES.includes(code)) return 'Timeout';
  if (/timeout|timed out/i.test(error?.message || '')) return 'Timeout';
  if (code && DATABASE_CODES.includes(code)) return 'DatabaseError';
  if (statusCode === 401 || statusCode === 403) return 'AuthError';
  if (statusCode === 400 || statusCode === 422) return 'ValidationError';
  if (statusCode && statusCode >= 400) return 'ApiError';
  return 'ApplicationError';
};

@Service()
export class AppLogErrorService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  // Never throws - logging an error must not create another one.
  async log(
    input: AppLogErrorInput,
    context: AppLogErrorContext = {},
    overrides: { source?: AppLogErrorSource; severity?: AppLogErrorSeverity } = {}
  ): Promise<void> {
    const logger: Logger = Container.get('logger');

    try {
      const category = APP_LOG_ERROR_CATEGORIES.includes(input.errorCategory)
        ? input.errorCategory
        : 'Other';
      const body = input.requestBody != null ? JSON.stringify(redact(input.requestBody)) : null;

      const result = await this.mssqlService.requestByStoredProcedure(
        APP_LOG_ERROR_STORED_PROCEDURES.INSERT_APP_LOG_ERROR,
        [
          {
            'ErrorCategory': category,
            'Severity': overrides.severity || input.severity || 'Error',
            'Source': overrides.source || input.source || 'Api',
            'ErrorCode': truncate(input.errorCode, 100),
            'ErrorMessage': truncate(input.errorMessage, 8000) || 'Unknown error',
            'StackTrace': truncate(input.stackTrace, 8000),
            'HttpMethod': truncate(input.httpMethod, 10),
            'RequestUrl': truncate(input.requestUrl, 2000),
            'StatusCode': input.statusCode ?? null,
            'RequestBody': truncate(body, 4000),
            'ComponentName': truncate(input.componentName, 200),
            'UserId': context.userId ?? null,
            'Username': truncate(context.username, 100),
            'IPAddress': truncate(context.ipAddress, 50),
            'UserAgent': truncate(context.userAgent, 500),
            'Environment': process.env.NODE_ENV || null
          }
        ]
      );

      if (!result.success) {
        logger.warn('Could not persist AppLogError row: %s', result.message);
      }
    } catch (error) {
      logger.warn('Could not persist AppLogError row: %o', error);
    }
  }
}
