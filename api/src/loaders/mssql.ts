import environmentConfig from '@/config';
import mssql, { type config as dbConfig } from 'mssql';

const { database } = environmentConfig;

const sqlConfig: dbConfig = {
  database: database.name,
  password: database.password,
  server: database.server,
  port: database.port,
  user: database.user,
  parseJSON: true,
  options: {
    encrypt: false,
    debug: {
      data: true,
      packet: true,
      payload: true
    },
    trustServerCertificate: true
  }
};

export const MSSqlInstance = mssql.connect(sqlConfig);
