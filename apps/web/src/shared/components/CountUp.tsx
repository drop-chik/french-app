import { useCountUp } from '../useCountUp';

/**
 * Renders a number that animates to `value` (see useCountUp). Thin wrapper
 * so any JSX can drop in an animated count without worrying about hook
 * ordering in the parent component.
 *
 *   <CountUp value={lp.percent} suffix="%" />
 */
export function CountUp({
  value,
  durationMs,
  suffix,
  prefix,
}: {
  value: number;
  durationMs?: number;
  suffix?: string;
  prefix?: string;
}) {
  const v = useCountUp(value, durationMs);
  return <>{prefix ?? ''}{v.toLocaleString('ru-RU')}{suffix ?? ''}</>;
}
