export interface Response<T = any> {
  // Every service returns a plain parsed object/array here (JSON.parse'd
  // FOR JSON PATH output, or a raw recordset treated as an array) - never an
  // actual mssql IRecordSet instance - so T is the accurate type, not
  // IRecordSet<T>. The previous IRecordSet<T> typing didn't match runtime
  // reality anywhere it was used.
  data?: T | undefined;
  error?: any | undefined;
  message?: string;
  status: number;
  success: boolean;
}
