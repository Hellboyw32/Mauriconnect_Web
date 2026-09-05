import { RecordLogs } from './base';

export interface ServicingCar {
  CarId: number;
  CarNumber?: string | null;
  Model?: string | null;
}

export interface Servicing extends RecordLogs {
  ServicingId: number;
  CarId: number;
  Car?: ServicingCar;
  DateServiced?: string | null;
  MileageServiced?: number | null;
  ServicingFrequency?: number | null;
  NextServicingMileage?: number | null;
  Note?: string | null;
  CreatedBy?: string | null;
  CreatedOn?: string | null;
  IsCompleted?: boolean | null;
}

export type ServicingRecords = Servicing[];

export interface ServicingFormValues {
  CarId: number | '';
  DateServiced: Date | null;
  MileageServiced: number | '';
  ServicingFrequency: number | '';
  Note?: string;
  CreatedBy?: string;
  IsCompleted?: boolean;
}

export interface ServicingFilters {
  carNumber?: string;
}

export interface ServicingSearchState {
  filters: ServicingFilters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}
