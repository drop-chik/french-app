import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 (or current value) up to `target` with ease-out cubic.
 * Returns the live value during the tween.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target > 0 ? 0 : target);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const next = Math.round(from + (target - from) * eased);
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}
