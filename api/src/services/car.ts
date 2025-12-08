import { CAR_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { Cars } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface ICarService {
  getCars(): Promise<Response<Cars>>;
}

@Service()
export class CarService implements ICarService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getCars(): Promise<Response<Cars>> {
    const storedProcedure = STORED_PROCEDURES.GET_CARS;
    return await this.mssqlService.requestByStoredProcedure(storedProcedure);
  }
}
