import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Express 4 does not forward rejected promises to the error handler; this does. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const clientIp = (req: Request): string | null => (req.ip ? req.ip.replace(/^::ffff:/, '').slice(0, 45) : null);
