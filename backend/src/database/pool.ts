import type * as MssqlTypes from 'mssql';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export type Sql = typeof MssqlTypes;

// Both drivers expose the same API; msnodesqlv8 adds Windows authentication through ODBC.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const sql: Sql = env.DB_DRIVER === 'msnodesqlv8' ? require('mssql/msnodesqlv8') : require('mssql');

export function buildConfig(database: string = env.DB_NAME): MssqlTypes.config {
  const pool = { max: 10, min: 0, idleTimeoutMillis: 30_000 };
  if (env.DB_DRIVER === 'msnodesqlv8') {
    return {
      server: env.DB_ODBC_SERVER,
      database,
      pool,
      connectionString:
        `Driver={${env.DB_ODBC_DRIVER}};Server=${env.DB_ODBC_SERVER};Database=${database};` +
        'Trusted_Connection=yes;TrustServerCertificate=yes;',
      options: { useUTC: true },
    } as MssqlTypes.config;
  }
  return {
    server: env.DB_SERVER,
    port: env.DB_PORT,
    database,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    pool,
    options: {
      encrypt: env.DB_ENCRYPT,
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      useUTC: true,
    },
  };
}

let poolPromise: Promise<MssqlTypes.ConnectionPool> | null = null;

export function getPool(): Promise<MssqlTypes.ConnectionPool> {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(buildConfig());
    pool.on('error', (err) => logger.error({ err }, 'SQL pool error'));
    poolPromise = pool.connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  if (poolPromise) {
    const pool = await poolPromise;
    poolPromise = null;
    await pool.close();
  }
}

/** Runs an operation and retries it on deadlock (1205), which SQL Server resolves by aborting one side. Only for self-contained transactions. */
export async function withDeadlockRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const n = (err as { number?: number; originalError?: { info?: { number?: number } } }).number ??
        (err as { originalError?: { info?: { number?: number } } }).originalError?.info?.number;
      if (n !== 1205 || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 50 * i));
    }
  }
}
