import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Authenticate once before any authenticated specs run.
 *
 * Reads E2E_TEST_EMAIL / E2E_TEST_PASSWORD from env, logs in through the real
 * UI, and saves browser state (cookies + localStorage with the JWT) to
 * .auth/user.json. Authenticated specs then reuse this state via the
 * project-level `storageState` config in playwright.config.ts.
 *
 * Locally you can run a one-off:
 *   $env:E2E_TEST_EMAIL = "..."; $env:E2E_TEST_PASSWORD = "..."
 *   pnpm --filter @french-app/web exec playwright test
 */

const AUTH_DIR = path.join(process.cwd(), '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env['E2E_TEST_EMAIL'];
  const password = process.env['E2E_TEST_PASSWORD'];

  if (!email || !password) {
    setup.skip(true, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping authenticated suite');
    return;
  }

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // After login we either land on /dashboard or /placement (first-time users).
  // The test user is expected to have completed placement → /dashboard.
  await page.waitForURL(/\/(dashboard|placement)/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
