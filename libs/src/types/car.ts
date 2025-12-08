import { RecordLogs } from './base';
import { CarCategory } from './car-category';

export interface Car extends RecordLogs {
  CarId: number;
  CarCategory: CarCategory;
  Model?: string | null;
  CarNumber?: string | null;
  Description?: string | null;
  IsActive?: boolean | null;
  SortOrder?: number | null;
  CurrentMileage?: number | null;
  ServicingFrequency?: number | null;
  LastServicedMileage?: number | null;
}

export type Cars = Car[];
