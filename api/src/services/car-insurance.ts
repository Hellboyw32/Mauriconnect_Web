import { CAR_INSURANCE_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { CarInsurance, CarInsurances, CarInsuranceFormValues } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface ICarInsuranceService {
  getCarInsurances(carNumber?: string): Promise<Response<CarInsurances>>;
  getCarInsurance(carInsuranceId: number): Promise<Response<CarInsurance>>;
  createCarInsurance(values: CarInsuranceFormValues): Promise<Response>;
  updateCarInsurance(carInsuranceId: number, values: CarInsuranceFormValues): Promise<Response>;
  deleteCarInsurance(carInsuranceId: number, createdBy: string): Promise<Response>;
}

@Service()
export class CarInsuranceService implements ICarInsuranceService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getCarInsurances(carNumber?: string): Promise<Response<CarInsurances>> {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_INSURANCES_JSON;
    const inputs = [{ 'CarNumber': carNumber || null }];

    const result = await this.mssqlService.requestByStoredProcedure<CarInsurances>(
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

    return { ...result, data: items as CarInsurances };
  }

  async getCarInsurance(carInsuranceId: number): Promise<Response<CarInsurance>> {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_INSURANCE_JSON;
    const inputs = [{ 'CarInsuranceId': carInsuranceId }];

    const result = await this.mssqlService.requestByStoredProcedure<CarInsurance>(
      storedProcedure,
      inputs,
      false
    );

    // FOR JSON PATH, WITHOUT_ARRAY_WRAPPER + parseJSON:true returns the object as result.data[0]
    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as CarInsurance };
  }

  async createCarInsurance(values: CarInsuranceFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_CAR_INSURANCE;
    const inputs = [
      {
        'CarId': values.CarId,
        'StartDate': values.StartDate,
        'EndDate': values.EndDate,
        'Note': values.Note || null,
        'PolicyNumber': values.PolicyNumber || null,
        'Insurer': values.Insurer || null,
        'CoverageType': values.CoverageType || null,
        'Premium': values.Premium || null,
        'Login': values.CreatedBy || 'system',
        'Action': 'Add',
        'CarInsuranceId': 0,
        'IsActive': true
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async updateCarInsurance(
    carInsuranceId: number,
    values: CarInsuranceFormValues
  ): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_CAR_INSURANCE;
    const inputs = [
      {
        'CarId': values.CarId,
        'StartDate': values.StartDate,
        'EndDate': values.EndDate,
        'Note': values.Note || null,
        'PolicyNumber': values.PolicyNumber || null,
        'Insurer': values.Insurer || null,
        'CoverageType': values.CoverageType || null,
        'Premium': values.Premium || null,
        'Login': values.CreatedBy || 'system',
        'Action': 'Update',
        'CarInsuranceId': carInsuranceId,
        'IsActive': values.IsActive
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async deleteCarInsurance(carInsuranceId: number, createdBy: string): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.DELETE_CAR_INSURANCE;
    const inputs = [{ 'CarInsuranceId': carInsuranceId, 'Login': createdBy }];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
