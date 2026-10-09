import { AppLogErrorService } from '@/services/app-log-error';
import { APP_LOG_ERROR_CATEGORIES } from '@libs/types';
import { Router, type Request, type Response } from 'express';
import { Container } from 'typedi';

const route = Router();

export default (app: Router) => {
  app.use('/client-errors', route);

  // Receives errors captured in the browser (axios failures, React error
  // boundary, window.onerror ...) and stores them in AppLogError.
  route.post('/', (req: Request, res: Response) => {
    const body = req.body || {};

    if (!body.errorMessage) {
      res.status(400).json({ message: 'errorMessage is required.' });
      return;
    }

    const errorCategory = APP_LOG_ERROR_CATEGORIES.includes(body.errorCategory)
      ? body.errorCategory
      : 'ClientError';

    // Fire and forget - the client must never wait on (or fail because of) logging.
    Container.get(AppLogErrorService).log(
      {
        errorCategory,
        severity: body.severity,
        errorCode: body.errorCode,
        errorMessage: String(body.errorMessage),
        stackTrace: body.stackTrace,
        httpMethod: body.httpMethod,
        requestUrl: body.requestUrl,
        statusCode: typeof body.statusCode === 'number' ? body.statusCode : null,
        componentName: body.componentName
      },
      {
        userId: req.user?.userId,
        username: req.user?.username,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      },
      { source: 'Client' }
    );

    res.status(202).json({ message: 'Error logged.' });
  });
};
