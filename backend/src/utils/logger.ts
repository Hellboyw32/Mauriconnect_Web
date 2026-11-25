import pino from 'pino';
import { env } from '../config/env';

// Personal data and secrets are never written to logs.
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["paypal-auth-algo"]',
      '*.email',
      '*.mobileNumber',
      '*.address',
      '*.drivingLicenceNumber',
      '*.password',
    ],
    censor: '[redacted]',
  },
  transport:
    env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } : undefined,
});
