import { REPORT_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import { Inject, Service } from 'typedi';
import type { Response } from '@/types';
import { BaseMSSqlService } from '../base/base-mssql';
import type { Booking } from '@libs/types';

export interface IBookingService {
  getDailySchedule(): Promise<Response<Booking>>;
}

@Service()
export class ReportService {
  @Inject()
  mssqlService: BaseMSSqlService;

  async getPickupScheduleByDate() {
    const storedProcedure = STORED_PROCEDURES.GET_PICKUP_SCHEDULE_BY_DATE;
    // The API endpoint is currently failing.
    // TODO: Need to handle the parameter date to the stored procedure.
    return await this.mssqlService.requestByStoredProcedure(storedProcedure);
  }
}
