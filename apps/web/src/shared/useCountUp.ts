import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from its previous value up to `target` over `durationMs`.
 *
 * Used for the satisfying "stats tick up on load" feel (Smart Credits,
 * level progress, XP). Reusable so every counting number in the app shares
 * the same easing and timing — one motion vocabulary, not per-component
 * re-inventions.
 *
 * Respects prefers-reduced-motion: returns the target immediately, no
 * animation. Cleans up its rAF on unmount / target change.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Honour reduced-motion — snap straight to the target.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    // easeOutCubic — fast start, gentle settle, matching --ease-out's feel.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(from + delta * ease(p)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}
