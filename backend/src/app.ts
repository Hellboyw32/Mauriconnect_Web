import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { Services } from './container';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createRateLimits } from './middleware/rateLimits';
import { apiRouter, webhookRouter } from './routes';
import { logger } from './utils/logger';

export interface AppOptions {
  services: Services;
  corsOrigins: string[];
  trustProxy: boolean;
  rateLimitsEnabled: boolean;
  adminApiKey: string;
  publicConfig: { paymentProvider: string; paypalClientId: string | null };
}

export function createApp(options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  if (options.trustProxy) app.set('trust proxy', 1);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      serializers: { req: (req) => ({ id: req.id, method: req.method, url: req.url?.replace(/token=[^&]+/, 'token=[redacted]') }) },
    }),
  );

  // JSON API: no inline content, no framing.
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(
    cors({
      origin: options.corsOrigins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'Content-Disposition'],
      maxAge: 600,
    }),
  );

  const limits = createRateLimits(options.rateLimitsEnabled);
  const routeOptions = { services: options.services, limits, adminApiKey: options.adminApiKey, publicConfig: options.publicConfig };

  app.use('/api', webhookRouter(routeOptions));
  app.use(express.json({ limit: '64kb', strict: true }));
  app.use('/api', limits.global, apiRouter(routeOptions));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
