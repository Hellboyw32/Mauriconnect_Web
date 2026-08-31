import config from '@/config';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: number;
  username: string;
  userType: 'Normal' | 'Admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as AuthenticatedUser;
    req.user = { userId: payload.userId, username: payload.username, userType: payload.userType };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
};

export const requireRole = (...roles: Array<AuthenticatedUser['userType']>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.userType)) {
      res.status(403).json({ message: 'You do not have permission to perform this action.' });
      return;
    }

    next();
  };
};
