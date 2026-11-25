import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: process.env.DOTENV_PATH ?? path.resolve(__dirname, '../../.env') });

const bool = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    PUBLIC_SITE_URL: z.url().default('http://localhost:5173'),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    TRUST_PROXY: bool,
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    DB_DRIVER: z.enum(['msnodesqlv8', 'tedious']).default('tedious'),
    DB_NAME: z.string().min(1).default('MauriConnect'),
    DB_ODBC_SERVER: z.string().default('localhost\\SQLEXPRESS'),
    DB_ODBC_DRIVER: z.string().default('ODBC Driver 17 for SQL Server'),
    DB_SERVER: z.string().default('localhost'),
    DB_PORT: z.coerce.number().int().positive().default(1433),
    DB_USER: z.string().default(''),
    DB_PASSWORD: z.string().default(''),
    DB_ENCRYPT: bool.default(true),
    DB_TRUST_SERVER_CERTIFICATE: bool,

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    BOOKING_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(120),
    LINK_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(60),
    ADMIN_API_KEY: z.string().default(''),

    PAYMENT_PROVIDER: z.enum(['paypal', 'fake']).default('paypal'),
    PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
    PAYPAL_CLIENT_ID: z.string().default(''),
    PAYPAL_CLIENT_SECRET: z.string().default(''),
    PAYPAL_WEBHOOK_ID: z.string().default(''),

    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: bool,
    SMTP_USER: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    MAIL_FROM: z.string().default('MauriConnect Car Rental <info@mauriconnect.com>'),
    OFFICE_EMAIL: z.string().default(''),

    STORAGE_DIR: z.string().default('./storage'),
    JOBS_ENABLED: bool.default(true),
    SHOW_SAMPLE_REVIEWS: bool,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.PAYMENT_PROVIDER !== 'paypal') {
      ctx.addIssue({ code: 'custom', path: ['PAYMENT_PROVIDER'], message: 'Only paypal is allowed in production' });
    }
    if (env.PAYMENT_PROVIDER === 'paypal' && (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET)) {
      ctx.addIssue({ code: 'custom', path: ['PAYPAL_CLIENT_ID'], message: 'PayPal credentials are required' });
    }
    if (env.NODE_ENV === 'production' && env.SHOW_SAMPLE_REVIEWS) {
      ctx.addIssue({ code: 'custom', path: ['SHOW_SAMPLE_REVIEWS'], message: 'Sample ratings are demo data and cannot be shown in production' });
    }
    if (env.NODE_ENV === 'production' && !env.SMTP_HOST) {
      ctx.addIssue({ code: 'custom', path: ['SMTP_HOST'], message: 'SMTP_HOST is required in production' });
    }
    if (env.DB_DRIVER === 'tedious' && (!env.DB_USER || !env.DB_PASSWORD)) {
      ctx.addIssue({ code: 'custom', path: ['DB_USER'], message: 'DB_USER and DB_PASSWORD are required for the tedious driver' });
    }
  });

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return parsed.data;
}

export const env: Env = load();

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const storageDir = path.resolve(__dirname, '../..', env.STORAGE_DIR);
