import { RecordLogs } from './base';

export interface CarInsuranceCar {
  CarId: number;
  CarNumber?: string | null;
  Model?: string | null;
}

export interface CarInsurance extends RecordLogs {
  CarInsuranceId: number;
  CarId: number;
  Car?: CarInsuranceCar;
  StartDate?: string | null;
  EndDate?: string | null;
  Note?: string | null;
  PolicyNumber?: string | null;
  Insurer?: string | null;
  CoverageType?: string | null;
  Premium?: number | null;
  IsActive?: boolean | null;
}

export type CarInsurances = CarInsurance[];

export interface CarInsuranceFormValues {
  CarInsuranceId?: number;
  CarId: number | '';
  StartDate: Date | null;
  EndDate: Date | null;
  Note?: string;
  PolicyNumber?: string;
  Insurer?: string;
  CoverageType?: string;
  Premium?: number | '';
  IsActive: boolean;
  CreatedBy?: string;
}

export interface CarInsuranceFilters {
  carNumber?: string;
}

export interface CarInsurancesSearchState {
  filters: CarInsuranceFilters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface CarInsuranceRenewalReportItem {
  CarNumber: string;
  Model: string;
  StartDate: string;
  EndDate: string;
}
