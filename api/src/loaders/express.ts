import routes from '@/api';
import config from '@/config';
import cors from 'cors';
import { AppLogErrorService, classifyError } from '@/services/app-log-error';
import express from 'express';
import { Container } from 'typedi';

const REQUEST_TIMEOUT_MS = 120000;

const requestContext = (req: express.Request) => ({
  userId: req.user?.userId,
  username: req.user?.username,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

export default ({ app }: { app: express.Application }) => {
  const appLogError = Container.get(AppLogErrorService);

  app.get('/', (_, res) => {
    res.status(200).send('Express server up and running!').end();
  });

  app.get('/status', (_, res) => {
    res.status(200).end();
  });
  app.head('/status', (_, res) => {
    res.status(200).end();
  });

  app.enable('trust proxy');

  app.use(cors());

  app.use(express.json());

  // Log (and answer 503 to) any request that takes longer than REQUEST_TIMEOUT_MS.
  app.use((req, res, next) => {
    res.setTimeout(REQUEST_TIMEOUT_MS, () => {
      appLogError.log(
        {
          errorCategory: 'Timeout',
          errorCode: 'REQUEST_TIMEOUT',
          errorMessage: `Request exceeded ${REQUEST_TIMEOUT_MS}ms`,
          httpMethod: req.method,
          requestUrl: req.originalUrl,
          statusCode: 503,
          requestBody: req.body
        },
        requestContext(req)
      );

      if (!res.headersSent) {
        res.status(503).json({ errors: { message: 'The request timed out.' } });
      }
    });
    next();
  });

  app.use(config.api.prefix, routes());

  // Catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  // Error handlers
  app.use((err, req, res, next) => {
    const statusCode = err.status || 500;

    // 404s are noise (bots, favicon...), everything else goes to AppLogError.
    if (statusCode !== 404) {
      appLogError.log(
        {
          errorCategory: classifyError(err, statusCode),
          errorCode: err.code,
          errorMessage: err.message || String(err),
          stackTrace: err.stack,
          httpMethod: req.method,
          requestUrl: req.originalUrl,
          statusCode,
          requestBody: req.body
        },
        requestContext(req)
      );
    }

    res.status(statusCode);
    res.json({
      errors: {
        message: err.message
      }
    });
  });
};
