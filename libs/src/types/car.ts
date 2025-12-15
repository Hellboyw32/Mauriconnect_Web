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

export interface CarFormValues {
  CarId?: number;
  Model: string;
  CategoryId: number;
  CarNumber: string;
  Description: string;
  CurrentMileage: number;
  ServicingFrequency: number;
  LastServicedMileage: number;
  IsActive: boolean;
  CreatedBy?: string;
}

export interface CarsSearchState {
  filters: CarFilters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface CarFilters {
  carNumber?: string;
  categoryId?: number;
}

export interface TopRentedCar {
  CarId: number;
  CarNumber: string;
  Model: string;
  CurrentMileage: number;
  RentalCount: number;
}

export type TopRentedCars = TopRentedCar[];
