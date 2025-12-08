import di from './di';
import expressLoader from './express';
import Logger from './logger';
import { MSSqlInstance } from './mssql';

export default async ({ expressApp }) => {
  (await MSSqlInstance).connected
    ? Logger.info('✌️  DB loaded and connected!')
    : Logger.error('🔥  Error on connecting to DB!');

  di();

  expressLoader({ app: expressApp });
  Logger.info('✌️  Express loaded!');
};
