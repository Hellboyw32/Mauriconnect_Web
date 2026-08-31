import config from '@/config';
import { USER_STORED_PROCEDURES } from '@/constants';
import type { ManagedUser, User } from '@libs/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Inject, Service } from 'typedi';
import { BaseMSSqlService } from '../base/base-mssql';

interface UserForLogin {
  UserId: number;
  Username: string;
  PasswordHash: string;
  EmailAccount: string;
  UserType: 'Normal' | 'Admin';
  IsAccountLocked: boolean;
  IsActive: boolean;
  FailedLoginAttempts: number;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  accessToken?: string;
  loginLogId?: number;
  user?: User;
}

export interface IAuthService {
  login(username: string, password: string, ipAddress?: string, userAgent?: string): Promise<LoginResult>;
  logout(loginLogId: number): Promise<void>;
  getMe(userId: number): Promise<User | null>;
}

const mapToAuthUser = (record: ManagedUser | UserForLogin): User => ({
  userId: record.UserId,
  username: record.Username,
  emailAccount: record.EmailAccount,
  userType: record.UserType,
  isAccountLocked: record.IsAccountLocked,
  lastLoggedIn: 'LastLoggedIn' in record ? record.LastLoggedIn : undefined
});

@Service()
export class AuthService implements IAuthService {
  @Inject()
  private readonly mssqlService: BaseMSSqlService;

  private async recordFailure(
    username: string,
    userId: number | null,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.mssqlService.requestByStoredProcedure(USER_STORED_PROCEDURES.RECORD_LOGIN_FAILURE, [
      {
        'Username': username,
        'UserId': userId,
        'FailureReason': reason,
        'MaxFailedAttempts': config.auth.maxFailedLoginAttempts,
        'IPAddress': ipAddress || null,
        'UserAgent': userAgent || null
      }
    ]);
  }

  async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    // isJsonPath must be false: the connection pool is configured with
    // parseJSON: true (api/src/loaders/mssql.ts), which already parses FOR
    // JSON PATH output. Passing true here double-parses it - JSON.parse on an
    // already-parsed value collapses to just its first field, which silently
    // breaks every check below. Every other service in this codebase follows
    // the same false + manual unwrap pattern (see car-insurance.ts).
    const lookup = await this.mssqlService.requestByStoredProcedure<UserForLogin>(
      USER_STORED_PROCEDURES.GET_USER_FOR_LOGIN_JSON,
      [{ 'Username': username }],
      false
    );

    const record = (
      Array.isArray(lookup.data) ? lookup.data[0] : lookup.data
    ) as unknown as UserForLogin | null;

    // Never reveal whether the username exists - same generic message either
    // way for an unknown username or a wrong password.
    if (!record) {
      await this.recordFailure(username, null, 'Unknown username', ipAddress, userAgent);
      return { success: false, message: 'Invalid username or password.' };
    }

    if (!record.IsActive) {
      await this.recordFailure(username, record.UserId, 'Account inactive', ipAddress, userAgent);
      return { success: false, message: 'Your account is inactive. Please contact an administrator.' };
    }

    if (record.IsAccountLocked) {
      await this.recordFailure(username, record.UserId, 'Account locked', ipAddress, userAgent);
      return { success: false, message: 'Your account has been locked. Please contact an administrator.' };
    }

    const passwordMatches = await bcrypt.compare(password, record.PasswordHash);

    if (!passwordMatches) {
      await this.recordFailure(username, record.UserId, 'Invalid password', ipAddress, userAgent);
      return { success: false, message: 'Invalid username or password.' };
    }

    const successResult = await this.mssqlService.requestByStoredProcedure<{ LoginLogId: number }>(
      USER_STORED_PROCEDURES.RECORD_LOGIN_SUCCESS,
      [
        {
          'UserId': record.UserId,
          'Username': record.Username,
          'IPAddress': ipAddress || null,
          'UserAgent': userAgent || null
        }
      ]
    );

    const loginLogId = (successResult.data as unknown as { LoginLogId: number }[])?.[0]?.LoginLogId;

    const user = mapToAuthUser(record);

    const accessToken = jwt.sign(
      { userId: user.userId, username: user.username, userType: user.userType },
      config.auth.jwtSecret,
      // @types/jsonwebtoken narrows expiresIn to a branded StringValue type
      // (e.g. "8h"); config.auth.jwtExpiresIn is a validated env string of
      // that same shape, just not literal-typed.
      { expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    return { success: true, accessToken, loginLogId, user };
  }

  async logout(loginLogId: number): Promise<void> {
    if (!loginLogId) {
      return;
    }

    await this.mssqlService.requestByStoredProcedure(USER_STORED_PROCEDURES.RECORD_LOGOUT, [
      { 'LoginLogId': loginLogId }
    ]);
  }

  async getMe(userId: number): Promise<User | null> {
    const result = await this.mssqlService.requestByStoredProcedure<ManagedUser>(
      USER_STORED_PROCEDURES.GET_USER_JSON,
      [{ 'UserId': userId }],
      false
    );

    const record = (
      Array.isArray(result.data) ? result.data[0] : result.data
    ) as unknown as ManagedUser | null;

    return record ? mapToAuthUser(record) : null;
  }
}
