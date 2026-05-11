import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Playwright config — point this at whatever instance you want to smoke-test.
 *
 * Local default: PLAYWRIGHT_BASE_URL=http://localhost:5173 (the Vite dev server).
 * Production:    PLAYWRIGHT_BASE_URL=https://french-web-two.vercel.app
 *
 * Authenticated specs depend on `auth.setup.ts`, which reads
 * E2E_TEST_EMAIL / E2E_TEST_PASSWORD and stores cookies + localStorage (the
 * JWT) into .auth/user.json. The `chromium-auth` project loads that state.
 * If those env vars aren't set, setup skips and the authenticated suite is
 * skipped along with it.
 */

const AUTH_FILE = path.join(process.cwd(), '.auth', 'user.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',

  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testMatch: /public-pages\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-auth',
      testMatch: /authenticated\..*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],

  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env['CI'],
  //   timeout: 120_000,
  // },
});
