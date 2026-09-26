import { RecordLogs } from './base';

export interface FitnessCertificateCar {
  CarId: number;
  CarNumber?: string | null;
  Model?: string | null;
}

export interface FitnessCertificate extends RecordLogs {
  FitnessId: number;
  CarId: number;
  Car?: FitnessCertificateCar;
  StartDate?: string | null;
  EndDate?: string | null;
  Note?: string | null;
  CertificateNumber?: string | null;
  IssuedBy?: string | null;
  IsActive?: boolean | null;
}

export type FitnessCertificates = FitnessCertificate[];

export interface FitnessCertificateFormValues {
  FitnessId?: number;
  CarId: number | '';
  StartDate: Date | null;
  EndDate: Date | null;
  Note?: string;
  CertificateNumber?: string;
  IssuedBy?: string;
  IsActive: boolean;
  CreatedBy?: string;
}

export interface FitnessCertificateFilters {
  carNumber?: string;
}

export interface FitnessCertificatesSearchState {
  filters: FitnessCertificateFilters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface FitnessRenewalReportItem {
  CarNumber: string;
  Model: string;
  StartDate: string;
  EndDate: string;
}
