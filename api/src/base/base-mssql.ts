import type { Response, StoredProcedureInput } from '@/types';
import { Request } from 'mssql';
import { Container, Service } from 'typedi';
import type { Logger } from 'winston';

export interface IBaseMSSqlService {
  requestByStoredProcedure<T = any>(
    storedProcedure: string,
    inputs?: any[],
    isJsonPath?: boolean
  ): Promise<Response<T>>;
  requestByQuery<T>(query: string, isJsonPath: boolean): Promise<Response<T>>;
}

@Service()
export class BaseMSSqlService implements IBaseMSSqlService {
  private readonly logger: Logger;
  constructor() {
    this.logger = Container.get('logger');
  }

  async requestByStoredProcedure<T = any>(
    storedProcedure: string,
    inputs?: StoredProcedureInput[],
    isJsonPath?: boolean
  ): Promise<Response<T>> {
    const request = new Request();
    if (inputs && inputs.length) {
      inputs.forEach((input) => {
        for (const key in input) {
          request.input(key, input[key]);
        }
      });
    }
    const response = request.execute(storedProcedure);

    try {
      const data = (await response).recordset;
      const status = 200;
      const message = 'Operation completed successfully.';

      return { status, message, data: isJsonPath ? data[0] : data, success: true };
    } catch (error) {
      this.logger.error('🔥  Error on requesting DB data: %o', error);
      const status = 500;
      const message = `Operation failed with error message ${error}.`;

      return { status, error, message, success: false };
    }
  }

  async requestByQuery<T = any>(query: string, isJsonPath: boolean = false): Promise<Response<T>> {
    const request = new Request();
    const response = request.query<any[]>(query);

    try {
      const data = (await response).recordset;
      const status = 200;
      const message = 'Operation completed successfully.';

      return { status, message, data: isJsonPath ? data[0] : data, success: true };
    } catch (error) {
      this.logger.error('🔥  Error on requesting DB data: %o', error);
      const status = 500;
      const message = `Operation failed with error message ${error}.`;

      return { status, error, message, success: false };
    }
  }
}
