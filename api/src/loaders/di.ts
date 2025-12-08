import { Container } from 'typedi';
import LoggerInstance from './logger';
import { MSSqlInstance } from './mssql';

export default () => {
  try {
    Container.set('logger', LoggerInstance);
    Container.set('mssql', MSSqlInstance);
  } catch (error) {
    LoggerInstance.error('🔥  Error on dependency injector loader: %o', error);
  }
};
