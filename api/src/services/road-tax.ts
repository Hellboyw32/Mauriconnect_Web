import { ROAD_TAX_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { RoadTax, RoadTaxes, RoadTaxFormValues } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IRoadTaxService {
  getRoadTaxes(carNumber?: string): Promise<Response<RoadTaxes>>;
  getRoadTax(roadTaxId: number): Promise<Response<RoadTax>>;
  createRoadTax(values: RoadTaxFormValues): Promise<Response>;
  updateRoadTax(roadTaxId: number, values: RoadTaxFormValues): Promise<Response>;
  deleteRoadTax(roadTaxId: number, createdBy: string): Promise<Response>;
}

@Service()
export class RoadTaxService implements IRoadTaxService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getRoadTaxes(carNumber?: string): Promise<Response<RoadTaxes>> {
    const storedProcedure = STORED_PROCEDURES.GET_ROAD_TAXES_JSON;
    const inputs = [{ 'CarNumber': carNumber || null }];

    const result = await this.mssqlService.requestByStoredProcedure<RoadTaxes>(
      storedProcedure,
      inputs,
      false
    );

    let items: any[] = [];

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      items = Array.isArray(result.data[0]) ? result.data[0] : result.data;
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty/edge result
    items = items.filter((item) => item != null);

    return { ...result, data: items as RoadTaxes };
  }

  async getRoadTax(roadTaxId: number): Promise<Response<RoadTax>> {
    const storedProcedure = STORED_PROCEDURES.GET_ROAD_TAX_JSON;
    const inputs = [{ 'RoadTaxId': roadTaxId }];

    const result = await this.mssqlService.requestByStoredProcedure<RoadTax>(
      storedProcedure,
      inputs,
      false
    );

    // FOR JSON PATH, WITHOUT_ARRAY_WRAPPER + parseJSON:true returns the object as result.data[0]
    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as RoadTax };
  }

  async createRoadTax(values: RoadTaxFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_ROAD_TAX;
    const inputs = [
      {
        'CarId': values.CarId,
        'StartDate': values.StartDate,
        'EndDate': values.EndDate,
        'Note': values.Note || null,
        'Login': values.CreatedBy || 'system',
        'Action': 'Add',
        'RoadTaxId': 0,
        'IsActive': true
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async updateRoadTax(roadTaxId: number, values: RoadTaxFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_ROAD_TAX;
    const inputs = [
      {
        'CarId': values.CarId,
        'StartDate': values.StartDate,
        'EndDate': values.EndDate,
        'Note': values.Note || null,
        'Login': values.CreatedBy || 'system',
        'Action': 'Update',
        'RoadTaxId': roadTaxId,
        'IsActive': values.IsActive
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async deleteRoadTax(roadTaxId: number, createdBy: string): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.DELETE_ROAD_TAX;
    const inputs = [{ 'RoadTaxId': roadTaxId, 'Login': createdBy }];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
