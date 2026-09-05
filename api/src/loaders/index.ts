import di from './di';
import expressLoader from './express';
import Logger from './logger';
import { MSSqlInstance } from './mssql';

export default async ({ expressApp }) => {
  (await MSSqlInstance).connected
    ? Logger.info('✌️  DB loaded and connected!')
    : Logger.error('🔥  Error on connecting to DB!');

  di();

  if (!process.env.INVOICE_API_USERNAME || !process.env.INVOICE_API_PASSWORD) {
    Logger.warn(
      '⚠️  INVOICE_API_USERNAME / INVOICE_API_PASSWORD is not set — invoice reference generation will fail with 401 Unauthorized.'
    );
  }

  expressLoader({ app: expressApp });
  Logger.info('✌️  Express loaded!');
};
