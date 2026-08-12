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

  async getPickupScheduleByDate(pickupDate?: string) {
    const storedProcedure = STORED_PROCEDURES.GET_PICKUP_SCHEDULE_BY_DATE;
    // If no date provided, use today's date
    const dateToUse = pickupDate || new Date().toISOString().split('T')[0];
    const inputs = [{ 'pickupdate': dateToUse }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async getDropoffScheduleByDate(dropoffDate?: string) {
    const storedProcedure = STORED_PROCEDURES.GET_DROPOFF_SCHEDULE_BY_DATE;
    // If no date provided, use today's date
    const dateToUse = dropoffDate || new Date().toISOString().split('T')[0];
    const inputs = [{ 'dropoffdate': dateToUse }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async getRoadTaxRenewalsByMonth(year: number, month: number) {
    const storedProcedure = STORED_PROCEDURES.GET_ROAD_TAX_RENEWALS_BY_MONTH;
    const inputs = [{ 'Year': year, 'Month': month }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async getCarFitnessRenewalsByMonth(year: number, month: number) {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_FITNESS_RENEWALS_BY_MONTH;
    const inputs = [{ 'Year': year, 'Month': month }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async getCarInsuranceRenewalsByMonth(year: number, month: number) {
    const storedProcedure = STORED_PROCEDURES.GET_CAR_INSURANCE_RENEWALS_BY_MONTH;
    const inputs = [{ 'Year': year, 'Month': month }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
