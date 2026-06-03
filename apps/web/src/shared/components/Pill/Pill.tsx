import type { ReactNode } from 'react';
import styles from './Pill.module.css';

interface PillProps {
  children: ReactNode;
  /** Visual tone of the pill */
  tone?: 'brand' | 'accent' | 'neutral' | 'success' | 'level' | undefined;
  /** Specific CEFR level — only relevant when tone='level' */
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | undefined;
  className?: string | undefined;
}

/**
 * Small uppercase label. Use for "BEST VALUE" badges, CEFR chips,
 * status markers. The size and rhythm come from the design tokens —
 * never override from outside.
 */
export function Pill({ children, tone = 'neutral', level, className }: PillProps) {
  const toneClass =
    tone === 'level' && level
      ? styles[`level${level}`]
      : tone !== 'level'
        ? styles[tone]
        : '';
  return (
    <span className={`${styles.pill} ${toneClass ?? ''} ${className ?? ''}`}>
      {children}
    </span>
  );
}
