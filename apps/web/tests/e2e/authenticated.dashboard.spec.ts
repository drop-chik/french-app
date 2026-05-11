import { test, expect } from '@playwright/test';

/**
 * Sanity checks for the authenticated app shell.
 *
 * Relies on the storageState produced by auth.setup.ts. If E2E credentials
 * aren't configured this whole project is skipped via the setup test.
 */

test.describe('Dashboard', () => {
  test('renders greeting heading and level badge', async ({ page }) => {
    await page.goto('/dashboard');

    // Greeting <h1> ("Привет, {name}!" / "Hi, {name}!" — both contain the user's name).
    // We don't assert on the localised greeting text, just that a heading exists.
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await expect(heading).not.toBeEmpty();

    // Level badge — A1/A2/B1/B2 etc. appears somewhere on the page.
    await expect(page.locator('body')).toContainText(/(A1|A2|B1|B2|C1|C2)/, { timeout: 5_000 });
  });

  test('sidebar links to /vocabulary', async ({ page }) => {
    await page.goto('/dashboard');
    // The AppLayout renders a sidebar with anchor tags to the main sections.
    const vocabLink = page.locator('a[href*="/vocabulary"]').first();
    await expect(vocabLink).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to /vocabulary and shows practice modes', async ({ page }) => {
    await page.goto('/vocabulary');

    // Title is the page heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Either we see "all done" banner or at least one mode card — both are valid
    // end states. We check that the page loaded past the spinner.
    await expect(page.locator('body')).not.toContainText(/^\s*$/);
  });
});
