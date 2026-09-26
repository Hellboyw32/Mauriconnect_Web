import 'reflect-metadata';
import { USER_STORED_PROCEDURES } from '@/constants';
import bcrypt from 'bcryptjs';
import { UserService } from './user';

describe('UserService', () => {
  const actingAdmin = { userId: 1, username: 'admin' };

  const buildService = (mssqlService: any, auditLogService: any = { log: jest.fn() }) => {
    const service = new UserService();
    (service as any).mssqlService = mssqlService;
    (service as any).auditLogService = auditLogService;
    return service;
  };

  describe('updateUser - privilege escalation guards', () => {
    it('refuses to let an admin lock their own account', async () => {
      const mssql = { requestByStoredProcedure: jest.fn() };
      const service = buildService(mssql);

      const result = await service.updateUser(
        actingAdmin.userId,
        {
          Username: 'admin',
          EmailAccount: 'admin@example.com',
          UserType: 'Admin',
          IsActive: true,
          IsAccountLocked: true
        },
        actingAdmin
      );

      expect(result.status).toBe(400);
      expect(result.success).toBe(false);
      expect(mssql.requestByStoredProcedure).not.toHaveBeenCalled();
    });

    it('refuses to let an admin demote their own account to Normal', async () => {
      const mssql = { requestByStoredProcedure: jest.fn() };
      const service = buildService(mssql);

      const result = await service.updateUser(
        actingAdmin.userId,
        {
          Username: 'admin',
          EmailAccount: 'admin@example.com',
          UserType: 'Normal',
          IsActive: true,
          IsAccountLocked: false
        },
        actingAdmin
      );

      expect(result.status).toBe(400);
      expect(result.success).toBe(false);
      expect(mssql.requestByStoredProcedure).not.toHaveBeenCalled();
    });

    it('allows an admin to edit a different user freely', async () => {
      const mssql = {
        requestByStoredProcedure: jest.fn(async (sp: string) => {
          if (sp === USER_STORED_PROCEDURES.CHECK_USERNAME_EXISTS) {
            return { status: 200, success: true, data: { UsernameExists: false } };
          }
          return { status: 200, success: true, data: [] };
        })
      };
      const service = buildService(mssql);

      const result = await service.updateUser(
        2,
        {
          Username: 'jdoe',
          EmailAccount: 'jdoe@example.com',
          UserType: 'Admin',
          IsActive: true,
          IsAccountLocked: true
        },
        actingAdmin
      );

      expect(result.status).toBe(200);
      expect(mssql.requestByStoredProcedure).toHaveBeenCalledWith(
        USER_STORED_PROCEDURES.UPDATE_USER,
        expect.any(Array)
      );
    });
  });

  describe('lockUser', () => {
    it('refuses to let an admin lock themselves via the lock endpoint', async () => {
      const mssql = { requestByStoredProcedure: jest.fn() };
      const service = buildService(mssql);

      const result = await service.lockUser(actingAdmin.userId, actingAdmin);

      expect(result.status).toBe(400);
      expect(mssql.requestByStoredProcedure).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('rejects a duplicate username with a friendly message', async () => {
      const mssql = {
        requestByStoredProcedure: jest.fn(async (sp: string) => {
          if (sp === USER_STORED_PROCEDURES.CHECK_USERNAME_EXISTS) {
            return { status: 200, success: true, data: { UsernameExists: true } };
          }
          throw new Error(`Unexpected call: ${sp}`);
        })
      };
      const service = buildService(mssql);

      const result = await service.createUser(
        {
          Username: 'jdoe',
          EmailAccount: 'jdoe@example.com',
          Password: 'Password123',
          UserType: 'Normal',
          IsActive: true,
          IsAccountLocked: false
        },
        actingAdmin
      );

      expect(result.status).toBe(400);
      expect(result.message).toMatch(/already taken/i);
    });

    it('hashes the password before it ever reaches the stored procedure call', async () => {
      let capturedInputs: any;
      const mssql = {
        requestByStoredProcedure: jest.fn(async (sp: string, inputs: any) => {
          if (sp === USER_STORED_PROCEDURES.CHECK_USERNAME_EXISTS) {
            return { status: 200, success: true, data: { UsernameExists: false } };
          }
          if (sp === USER_STORED_PROCEDURES.UPDATE_USER) {
            capturedInputs = inputs;
            return { status: 200, success: true, data: [] };
          }
          throw new Error(`Unexpected call: ${sp}`);
        })
      };
      const service = buildService(mssql);

      await service.createUser(
        {
          Username: 'newuser',
          EmailAccount: 'new@example.com',
          Password: 'PlaintextPassword1',
          UserType: 'Normal',
          IsActive: true,
          IsAccountLocked: false
        },
        actingAdmin
      );

      const passwordHash = capturedInputs[0].PasswordHash;
      expect(passwordHash).toBeDefined();
      expect(passwordHash).not.toBe('PlaintextPassword1');
      expect(await bcrypt.compare('PlaintextPassword1', passwordHash)).toBe(true);
    });
  });
});
