import config from '@/config';
import { canRunReport, hasPermission, isDateWithinReportWindow } from '@libs/permissions';
import type { Module, ModulePermission, PermissionAction, ReportType, ReportTypePermission } from '@libs/types';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: number;
  username: string;
  userType: 'Normal' | 'Admin';
  permissions?: ModulePermission[];
  reportTypes?: ReportTypePermission[];
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
    req.user = {
      userId: payload.userId,
      username: payload.username,
      userType: payload.userType,
      permissions: payload.permissions,
      reportTypes: payload.reportTypes
    };
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

// Admins always bypass (see hasPermission); a Normal user with no explicit
// row for this module is also allowed (default-allow, see
// database/add_user_permissions.sql) - only an explicit false flag denies.
export const requirePermission = (module: Module, action: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !hasPermission(req.user, module, action)) {
      res.status(403).json({ message: 'You do not have permission to perform this action.' });
      return;
    }

    next();
  };
};

// Gates a specific report (e.g. SimCard vs Insurance), independent of the
// Reports module's own View flag which requirePermission('Reports','View')
// already checks at the router-mount level in reports.ts.
export const requireReportAccess = (reportType: ReportType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !canRunReport(req.user, reportType)) {
      res.status(403).json({ message: 'You do not have permission to run this report.' });
      return;
    }

    next();
  };
};

// Route handlers call this directly (rather than as middleware) since the
// query param names differ per report (pickupdate/dropoffdate vs
// startDate/endDate) - see reports.ts. Returns an error message string, or
// null if every provided date is within the user's allowed window.
export const validateReportDateRange = (
  req: Request,
  dates: Array<Date | undefined>
): string | null => {
  if (!req.user) {
    return 'Authentication required.';
  }

  for (const date of dates) {
    if (date && !isDateWithinReportWindow(req.user, date)) {
      return 'The selected date is outside the range you are allowed to query.';
    }
  }

  return null;
};
