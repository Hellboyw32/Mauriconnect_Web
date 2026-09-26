import { AUDIT_LOG_STORED_PROCEDURES, USER_STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type { AuditLogs, UserLoginLogs } from '@libs/types';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

export interface IAuditLogService {
  log(params: {
    userId: number;
    username: string;
    action: string;
    entityType: string;
    entityId?: string | number;
    description?: string;
    ipAddress?: string;
  }): Promise<void>;
  getAuditLogs(filters: {
    username?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Response<AuditLogs>>;
  getUserLoginLogs(filters: {
    username?: string;
    fromDate?: string;
    toDate?: string;
    loginSuccessful?: boolean;
  }): Promise<Response<UserLoginLogs>>;
}

@Service()
export class AuditLogService implements IAuditLogService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  async log(params: {
    userId: number;
    username: string;
    action: string;
    entityType: string;
    entityId?: string | number;
    description?: string;
    ipAddress?: string;
  }): Promise<void> {
    const inputs = [
      {
        'UserId': params.userId,
        'Username': params.username,
        'Action': params.action,
        'EntityType': params.entityType,
        'EntityId': params.entityId != null ? String(params.entityId) : null,
        'Description': params.description || null,
        'IPAddress': params.ipAddress || null
      }
    ];

    await this.mssqlService.requestByStoredProcedure(
      AUDIT_LOG_STORED_PROCEDURES.INSERT_AUDIT_LOG,
      inputs
    );
  }

  async getAuditLogs(filters: {
    username?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Response<AuditLogs>> {
    const storedProcedure = AUDIT_LOG_STORED_PROCEDURES.GET_AUDIT_LOGS_JSON;
    const inputs = [
      {
        'Username': filters.username || null,
        'Action': filters.action || null,
        'FromDate': filters.fromDate || null,
        'ToDate': filters.toDate || null
      }
    ];

    const result = await this.mssqlService.requestByStoredProcedure<AuditLogs>(
      storedProcedure,
      inputs,
      false
    );

    const unwrapped = Array.isArray(result.data) && Array.isArray(result.data[0])
      ? result.data[0]
      : result.data;
    const items = Array.isArray(unwrapped) ? unwrapped.filter((item) => item != null) : [];

    return { ...result, data: items as AuditLogs };
  }

  async getUserLoginLogs(filters: {
    username?: string;
    fromDate?: string;
    toDate?: string;
    loginSuccessful?: boolean;
  }): Promise<Response<UserLoginLogs>> {
    const storedProcedure = USER_STORED_PROCEDURES.GET_USER_LOGIN_LOGS_JSON;
    const inputs = [
      {
        'Username': filters.username || null,
        'FromDate': filters.fromDate || null,
        'ToDate': filters.toDate || null,
        'LoginSuccessful': filters.loginSuccessful ?? null
      }
    ];

    const result = await this.mssqlService.requestByStoredProcedure<UserLoginLogs>(
      storedProcedure,
      inputs,
      false
    );

    const unwrapped = Array.isArray(result.data) && Array.isArray(result.data[0])
      ? result.data[0]
      : result.data;
    const items = Array.isArray(unwrapped) ? unwrapped.filter((item) => item != null) : [];

    return { ...result, data: items as UserLoginLogs };
  }
}
