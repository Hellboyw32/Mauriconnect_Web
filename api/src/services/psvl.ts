import { PSVL_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { Psvl, Psvls, PsvlFormValues } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IPsvlService {
  getPsvls(carId?: number): Promise<Response<Psvls>>;
  getPsvl(psvlId: number): Promise<Response<Psvl>>;
  createPsvl(values: PsvlFormValues): Promise<Response>;
  updatePsvl(psvlId: number, values: PsvlFormValues): Promise<Response>;
  deletePsvl(psvlId: number, createdBy: string): Promise<Response>;
}

// BaseMSSqlService wraps any DB failure as "Operation failed with error message
// RequestError: ...". For PSVL the interesting failures are the business rules
// raised by spUpdateCarPSVLDetails (overlap / end-before-start), so surface the
// raw SQL message instead and mark the status as a client error.
const toRuleViolation = (result: Response): Response => {
  const sqlMessage = (result.error as { message?: string } | undefined)?.message;

  return result.success || !sqlMessage ? result : { ...result, status: 400, message: sqlMessage };
};

@Service()
export class PsvlService implements IPsvlService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getPsvls(carId?: number): Promise<Response<Psvls>> {
    const result = await this.mssqlService.requestByStoredProcedure<Psvls>(
      STORED_PROCEDURES.GET_PSVLS_JSON,
      [{ 'CarId': carId ?? null }],
      false
    );

    let items: any[] = [];

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      items = Array.isArray(result.data[0]) ? result.data[0] : result.data;
    }

    // Defensive: FOR JSON PATH parsing can surface a null entry for an empty result
    items = items.filter((item) => item != null);

    return { ...result, data: items as Psvls };
  }

  async getPsvl(psvlId: number): Promise<Response<Psvl>> {
    const result = await this.mssqlService.requestByStoredProcedure<Psvl>(
      STORED_PROCEDURES.GET_PSVL_JSON,
      [{ 'PsvlId': psvlId }],
      false
    );

    // FOR JSON PATH, WITHOUT_ARRAY_WRAPPER + parseJSON:true returns the object as result.data[0]
    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as Psvl };
  }

  async createPsvl(values: PsvlFormValues): Promise<Response> {
    return toRuleViolation(
      await this.mssqlService.requestByStoredProcedure(STORED_PROCEDURES.UPDATE_PSVL, [
        {
          'CarId': values.CarId,
          'StartDate': values.StartDate,
          'EndDate': values.EndDate,
          'Company': values.Company || null,
          'Note': values.Note || null,
          'Login': values.CreatedBy || 'system',
          'Action': 'Add',
          'PsvlId': 0
        }
      ])
    );
  }

  async updatePsvl(psvlId: number, values: PsvlFormValues): Promise<Response> {
    return toRuleViolation(
      await this.mssqlService.requestByStoredProcedure(STORED_PROCEDURES.UPDATE_PSVL, [
        {
          'CarId': values.CarId,
          'StartDate': values.StartDate,
          'EndDate': values.EndDate,
          'Company': values.Company || null,
          'Note': values.Note || null,
          'Login': values.CreatedBy || 'system',
          'Action': 'Update',
          'PsvlId': psvlId
        }
      ])
    );
  }

  async deletePsvl(psvlId: number, createdBy: string): Promise<Response> {
    return await this.mssqlService.requestByStoredProcedure(STORED_PROCEDURES.DELETE_PSVL, [
      { 'PsvlId': psvlId, 'Login': createdBy }
    ]);
  }
}
