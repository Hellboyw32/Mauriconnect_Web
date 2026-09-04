import { SERVICING_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { Servicing, ServicingRecords, ServicingFormValues } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IServicingService {
  getServicingHistory(carNumber?: string): Promise<Response<ServicingRecords>>;
  getServicingRecord(servicingId: number): Promise<Response<Servicing>>;
  addServicingRecord(values: ServicingFormValues): Promise<Response>;
  updateServicingRecord(servicingId: number, values: ServicingFormValues): Promise<Response>;
}

@Service()
export class ServicingService implements IServicingService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getServicingHistory(carNumber?: string): Promise<Response<ServicingRecords>> {
    const storedProcedure = STORED_PROCEDURES.GET_SERVICING_HISTORY_JSON;
    const inputs = [{ 'CarNumber': carNumber || null }];

    const result = await this.mssqlService.requestByStoredProcedure<ServicingRecords>(
      storedProcedure,
      inputs,
      false
    );

    let items: any[] = [];

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      // FOR JSON PATH + parseJSON:true returns the entire array as result.data[0]
      items = Array.isArray(result.data[0]) ? result.data[0] : result.data;
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty/edge result
    items = items.filter((item) => item != null);

    return { ...result, data: items as ServicingRecords };
  }

  async getServicingRecord(servicingId: number): Promise<Response<Servicing>> {
    const storedProcedure = STORED_PROCEDURES.GET_SINGLE_SERVICING_RECORD_JSON;
    const inputs = [{ 'ServicingId': servicingId }];

    const result = await this.mssqlService.requestByStoredProcedure<Servicing>(
      storedProcedure,
      inputs,
      false
    );

    // FOR JSON PATH, WITHOUT_ARRAY_WRAPPER + parseJSON:true returns the object as result.data[0]
    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as Servicing };
  }

  async addServicingRecord(values: ServicingFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.ADD_SERVICING_RECORD;
    const inputs = [
      {
        'CarId': values.CarId,
        'DateServiced': values.DateServiced,
        'MileageServiced': values.MileageServiced,
        'ServicingFrequency': values.ServicingFrequency,
        'Note': values.Note || null,
        'Login': values.CreatedBy || 'system'
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async updateServicingRecord(
    servicingId: number,
    values: ServicingFormValues
  ): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_SERVICING_RECORD;
    const inputs = [
      {
        'ServicingId': servicingId,
        'CarId': values.CarId,
        'DateServiced': values.DateServiced,
        'MileageServiced': values.MileageServiced,
        'ServicingFrequency': values.ServicingFrequency,
        'Note': values.Note || null,
        'Login': values.CreatedBy || 'system'
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
