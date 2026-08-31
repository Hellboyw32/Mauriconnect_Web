import 'reflect-metadata';
import { USER_STORED_PROCEDURES } from '@/constants';
import { AuthService } from './auth';
import bcrypt from 'bcryptjs';

describe('AuthService.login', () => {
  const password = 'CorrectHorse123';
  let passwordHash: string;

  const baseUser = {
    UserId: 1,
    Username: 'jdoe',
    EmailAccount: 'jdoe@example.com',
    UserType: 'Normal' as const,
    IsAccountLocked: false,
    IsActive: true,
    FailedLoginAttempts: 0
  };

  const buildService = (mssqlService: any): AuthService => {
    const service = new AuthService();
    (service as any).mssqlService = mssqlService;
    return service;
  };

  const mockMssql = (userForLoginData: any) => ({
    requestByStoredProcedure: jest.fn(async (sp: string, inputs?: any[]) => {
      if (sp === USER_STORED_PROCEDURES.GET_USER_FOR_LOGIN_JSON) {
        return { status: 200, success: true, data: userForLoginData };
      }
      if (sp === USER_STORED_PROCEDURES.RECORD_LOGIN_SUCCESS) {
        return { status: 200, success: true, data: [{ LoginLogId: 42 }] };
      }
      if (sp === USER_STORED_PROCEDURES.RECORD_LOGIN_FAILURE) {
        return { status: 200, success: true, data: [] };
      }
      throw new Error(`Unexpected stored procedure called: ${sp}`);
    })
  });

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 4); // low cost factor - faster tests
  });

  it('returns a token and user on correct credentials', async () => {
    const mssql = mockMssql({ ...baseUser, PasswordHash: passwordHash });
    const service = buildService(mssql);

    const result = await service.login('jdoe', password);

    expect(result.success).toBe(true);
    expect(result.accessToken).toBeTruthy();
    expect(result.loginLogId).toBe(42);
    expect(result.user?.username).toBe('jdoe');
    expect((result.user as any).passwordHash).toBeUndefined();
    expect(mssql.requestByStoredProcedure).toHaveBeenCalledWith(
      USER_STORED_PROCEDURES.RECORD_LOGIN_SUCCESS,
      expect.any(Array)
    );
  });

  it('rejects an unknown username with a generic message, without revealing it does not exist', async () => {
    const mssql = mockMssql(null);
    const service = buildService(mssql);

    const result = await service.login('ghost', 'whatever');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid username or password.');
    expect(mssql.requestByStoredProcedure).toHaveBeenCalledWith(
      USER_STORED_PROCEDURES.RECORD_LOGIN_FAILURE,
      expect.any(Array)
    );
  });

  it('rejects a wrong password with the same generic message as an unknown username', async () => {
    const mssql = mockMssql({ ...baseUser, PasswordHash: passwordHash });
    const service = buildService(mssql);

    const result = await service.login('jdoe', 'totally-wrong-password');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid username or password.');
  });

  it('rejects a locked account with a clear, distinct message', async () => {
    const mssql = mockMssql({ ...baseUser, PasswordHash: passwordHash, IsAccountLocked: true });
    const service = buildService(mssql);

    const result = await service.login('jdoe', password);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Your account has been locked. Please contact an administrator.');
  });

  it('rejects an inactive account with a clear, distinct message', async () => {
    const mssql = mockMssql({ ...baseUser, PasswordHash: passwordHash, IsActive: false });
    const service = buildService(mssql);

    const result = await service.login('jdoe', password);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Your account is inactive. Please contact an administrator.');
  });

  it('passes the configured max-attempts threshold through to the failure recorder', async () => {
    const mssql = mockMssql({ ...baseUser, PasswordHash: passwordHash });
    const service = buildService(mssql);

    await service.login('jdoe', 'wrong-password');

    const failureCall = mssql.requestByStoredProcedure.mock.calls.find(
      ([sp]: [string]) => sp === USER_STORED_PROCEDURES.RECORD_LOGIN_FAILURE
    );
    expect(failureCall).toBeDefined();
    const [, inputs] = failureCall as [string, any[]];
    expect(inputs[0].MaxFailedAttempts).toBe(5);
  });
});
