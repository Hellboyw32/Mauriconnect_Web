import { RecordLogs } from './base';

export interface RoadTaxCar {
  CarId: number;
  CarNumber?: string | null;
  Model?: string | null;
}

export interface RoadTax extends RecordLogs {
  RoadTaxId: number;
  CarId: number;
  Car?: RoadTaxCar;
  StartDate?: string | null;
  EndDate?: string | null;
  Note?: string | null;
  IsActive?: boolean | null;
}

export type RoadTaxes = RoadTax[];

export interface RoadTaxFormValues {
  RoadTaxId?: number;
  CarId: number | '';
  StartDate: Date | null;
  EndDate: Date | null;
  Note?: string;
  IsActive: boolean;
  CreatedBy?: string;
}

export interface RoadTaxFilters {
  carNumber?: string;
}

export interface RoadTaxesSearchState {
  filters: RoadTaxFilters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}
