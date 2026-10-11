import { RecordLogs } from './base';

export interface PsvlCar {
  CarId: number;
  CarNumber?: string | null;
  Model?: string | null;
}

// PSVL = Public Service Vehicle Licence. A car has many over time (renewals)
// but only one active at once - see database/add_car_psvl.sql.
export interface Psvl extends RecordLogs {
  PsvlId: number;
  CarId: number;
  Car?: PsvlCar;
  StartDate: string;
  EndDate: string;
  Company?: string | null;
  Note?: string | null;
  IsActive?: boolean | null;
}

export type Psvls = Psvl[];

export interface PsvlFormValues {
  PsvlId?: number;
  CarId: number;
  StartDate: Date | null;
  EndDate: Date | null;
  Company?: string;
  Note?: string;
  CreatedBy?: string;
}
