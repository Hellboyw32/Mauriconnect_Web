import { DELIVERY_USER_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { DeliveryUsers } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IDeliveryUserService {
  getDeliveryUsers(): Promise<Response<DeliveryUsers>>;
}

@Service()
export class DeliveryUserService implements IDeliveryUserService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getDeliveryUsers(): Promise<Response<DeliveryUsers>> {
    const storedProcedure = STORED_PROCEDURES.GET_DELIVERY_USERS;
    return await this.mssqlService.requestByStoredProcedure(storedProcedure);
  }
}
