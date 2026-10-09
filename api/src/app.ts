import 'reflect-metadata';

import express from 'express';
import config from './config';
import Logger from './loaders/logger';

async function startServer() {
  const app = express();

  await require('./loaders').default({ expressApp: app });

  app
    .listen(config.port, () => {
      Logger.info(`
      ###############################################
      🛡️  Server listening on port: ${config.port} 🛡️
      ###############################################
    `);
    })
    .on('error', (err) => {
      Logger.error(err);
      process.exit(1);
    });
}

// Last-resort capture of anything that escapes a try/catch. Logged to the
// console and to AppLogError, then (for uncaught exceptions) the process
// exits so a supervisor can restart it in a clean state.
const logProcessError = async (error: any, message: string, severity: 'Error' | 'Fatal') => {
  Logger.error(`${message}: %o`, error);

  try {
    const { AppLogErrorService } = require('./services/app-log-error');
    const { Container } = require('typedi');

    await Container.get(AppLogErrorService).log({
      errorCategory: 'ApplicationError',
      severity,
      errorCode: error?.code,
      errorMessage: `${message}: ${error?.message || String(error)}`,
      stackTrace: error?.stack,
      componentName: 'process'
    });
  } catch (logError) {
    Logger.error('Could not record process error: %o', logError);
  }
};

process.on('unhandledRejection', (reason) => {
  logProcessError(reason, 'Unhandled promise rejection', 'Error');
});

process.on('uncaughtException', async (error) => {
  await logProcessError(error, 'Uncaught exception', 'Fatal');
  process.exit(1);
});

startServer();
