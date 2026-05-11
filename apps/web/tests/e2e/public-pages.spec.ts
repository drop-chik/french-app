import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the unauthenticated parts of the app.
 *
 * These don't touch the database or AI calls — they just verify that the
 * static SPA shell renders and the public routes return the right page.
 *
 * Run:  pnpm --filter @french-app/web exec playwright test
 *       (start `pnpm dev` first, or set PLAYWRIGHT_BASE_URL to a deployed URL)
 */

test.describe('Public pages', () => {
  test('landing page renders the hero CTA', async ({ page }) => {
    await page.goto('/');
    // The landing should have the FrenchUp brand somewhere
    await expect(page).toHaveTitle(/FrenchUp/i);
    // At least one anchor that leads to /login (the public CTA)
    const loginLink = page.locator('a[href*="/login"], a[href="/login"]').first();
    await expect(loginLink).toBeVisible({ timeout: 10_000 });
  });

  test('login page renders an email + password form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Submit button (form has it as either button[type=submit] or a button)
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('privacy and terms pages return 200 with non-empty body', async ({ page }) => {
    for (const path of ['/privacy', '/terms']) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} status`).toBeLessThan(400);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, `${path} body length`).toBeGreaterThan(50);
    }
  });

  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // The auth layout's beforeLoad throws a redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Login form validation', () => {
  test('shows an error on empty submit', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // Browser's built-in :invalid pseudo on the email field
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});
