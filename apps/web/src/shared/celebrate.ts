import confetti from 'canvas-confetti';

/**
 * Two confetti bursts from the lower corners in the given accent colour —
 * the shared celebration beat for milestone moments (CEFR promotion,
 * level-test pass). One helper so every celebration feels the same.
 * Respects prefers-reduced-motion (no-op).
 */
export function fireConfetti(accent: string): void {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  const colors = [accent, '#ffffff', '#fbbf24'];
  confetti({ particleCount: 80, spread: 70, angle: 60, origin: { x: 0, y: 0.7 }, colors });
  confetti({ particleCount: 80, spread: 70, angle: 120, origin: { x: 1, y: 0.7 }, colors });
}
