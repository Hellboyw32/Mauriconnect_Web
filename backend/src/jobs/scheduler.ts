import type { Services } from '../container';
import { logger } from '../utils/logger';

/** Runs a job on an interval, never overlapping itself. */
function every(name: string, ms: number, job: () => Promise<unknown>) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await job();
    } catch (err) {
      logger.error({ err, job: name }, 'Background job failed');
    } finally {
      running = false;
    }
  }, ms);
  timer.unref();
  return timer;
}

/**
 * Background jobs. Safe to run in several instances at once: the outbox is claimed with
 * READPAST row locks and hold expiry is a single idempotent UPDATE.
 */
export function startJobs(services: Services) {
  const timers = [
    every('email-outbox', 5_000, () => services.emails.processOutbox()),
    every('expire-holds', 60_000, async () => {
      const expired = await services.bookings.expireHolds();
      if (expired > 0) logger.info({ expired }, 'Expired unpaid booking holds');
    }),
  ];
  return () => timers.forEach(clearInterval);
}
