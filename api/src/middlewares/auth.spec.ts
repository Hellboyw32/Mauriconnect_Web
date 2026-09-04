import 'reflect-metadata';
import config from '@/config';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  requirePermission,
  requireReportAccess,
  requireRole,
  validateReportDateRange
} from './auth';

const buildRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  it('rejects a request with no Authorization header', () => {
    const req: any = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid/expired token', () => {
    const req: any = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches req.user and calls next() for a valid token', () => {
    const token = jwt.sign(
      { userId: 7, username: 'jdoe', userType: 'Normal' },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: 7, username: 'jdoe', userType: 'Normal' });
  });
});

describe('requireRole middleware', () => {
  it('allows a request whose req.user has a matching role', () => {
    const req: any = { user: { userId: 1, username: 'admin', userType: 'Admin' } };
    const res = buildRes();
    const next = jest.fn();

    requireRole('Admin')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a Normal user from an Admin-only route with 403', () => {
    const req: any = { user: { userId: 2, username: 'jdoe', userType: 'Normal' } };
    const res = buildRes();
    const next = jest.fn();

    requireRole('Admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when req.user is missing entirely (authenticate did not run)', () => {
    const req: any = {};
    const res = buildRes();
    const next = jest.fn();

    requireRole('Admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requirePermission middleware', () => {
  it('always allows an Admin, regardless of any permission rows', () => {
    const req: any = { user: { userId: 1, username: 'admin', userType: 'Admin', permissions: [] } };
    const res = buildRes();
    const next = jest.fn();

    requirePermission('Bookings', 'Delete')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows a Normal user when the explicit flag for that action is true', () => {
    const req: any = {
      user: {
        userId: 2,
        username: 'jdoe',
        userType: 'Normal',
        permissions: [
          { module: 'Cars', canView: true, canCreate: true, canEdit: true, canDelete: false }
        ]
      }
    };
    const res = buildRes();
    const next = jest.fn();

    requirePermission('Cars', 'Create')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects a Normal user when the explicit flag for that action is false', () => {
    const req: any = {
      user: {
        userId: 2,
        username: 'jdoe',
        userType: 'Normal',
        permissions: [
          { module: 'Cars', canView: true, canCreate: true, canEdit: true, canDelete: false }
        ]
      }
    };
    const res = buildRes();
    const next = jest.fn();

    requirePermission('Cars', 'Delete')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a Normal user when the module has no row at all (default-allow)', () => {
    const req: any = {
      user: { userId: 2, username: 'jdoe', userType: 'Normal', permissions: [] }
    };
    const res = buildRes();
    const next = jest.fn();

    requirePermission('Reports', 'View')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects when req.user is missing entirely (authenticate did not run)', () => {
    const req: any = {};
    const res = buildRes();
    const next = jest.fn();

    requirePermission('Bookings', 'View')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireReportAccess middleware', () => {
  it('always allows an Admin', () => {
    const req: any = { user: { userId: 1, username: 'admin', userType: 'Admin', reportTypes: [] } };
    const res = buildRes();
    const next = jest.fn();

    requireReportAccess('Insurance')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects a Normal user when that report type is explicitly disallowed', () => {
    const req: any = {
      user: {
        userId: 2,
        username: 'jdoe',
        userType: 'Normal',
        reportTypes: [{ reportType: 'Insurance', isAllowed: false }]
      }
    };
    const res = buildRes();
    const next = jest.fn();

    requireReportAccess('Insurance')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a Normal user when the report type has no row at all (default-allow)', () => {
    const req: any = { user: { userId: 2, username: 'jdoe', userType: 'Normal', reportTypes: [] } };
    const res = buildRes();
    const next = jest.fn();

    requireReportAccess('SimCard')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('validateReportDateRange', () => {
  it('rejects if req.user is missing', () => {
    const req: any = {};

    expect(validateReportDateRange(req, [new Date('2026-06-01')])).toMatch(/authentication/i);
  });

  it('allows any date for an Admin', () => {
    const req: any = { user: { userId: 1, username: 'admin', userType: 'Admin' } };

    expect(validateReportDateRange(req, [new Date('2000-01-01')])).toBeNull();
  });

  it('allows a Normal user with no Reports permission row (default-allow)', () => {
    const req: any = { user: { userId: 2, username: 'jdoe', userType: 'Normal', permissions: [] } };

    expect(validateReportDateRange(req, [new Date('2000-01-01')])).toBeNull();
  });

  it('rejects a date further back than MaxDaysBeforeToday allows', () => {
    const req: any = {
      user: {
        userId: 2,
        username: 'jdoe',
        userType: 'Normal',
        permissions: [
          {
            module: 'Reports',
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            maxDaysBeforeToday: 30,
            maxDaysAfterToday: null
          }
        ]
      }
    };

    // jest's Date mocking would be overkill here - isDateWithinReportWindow
    // defaults `today` to `new Date()`, so use a date far enough in the past
    // relative to the real current date that it's always outside a 30-day window.
    const farPast = new Date();
    farPast.setDate(farPast.getDate() - 365);

    expect(validateReportDateRange(req, [farPast])).toMatch(/outside the range/i);
  });

  it('allows a date within the configured window', () => {
    const req: any = {
      user: {
        userId: 2,
        username: 'jdoe',
        userType: 'Normal',
        permissions: [
          {
            module: 'Reports',
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            maxDaysBeforeToday: 30,
            maxDaysAfterToday: 30
          }
        ]
      }
    };

    expect(validateReportDateRange(req, [new Date()])).toBeNull();
  });
});
