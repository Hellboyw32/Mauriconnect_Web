export interface RecordLogs {
  LastModifiedTimeStamp?: Date;
  LastModifiedUserId?: string;
}

export interface FieldOption {
  label: string;
  value: string | number;
}

export type FieldOptions = FieldOption[];
