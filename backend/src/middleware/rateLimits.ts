import rateLimit, { type Options } from 'express-rate-limit';

const message = (text: string) => ({ error: { code: 'RATE_LIMITED', message: text, details: [] } });

const base: Partial<Options> = { standardHeaders: 'draft-7', legacyHeaders: false };

export function createRateLimits(enabled: boolean) {
  const make = (opts: Partial<Options>) => rateLimit({ ...base, ...opts, skip: () => !enabled });
  return {
    global: make({ windowMs: 60_000, limit: 120, message: message('Too many requests. Please slow down.') }),
    // Booking lookup is the brute-force target: few attempts per IP and per reference.
    lookup: make({
      windowMs: 15 * 60_000,
      limit: 5,
      keyGenerator: (req) => `${req.ip}|${String(req.params.reference ?? '').toUpperCase()}`,
      message: message('Too many attempts. Please wait 15 minutes and try again.'),
    }),
    lookupPerIp: make({ windowMs: 15 * 60_000, limit: 20, message: message('Too many attempts. Please wait 15 minutes and try again.') }),
    createBooking: make({ windowMs: 60 * 60_000, limit: 10, message: message('Too many bookings from this connection. Please contact us.') }),
    payments: make({ windowMs: 10 * 60_000, limit: 30, message: message('Too many payment attempts. Please wait a few minutes.') }),
    enquiries: make({ windowMs: 60 * 60_000, limit: 5, message: message('Too many messages. Please contact us by phone or WhatsApp.') }),
  };
}
