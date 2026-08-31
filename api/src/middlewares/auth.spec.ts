import 'reflect-metadata';
import config from '@/config';
import jwt from 'jsonwebtoken';
import { authenticate, requireRole } from './auth';

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
