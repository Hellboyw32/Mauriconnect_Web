import { SCHEDULER_STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { SchedulerData } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface ISchedulerService {
  getSchedulerData(): Promise<Response<SchedulerData>>;
}

// FOR JSON PATH + parseJSON:true hands the whole array back as result.data[0].
const unwrap = <T>(data: unknown): T[] => {
  const rows = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
  return Array.isArray(rows) ? rows.filter((row) => row != null) : [];
};

@Service()
export class SchedulerService implements ISchedulerService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async getSchedulerData(): Promise<Response<SchedulerData>> {
    const [categories, cars, bookings] = await Promise.all([
      this.mssqlService.requestByStoredProcedure(SCHEDULER_STORED_PROCEDURES.GET_CATEGORIES_JSON, [], false),
      this.mssqlService.requestByStoredProcedure(SCHEDULER_STORED_PROCEDURES.GET_CARS_JSON, [], false),
      this.mssqlService.requestByStoredProcedure(SCHEDULER_STORED_PROCEDURES.GET_BOOKINGS_JSON, [], false)
    ]);

    const failed = [categories, cars, bookings].find((result) => !result.success);
    if (failed) {
      return { status: failed.status, message: failed.message, error: failed.error, success: false };
    }

    return {
      status: 200,
      message: 'Operation completed successfully.',
      success: true,
      data: {
        categories: unwrap(categories.data),
        cars: unwrap(cars.data),
        bookings: unwrap(bookings.data)
      } as SchedulerData
    };
  }
}
