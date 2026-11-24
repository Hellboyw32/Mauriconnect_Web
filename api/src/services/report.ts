import { REPORT_STORED_PROCEDURES as STORED_PROCEDURES } from '@/constants';
import ExcelJS from 'exceljs';
import { Inject, Service } from 'typedi';
import type { Response } from '@/types';
import { BaseMSSqlService } from '../base/base-mssql';
import type { Booking, SettlementReportRow } from '@libs/types';

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

  // Every active booking picked up on `pickupDate`, laid out like the paper
  // settlement sheet (see database/spGetSettlementReportByDate.sql).
  async getSettlementReport(pickupDate: string) {
    const storedProcedure = STORED_PROCEDURES.GET_SETTLEMENT_REPORT_BY_DATE;
    const inputs = [{ 'PickupDate': pickupDate }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  // The settlement report as an .xlsx - Client Name and Drop Off Date only,
  // matching the columns shown on screen.
  async buildSettlementWorkbook(data: unknown): Promise<Buffer> {
    const recordset = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
    const rows = Array.isArray(recordset) ? (recordset.filter((row) => row != null) as SettlementReportRow[]) : [];

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Settlement');
    sheet.columns = [
      { header: 'Client Name', key: 'client', width: 36 },
      { header: 'Drop Off Date', key: 'dropOff', width: 16 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    rows.forEach((row) => {
      // DropOffDate is a DATE column (midnight UTC), which Excel shows as that calendar day
      const added = sheet.addRow({
        client: row.ClientName,
        dropOff: row.DropOffDate ? new Date(row.DropOffDate) : null
      });
      added.getCell('dropOff').numFmt = 'dd/mm/yyyy';
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async getSimCardReport(startDate: string, endDate: string) {
    const storedProcedure = STORED_PROCEDURES.GET_SIM_CARD_REPORT;
    const inputs = [{ 'StartDate': startDate }, { 'EndDate': endDate }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }

  async getInsuranceReport(startDate: string, endDate: string) {
    const storedProcedure = STORED_PROCEDURES.GET_INSURANCE_REPORT;
    const inputs = [{ 'StartDate': startDate }, { 'EndDate': endDate }];
    return await this.mssqlService.requestByStoredProcedure(storedProcedure, inputs);
  }
}
