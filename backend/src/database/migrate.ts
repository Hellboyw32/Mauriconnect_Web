/*
  Database migration runner.
    V###__name.sql  versioned, applied once, in order
    R__name.sql     repeatable, re-applied whenever its content changes
  Seeds (reference data, optional dev fleet) are idempotent and applied with --seed / --dev-fleet.

  Development-only seeds (--dev-fleet, --sample-reviews) are refused when NODE_ENV=production.

  Usage: tsx src/database/migrate.ts [--seed] [--dev-fleet] [--sample-reviews] [--reset] [--database Name]
*/
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type * as MssqlTypes from 'mssql';
import { env } from '../config/env';
import { buildConfig, sql } from './pool';

const DATABASE_DIR = path.resolve(__dirname, '../../../database');
const MIGRATIONS_DIR = path.join(DATABASE_DIR, 'migrations');
const SEED_DIR = path.join(DATABASE_DIR, 'seed');

export interface MigrateOptions {
  database?: string;
  reset?: boolean;
  seed?: boolean;
  devFleet?: boolean;
  /** Demo star ratings flagged IsSample (development only). */
  sampleReviews?: boolean;
  log?: (message: string) => void;
}

const splitBatches = (script: string) =>
  script
    .split(/^\s*GO\s*;?\s*$/im)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

const checksum = (text: string) => createHash('sha256').update(text).digest('hex');

const quoteName = (name: string) => {
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Unsafe database name: ${name}`);
  return `[${name}]`;
};

async function runScript(pool: MssqlTypes.ConnectionPool, script: string) {
  for (const batch of splitBatches(script)) {
    await pool.request().batch(batch);
  }
}

async function ensureDatabase(database: string, reset: boolean, log: (m: string) => void) {
  const master = await new sql.ConnectionPool(buildConfig('master')).connect();
  try {
    const name = quoteName(database);
    if (reset) {
      if (env.NODE_ENV === 'production') throw new Error('--reset is not allowed in production');
      log(`Dropping database ${database}`);
      await master.request().batch(
        `IF DB_ID(N'${database}') IS NOT NULL BEGIN ALTER DATABASE ${name} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${name}; END`,
      );
    }
    const exists = await master.request().input('db', sql.NVarChar(128), database).query('SELECT DB_ID(@db) AS id');
    if (exists.recordset[0].id === null) {
      log(`Creating database ${database}`);
      await master.request().batch(`CREATE DATABASE ${name}`);
      await master.request().batch(`ALTER DATABASE ${name} SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE`);
    }
  } finally {
    await master.close();
  }
}

export async function migrate(options: MigrateOptions = {}): Promise<void> {
  const database = options.database ?? env.DB_NAME;
  const log = options.log ?? ((m: string) => console.log(m));
  if (env.NODE_ENV === 'production' && (options.devFleet || options.sampleReviews)) {
    throw new Error('Development seed data (--dev-fleet, --sample-reviews) cannot be loaded in production.');
  }

  await ensureDatabase(database, options.reset ?? false, log);

  const pool = await new sql.ConnectionPool(buildConfig(database)).connect();
  try {
    await pool.request().batch(`
      IF OBJECT_ID(N'dbo.SchemaMigrations') IS NULL
        CREATE TABLE dbo.SchemaMigrations (
          ScriptName   nvarchar(200) NOT NULL PRIMARY KEY,
          Checksum     char(64)      NOT NULL,
          AppliedAtUtc datetime2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
        );`);

    const applied = new Map<string, string>(
      (await pool.request().query('SELECT ScriptName, Checksum FROM dbo.SchemaMigrations')).recordset.map((r) => [
        r.ScriptName as string,
        r.Checksum as string,
      ]),
    );

    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    const versioned = files.filter((f) => f.startsWith('V'));
    const repeatable = files.filter((f) => f.startsWith('R__'));

    for (const file of [...versioned, ...repeatable]) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const sum = checksum(content);
      const previous = applied.get(file);
      if (previous === sum) continue;
      if (previous && file.startsWith('V')) {
        throw new Error(`${file} was changed after it was applied. Add a new V### migration instead.`);
      }
      log(`Applying ${file}`);
      await runScript(pool, content);
      await pool
        .request()
        .input('name', sql.NVarChar(200), file)
        .input('sum', sql.Char(64), sum)
        .query(
          `MERGE dbo.SchemaMigrations AS t USING (SELECT @name AS ScriptName) s ON t.ScriptName = s.ScriptName
           WHEN MATCHED THEN UPDATE SET Checksum = @sum, AppliedAtUtc = SYSUTCDATETIME()
           WHEN NOT MATCHED THEN INSERT (ScriptName, Checksum) VALUES (@name, @sum);`,
        );
    }

    if (options.seed) {
      log('Seeding reference data');
      await runScript(pool, fs.readFileSync(path.join(SEED_DIR, 'reference_data.sql'), 'utf8'));
    }
    if (options.devFleet) {
      log('Seeding development fleet');
      await runScript(pool, fs.readFileSync(path.join(SEED_DIR, 'dev_fleet.sql'), 'utf8'));
    }
    if (options.sampleReviews) {
      log('Seeding sample ratings (demo data, IsSample = 1)');
      await runScript(pool, fs.readFileSync(path.join(SEED_DIR, 'dev_sample_reviews.sql'), 'utf8'));
    }
    log(`Database ${database} is up to date.`);
  } finally {
    await pool.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const dbIndex = args.indexOf('--database');
  migrate({
    database: dbIndex >= 0 ? args[dbIndex + 1] : undefined,
    reset: args.includes('--reset'),
    seed: args.includes('--seed'),
    devFleet: args.includes('--dev-fleet'),
    sampleReviews: args.includes('--sample-reviews'),
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
