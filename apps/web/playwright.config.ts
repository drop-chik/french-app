import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — point this at whatever instance you want to smoke-test.
 *
 * Local default: PLAYWRIGHT_BASE_URL=http://localhost:5173 (the Vite dev server).
 * Production:    PLAYWRIGHT_BASE_URL=https://french-web-two.vercel.app
 *
 * The webServer block is intentionally not enabled — most local sessions
 * already have `pnpm dev` running. If you want Playwright to launch the dev
 * server itself, uncomment the webServer block below.
 */
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add { name: 'mobile', use: { ...devices['iPhone 13'] } } once we have
    // mobile-specific flows worth testing.
  ],

  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env['CI'],
  //   timeout: 120_000,
  // },
});
