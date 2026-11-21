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

    // Before the loaders have run there is no logger/DB service to save to (and a
    // failed startup is usually the database being unreachable) - the console
    // line above is the record. Trying anyway would only throw a misleading
    // "ServiceNotFoundError: logger" that hides the real error.
    if (!Container.has('logger')) {
      return;
    }

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

// A failure while starting (typically the database connection) must stop the
// process with a non-zero exit code and a clear message - otherwise the rejection
// is swallowed, nothing keeps the process alive and it exits as if it were a clean
// shutdown (nodemon: "clean exit - waiting for changes").
startServer().catch((error) => {
  Logger.error('🔥  The API failed to start: %o', error);

  if (['ELOGIN', 'ESOCKET', 'ETIMEOUT', 'ECONNREFUSED', 'ENOTFOUND'].includes(error?.code)) {
    Logger.error(
      '🔥  Cannot reach the database. Check that SQL Server is running and reachable, and that the DATABASE_* values in api/.env are correct.'
    );
  }

  process.exit(1);
});
