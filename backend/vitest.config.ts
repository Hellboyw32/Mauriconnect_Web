import { defineConfig } from 'vitest/config';

const testEnv = {
  NODE_ENV: 'test',
  DB_NAME: 'MauriConnect_Test',
  JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
  PAYMENT_PROVIDER: 'fake',
  JOBS_ENABLED: 'false',
  OFFICE_EMAIL: 'office@example.test',
  LOG_LEVEL: 'silent',
};

export default defineConfig({
  test: {
    // The integration files share one test database, so files run one after another.
    fileParallelism: false,
    projects: [
      {
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], env: testEnv },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          env: testEnv,
          globalSetup: ['tests/integration/globalSetup.ts'],
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
