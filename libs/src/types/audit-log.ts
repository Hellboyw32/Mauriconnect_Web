export interface AuditLog {
  Id: number;
  UserId?: number | null;
  Username?: string | null;
  Action: string;
  EntityType: string;
  EntityId?: string | null;
  Description?: string | null;
  Timestamp: string;
  IPAddress?: string | null;
}

export type AuditLogs = AuditLog[];

export interface AuditLogFilters {
  username?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
}
