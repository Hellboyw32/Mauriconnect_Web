/** Rebuilds the integration test database from the migration scripts before the run. */
export default async function setup() {
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'MauriConnect_Test';
  process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-1234';
  process.env.PAYMENT_PROVIDER = 'fake';
  const { migrate } = await import('../../src/database/migrate');
  await migrate({ database: 'MauriConnect_Test', reset: true, seed: true, devFleet: true, log: () => undefined });
}
