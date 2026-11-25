import type * as MssqlTypes from 'mssql';
import { getPool } from '../database/pool';

export { sql, withDeadlockRetry } from '../database/pool';

export async function request(): Promise<MssqlTypes.Request> {
  return (await getPool()).request();
}

/** SQL `date` values arrive as UTC-midnight Date objects; convert to YYYY-MM-DD. */
export const toIsoDate = (value: Date | string): string => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10));

export const toNumber = (value: unknown): number => (value === null || value === undefined ? 0 : Number(value));

export const toNullableNumber = (value: unknown): number | null => (value === null || value === undefined ? null : Number(value));
