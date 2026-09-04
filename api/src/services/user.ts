import { USER_STORED_PROCEDURES } from '@/constants';
import type { Response } from '@/types';
import type {
  LoginAnalytics,
  ManagedUser,
  ManagedUsers,
  ModulePermission,
  RawModulePermission,
  RawReportTypePermission,
  ReportTypePermission,
  UserAnalytics,
  UserFormValues
} from '@libs/types';
import bcrypt from 'bcryptjs';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';
import { AuditLogService } from './audit-log';

const BCRYPT_SALT_ROUNDS = 12;

export interface IUserService {
  getUsers(filters: {
    username?: string;
    userType?: string;
    status?: string;
  }): Promise<Response<ManagedUsers>>;
  getUser(userId: number): Promise<Response<ManagedUser>>;
  createUser(
    values: UserFormValues,
    actingUser: { userId: number; username: string }
  ): Promise<Response>;
  updateUser(
    userId: number,
    values: UserFormValues,
    actingUser: { userId: number; username: string }
  ): Promise<Response>;
  lockUser(userId: number, actingUser: { userId: number; username: string }): Promise<Response>;
  unlockUser(userId: number, actingUser: { userId: number; username: string }): Promise<Response>;
  changePassword(
    userId: number,
    newPassword: string,
    actingUser: { userId: number; username: string }
  ): Promise<Response>;
  getUserAnalytics(): Promise<Response<UserAnalytics>>;
  getLoginAnalytics(): Promise<Response<LoginAnalytics>>;
  getUserPermissions(userId: number): Promise<Response<ModulePermission[]>>;
  savePermissions(
    userId: number,
    permissions: ModulePermission[],
    actingUser: { userId: number; username: string }
  ): Promise<Response>;
  getUserReportPermissions(userId: number): Promise<Response<ReportTypePermission[]>>;
  saveReportTypePermissions(
    userId: number,
    reportTypes: ReportTypePermission[],
    actingUser: { userId: number; username: string }
  ): Promise<Response>;
}

@Service()
export class UserService implements IUserService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  @Inject()
  private readonly auditLogService: AuditLogService;

  async getUsers(filters: {
    username?: string;
    userType?: string;
    status?: string;
  }): Promise<Response<ManagedUsers>> {
    const inputs = [
      {
        'Username': filters.username || null,
        'UserType': filters.userType || null,
        'Status': filters.status || null
      }
    ];

    // isJsonPath: false - see the comment in auth.ts's login() for why (the
    // connection pool's parseJSON: true already parses FOR JSON PATH output).
    const result = await this.mssqlService.requestByStoredProcedure<ManagedUsers>(
      USER_STORED_PROCEDURES.GET_USERS_JSON,
      inputs,
      false
    );

    const unwrapped = Array.isArray(result.data) && Array.isArray(result.data[0])
      ? result.data[0]
      : result.data;
    const items = Array.isArray(unwrapped) ? unwrapped.filter((item) => item != null) : [];

    return { ...result, data: items as ManagedUsers };
  }

  async getUser(userId: number): Promise<Response<ManagedUser>> {
    const inputs = [{ 'UserId': userId }];

    const result = await this.mssqlService.requestByStoredProcedure<ManagedUser>(
      USER_STORED_PROCEDURES.GET_USER_JSON,
      inputs,
      false
    );

    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as unknown as ManagedUser };
  }

  private async usernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    const inputs = [{ 'Username': username, 'ExcludeUserId': excludeUserId ?? null }];

    const result = await this.mssqlService.requestByStoredProcedure<{ UsernameExists: boolean }>(
      USER_STORED_PROCEDURES.CHECK_USERNAME_EXISTS,
      inputs,
      false
    );

    const data = (
      Array.isArray(result.data) ? result.data[0] : result.data
    ) as unknown as { UsernameExists: boolean } | null;
    return !!data?.UsernameExists;
  }

  async createUser(
    values: UserFormValues,
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    if (await this.usernameExists(values.Username)) {
      return { status: 400, message: 'That username is already taken.', success: false };
    }

    if (!values.Password) {
      return { status: 400, message: 'Password is required.', success: false };
    }

    const passwordHash = await bcrypt.hash(values.Password, BCRYPT_SALT_ROUNDS);

    const inputs = [
      {
        'Username': values.Username,
        'EmailAccount': values.EmailAccount,
        'UserType': values.UserType,
        'IsActive': values.IsActive,
        'IsAccountLocked': values.IsAccountLocked,
        'Login': String(actingUser.userId),
        'Action': 'Add',
        'UserId': null,
        'PasswordHash': passwordHash
      }
    ];

    const result = await this.mssqlService.requestByStoredProcedure<{ UserId: number }>(
      USER_STORED_PROCEDURES.UPDATE_USER,
      inputs
    );

    const newUserId = (result.data as unknown as { UserId: number }[])?.[0]?.UserId;

    if (newUserId && values.Permissions?.length) {
      await this.savePermissions(newUserId, values.Permissions, actingUser);
    }

    if (newUserId && values.ReportTypes?.length) {
      await this.saveReportTypePermissions(newUserId, values.ReportTypes, actingUser);
    }

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'User Created',
      entityType: 'User',
      entityId: values.Username,
      description: `Created user "${values.Username}" (${values.UserType})`
    });

    return result;
  }

  async updateUser(
    userId: number,
    values: UserFormValues,
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    // Prevent an admin from locking or demoting their own account - both
    // would otherwise let an admin accidentally lock themselves out with no
    // other admin able to help, since only admins can reach this route.
    if (userId === actingUser.userId) {
      if (values.IsAccountLocked) {
        return { status: 400, message: 'You cannot lock your own account.', success: false };
      }
      if (values.UserType !== 'Admin') {
        return { status: 400, message: 'You cannot change your own user type.', success: false };
      }
    }

    if (await this.usernameExists(values.Username, userId)) {
      return { status: 400, message: 'That username is already taken.', success: false };
    }

    const inputs = [
      {
        'Username': values.Username,
        'EmailAccount': values.EmailAccount,
        'UserType': values.UserType,
        'IsActive': values.IsActive,
        'IsAccountLocked': values.IsAccountLocked,
        'Login': String(actingUser.userId),
        'Action': 'Update',
        'UserId': userId,
        'PasswordHash': null
      }
    ];

    const result = await this.mssqlService.requestByStoredProcedure(
      USER_STORED_PROCEDURES.UPDATE_USER,
      inputs
    );

    if (values.Permissions?.length) {
      await this.savePermissions(userId, values.Permissions, actingUser);
    }

    if (values.ReportTypes?.length) {
      await this.saveReportTypePermissions(userId, values.ReportTypes, actingUser);
    }

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'User Modified',
      entityType: 'User',
      entityId: userId,
      description: `Updated user "${values.Username}"`
    });

    return result;
  }

  async lockUser(
    userId: number,
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    if (userId === actingUser.userId) {
      return { status: 400, message: 'You cannot lock your own account.', success: false };
    }

    const result = await this.mssqlService.requestByStoredProcedure(
      USER_STORED_PROCEDURES.LOCK_UNLOCK_USER,
      [{ 'UserId': userId, 'IsAccountLocked': true, 'Login': String(actingUser.userId) }]
    );

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'User Locked',
      entityType: 'User',
      entityId: userId,
      description: `Locked user account #${userId}`
    });

    return result;
  }

  async unlockUser(
    userId: number,
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    const result = await this.mssqlService.requestByStoredProcedure(
      USER_STORED_PROCEDURES.LOCK_UNLOCK_USER,
      [{ 'UserId': userId, 'IsAccountLocked': false, 'Login': String(actingUser.userId) }]
    );

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'User Unlocked',
      entityType: 'User',
      entityId: userId,
      description: `Unlocked user account #${userId}`
    });

    return result;
  }

  async changePassword(
    userId: number,
    newPassword: string,
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    const result = await this.mssqlService.requestByStoredProcedure(
      USER_STORED_PROCEDURES.CHANGE_USER_PASSWORD,
      [{ 'UserId': userId, 'PasswordHash': passwordHash, 'Login': String(actingUser.userId) }]
    );

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'Password Changed',
      entityType: 'User',
      entityId: userId,
      description: `Password reset for user account #${userId}`
    });

    return result;
  }

  async getUserAnalytics(): Promise<Response<UserAnalytics>> {
    const result = await this.mssqlService.requestByStoredProcedure<UserAnalytics>(
      USER_STORED_PROCEDURES.GET_USER_ANALYTICS,
      [],
      false
    );

    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as unknown as UserAnalytics };
  }

  async getLoginAnalytics(): Promise<Response<LoginAnalytics>> {
    const result = await this.mssqlService.requestByStoredProcedure<LoginAnalytics>(
      USER_STORED_PROCEDURES.GET_LOGIN_ANALYTICS,
      [],
      false
    );

    const item = Array.isArray(result.data) ? result.data[0] : result.data;

    return { ...result, data: item as unknown as LoginAnalytics };
  }

  async getUserPermissions(userId: number): Promise<Response<ModulePermission[]>> {
    const result = await this.mssqlService.requestByStoredProcedure<RawModulePermission[]>(
      USER_STORED_PROCEDURES.GET_USER_PERMISSIONS_JSON,
      [{ 'UserId': userId }],
      false
    );

    const unwrapped = Array.isArray(result.data) && Array.isArray(result.data[0])
      ? result.data[0]
      : result.data;
    const rows = Array.isArray(unwrapped) ? unwrapped.filter((item) => item != null) : [];

    const permissions: ModulePermission[] = rows.map((row: RawModulePermission) => ({
      module: row.Module as ModulePermission['module'],
      canView: row.CanView,
      canCreate: row.CanCreate,
      canEdit: row.CanEdit,
      canDelete: row.CanDelete,
      maxDaysBeforeToday: row.MaxDaysBeforeToday ?? null,
      maxDaysAfterToday: row.MaxDaysAfterToday ?? null
    }));

    return { ...result, data: permissions };
  }

  async savePermissions(
    userId: number,
    permissions: ModulePermission[],
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    for (const permission of permissions) {
      await this.mssqlService.requestByStoredProcedure(
        USER_STORED_PROCEDURES.UPSERT_USER_PERMISSION,
        [
          {
            'UserId': userId,
            'Module': permission.module,
            'CanView': permission.canView,
            'CanCreate': permission.canCreate,
            'CanEdit': permission.canEdit,
            'CanDelete': permission.canDelete,
            'MaxDaysBeforeToday': permission.maxDaysBeforeToday ?? null,
            'MaxDaysAfterToday': permission.maxDaysAfterToday ?? null
          }
        ]
      );
    }

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'Permissions Updated',
      entityType: 'User',
      entityId: userId,
      description: `Updated module permissions for user account #${userId}`
    });

    return { status: 200, message: 'Permissions updated.', success: true };
  }

  async getUserReportPermissions(userId: number): Promise<Response<ReportTypePermission[]>> {
    const result = await this.mssqlService.requestByStoredProcedure<RawReportTypePermission[]>(
      USER_STORED_PROCEDURES.GET_USER_REPORT_PERMISSIONS_JSON,
      [{ 'UserId': userId }],
      false
    );

    const unwrapped = Array.isArray(result.data) && Array.isArray(result.data[0])
      ? result.data[0]
      : result.data;
    const rows = Array.isArray(unwrapped) ? unwrapped.filter((item) => item != null) : [];

    const reportTypes: ReportTypePermission[] = rows.map((row: RawReportTypePermission) => ({
      reportType: row.ReportType as ReportTypePermission['reportType'],
      isAllowed: row.IsAllowed
    }));

    return { ...result, data: reportTypes };
  }

  async saveReportTypePermissions(
    userId: number,
    reportTypes: ReportTypePermission[],
    actingUser: { userId: number; username: string }
  ): Promise<Response> {
    for (const reportType of reportTypes) {
      await this.mssqlService.requestByStoredProcedure(
        USER_STORED_PROCEDURES.UPSERT_USER_REPORT_PERMISSION,
        [
          {
            'UserId': userId,
            'ReportType': reportType.reportType,
            'IsAllowed': reportType.isAllowed
          }
        ]
      );
    }

    await this.auditLogService.log({
      userId: actingUser.userId,
      username: actingUser.username,
      action: 'Report Permissions Updated',
      entityType: 'User',
      entityId: userId,
      description: `Updated report permissions for user account #${userId}`
    });

    return { status: 200, message: 'Report permissions updated.', success: true };
  }
}
