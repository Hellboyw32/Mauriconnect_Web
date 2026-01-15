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
      const recordset = (await response).recordset;
      const status = 200;
      const message = 'Operation completed successfully.';

      let data: any;
      if (isJsonPath) {
        // FOR JSON PATH returns a single row with JSON string in the first column
        const jsonString = recordset[0] ? Object.values(recordset[0])[0] : null;

        // Debug logging
        this.logger.info('🔍 Stored Procedure: %s', storedProcedure);
        this.logger.info('🔍 Recordset length: %d', recordset.length);
        this.logger.info('🔍 First record: %o', recordset[0]);
        this.logger.info('🔍 JSON String type: %s', typeof jsonString);
        this.logger.info('🔍 JSON String value: %o', jsonString);

        data = jsonString ? JSON.parse(jsonString as string) : null;

        this.logger.info('🔍 Parsed data type: %s', typeof data);
        this.logger.info('🔍 Is Array: %s', Array.isArray(data));
      } else {
        data = recordset;
      }

      return { status, message, data, success: true };
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
      const recordset = (await response).recordset;
      const status = 200;
      const message = 'Operation completed successfully.';

      let data: any;
      if (isJsonPath) {
        // FOR JSON PATH returns a single row with JSON string in the first column
        const jsonString = recordset[0] ? Object.values(recordset[0])[0] : null;
        data = jsonString ? JSON.parse(jsonString as string) : null;
      } else {
        data = recordset;
      }

      return { status, message, data, success: true };
    } catch (error) {
      this.logger.error('🔥  Error on requesting DB data: %o', error);
      const status = 500;
      const message = `Operation failed with error message ${error}.`;

      return { status, error, message, success: false };
    }
  }
}
