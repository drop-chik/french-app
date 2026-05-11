import { test, expect } from '@playwright/test';

/**
 * Flashcard mode interaction.
 *
 * Read-only — we open Flashcard mode and verify the keyboard shortcut flips
 * the card. We deliberately don't grade (which would write progress to the
 * test account); just observe that the back face appears after pressing Space.
 *
 * If the test account has nothing to study (sessionWords.length === 0), the
 * mode card is disabled and we skip.
 */

test('flashcard mode flips on Space', async ({ page }) => {
  await page.goto('/vocabulary');

  // Find the "Карточки" / "Flashcard" mode card. Both UI languages render it
  // as a button — match the localised name.
  const modeCard = page
    .locator('button', { hasText: /^(Карточки|Flashcards?)$/i })
    .first();

  // If the card never appears or it's disabled (empty session), skip.
  if (!(await modeCard.isVisible().catch(() => false))) {
    test.skip(true, 'flashcard mode card not visible — empty session?');
    return;
  }
  const isDisabled = await modeCard.isDisabled().catch(() => true);
  if (isDisabled) {
    test.skip(true, 'flashcard mode card disabled — no words to study');
    return;
  }

  await modeCard.click();

  // Wait for the card front to render. The flip-hint text only exists on the
  // front face — we use it as a marker.
  const flipHint = page.locator('text=/нажми чтобы перевернуть|tap to flip/i').first();
  await expect(flipHint).toBeVisible({ timeout: 10_000 });

  // Press Space — global listener flips the card.
  await page.keyboard.press('Space');

  // The grade buttons only appear on the flipped state ("Не знал" / "Знал!" / "С трудом").
  const knewBtn = page.locator('button', { hasText: /^(Знал!|Got it!)$/i }).first();
  await expect(knewBtn).toBeVisible({ timeout: 5_000 });
});
