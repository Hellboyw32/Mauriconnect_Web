import { CAR_CATEGORY_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { CarCategories } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface ICarCategoryService {
  getCarCategories(): Promise<Response<CarCategories>>;
}

@Service()
export class CarCategoryService implements ICarCategoryService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getCarCategories(): Promise<Response<CarCategories>> {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_CATEGORIES;
    return await this.mssqlService.requestByStoredProcedure(storedProcedure);
  }
}
