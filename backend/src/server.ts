import path from 'node:path';
import { createApp } from './app';
import { corsOrigins, env, storageDir } from './config/env';
import { company } from './config/company';
import { createServices } from './container';
import { closePool, getPool } from './database/pool';
import { startJobs } from './jobs/scheduler';
import { FakePaymentProvider } from './payments/fakeProvider';
import { PayPalProvider } from './payments/paypalProvider';
import type { PaymentProvider } from './payments/types';
import { bookingRepository } from './repositories/bookingRepository';
import { catalogRepository } from './repositories/catalogRepository';
import { enquiryRepository } from './repositories/enquiryRepository';
import { outboxRepository } from './repositories/outboxRepository';
import { paymentRepository } from './repositories/paymentRepository';
import { createPreviewMailer, createSmtpMailer } from './services/mailer';
import { logger } from './utils/logger';

async function main() {
  const provider: PaymentProvider =
    env.PAYMENT_PROVIDER === 'paypal'
      ? new PayPalProvider({
          clientId: env.PAYPAL_CLIENT_ID,
          clientSecret: env.PAYPAL_CLIENT_SECRET,
          mode: env.PAYPAL_MODE,
          webhookId: env.PAYPAL_WEBHOOK_ID,
          brandName: company.name,
        })
      : new FakePaymentProvider();

  const mailer = env.SMTP_HOST
    ? createSmtpMailer({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, user: env.SMTP_USER, password: env.SMTP_PASSWORD, from: env.MAIL_FROM })
    : createPreviewMailer(path.join(storageDir, 'mail-preview'), env.MAIL_FROM);

  const services = createServices({
    catalog: catalogRepository,
    bookings: bookingRepository,
    payments: paymentRepository,
    outbox: outboxRepository,
    enquiries: enquiryRepository,
    provider,
    mailer,
    clock: () => new Date(),
    config: {
      officeEmail: env.OFFICE_EMAIL || null,
      publicSiteUrl: env.PUBLIC_SITE_URL,
      jwtSecret: env.JWT_SECRET,
      bookingTokenTtlMinutes: env.BOOKING_TOKEN_TTL_MINUTES,
      linkTokenTtlDays: env.LINK_TOKEN_TTL_DAYS,
      storageDir,
      cacheSeconds: 60,
      showSampleReviews: env.SHOW_SAMPLE_REVIEWS,
    },
  });

  await getPool(); // fail fast if the database is unreachable

  const app = createApp({
    services,
    corsOrigins,
    trustProxy: env.TRUST_PROXY,
    rateLimitsEnabled: true,
    adminApiKey: env.ADMIN_API_KEY,
    publicConfig: {
      paymentProvider: provider.name === 'PayPal' ? 'paypal' : 'fake',
      paypalClientId: provider.name === 'PayPal' ? env.PAYPAL_CLIENT_ID : null,
    },
  });

  const stopJobs = env.JOBS_ENABLED ? startJobs(services) : () => undefined;
  const server = app.listen(env.PORT, () => {
    logger.info(`MauriConnect API listening on http://localhost:${env.PORT} (payments: ${provider.name}, mail: ${env.SMTP_HOST ? 'SMTP' : 'preview files'})`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    stopJobs();
    server.close(() => {
      closePool().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
