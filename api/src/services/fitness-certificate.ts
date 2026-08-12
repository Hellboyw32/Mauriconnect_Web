import { FITNESS_CERTIFICATE_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { FitnessCertificate, FitnessCertificates, FitnessCertificateFormValues } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IFitnessCertificateService {
  getFitnessCertificates(carNumber?: string): Promise<Response<FitnessCertificates>>;
  getFitnessCertificate(fitnessId: number): Promise<Response<FitnessCertificate>>;
  createFitnessCertificate(values: FitnessCertificateFormValues): Promise<Response>;
  updateFitnessCertificate(
    fitnessId: number,
    values: FitnessCertificateFormValues
  ): Promise<Response>;
  deleteFitnessCertificate(fitnessId: number, createdBy: string): Promise<Response>;
}

@Service()
export class FitnessCertificateService implements IFitnessCertificateService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getFitnessCertificates(carNumber?: string): Promise<Response<FitnessCertificates>> {
    const storedProcedure = STORED_PROCEDURES.GET_FITNESS_CERTIFICATES_JSON;
    const inputs = [{ 'CarNumber': carNumber || null }];

    const result = await this.mssqlService.requestByStoredProcedure<FitnessCertificates>(
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

    return { ...result, data: items as FitnessCertificates };
  }

  async getFitnessCertificate(fitnessId: number): Promise<Response<FitnessCertificate>> {
    const storedProcedure = STORED_PROCEDURES.GET_FITNESS_CERTIFICATE_JSON;
    const inputs = [{ 'FitnessId': fitnessId }];

    const result = await this.mssqlService.requestByStoredProcedure<FitnessCertificate>(
      storedProcedure,
      inputs,
      false
    );

    // FOR JSON PATH, WITHOUT_ARRAY_WRAPPER + parseJSON:true returns the object as result.data[0]
    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as FitnessCertificate };
  }

  async createFitnessCertificate(values: FitnessCertificateFormValues): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_FITNESS_CERTIFICATE;
    const inputs = [
      {
        'CarId': values.CarId,
        'StartDate': values.StartDate,
        'EndDate': values.EndDate,
        'Note': values.Note || null,
        'CertificateNumber': values.CertificateNumber || null,
        'IssuedBy': values.IssuedBy || null,
        'Login': values.CreatedBy || 'system',
        'Action': 'Add',
        'FitnessId': 0,
        'IsActive': true
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async updateFitnessCertificate(
    fitnessId: number,
    values: FitnessCertificateFormValues
  ): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.UPDATE_FITNESS_CERTIFICATE;
    const inputs = [
      {
        'CarId': values.CarId,
        'StartDate': values.StartDate,
        'EndDate': values.EndDate,
        'Note': values.Note || null,
        'CertificateNumber': values.CertificateNumber || null,
        'IssuedBy': values.IssuedBy || null,
        'Login': values.CreatedBy || 'system',
        'Action': 'Update',
        'FitnessId': fitnessId,
        'IsActive': values.IsActive
      }
    ];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async deleteFitnessCertificate(fitnessId: number, createdBy: string): Promise<Response> {
    const storedProcedure = STORED_PROCEDURES.DELETE_FITNESS_CERTIFICATE;
    const inputs = [{ 'FitnessId': fitnessId, 'Login': createdBy }];

    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
