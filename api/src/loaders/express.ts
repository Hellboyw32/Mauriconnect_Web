import routes from '@/api';
import config from '@/config';
import cors from 'cors';
import express from 'express';

export default ({ app }: { app: express.Application }) => {
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

  app.use(config.api.prefix, routes());

  // Catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  // Error handlers
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message
      }
    });
  });
};
