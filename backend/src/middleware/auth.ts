import { timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import type { TokenService } from '../services/tokens';
import { AppError, forbidden, unauthorized } from '../utils/errors';

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Requires a booking token for the booking named in the URL (or in body.bookingReference).
 * allowQueryToken: lets a plain link (voucher download) carry the token as ?token=.
 */
export function requireBookingAccess(tokens: TokenService, options: { allowQueryToken?: boolean } = {}): RequestHandler {
  return (req, _res, next) => {
    const token = bearer(req) ?? (options.allowQueryToken && typeof req.query.token === 'string' ? req.query.token : null);
    if (!token) return next(unauthorized('Please look up your booking first.'));
    const reference = tokens.verify(token);
    if (!reference) return next(unauthorized('Your session has expired. Please look up your booking again.'));
    const target = String(req.params.reference ?? req.body?.bookingReference ?? '').toUpperCase();
    if (!target || reference !== target) return next(forbidden());
    next();
  };
}

export function requireAdminKey(adminKey: string): RequestHandler {
  const expected = Buffer.from(adminKey);
  return (req, _res, next) => {
    if (!adminKey) return next(new AppError(404, 'NOT_FOUND', 'Not found.'));
    const provided = Buffer.from(String(req.headers['x-api-key'] ?? ''));
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return next(unauthorized('Invalid API key.'));
    next();
  };
}
