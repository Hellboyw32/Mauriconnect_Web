import type { IRecordSet } from 'mssql';

export interface Response<T = any> {
  data?: IRecordSet<T> | undefined;
  error?: any | undefined;
  message?: string;
  status: number;
  success: boolean;
}
