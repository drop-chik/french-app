import type { ReactNode } from 'react';
import styles from './Section.module.css';

/**
 * Marketing / level / narrative section container.
 *
 * Enforces the linear narrative arc that SavoirX-style pages use:
 *  - single column, restrained max-width
 *  - generous vertical padding
 *  - consistent eyebrow / title / lead typography
 *  - one CTA emphasised below the lead
 *
 * Use this for every marketing-tier section so we don't get a custom-CSS
 * rewrite per page. The narrative rhythm comes from the design token
 * spacing — never override section padding from outside.
 */
interface SectionProps {
  /** Optional small uppercase tag above the title ("WHY", "HOW", "PLAN") */
  eyebrow?: string | undefined;
  /** Main section heading. Rendered as <h2> by default (set as='h1' for hero). */
  title?: string | undefined;
  /** Lead paragraph under the title. Kept short — one sentence is ideal. */
  lead?: string | undefined;
  /** Body content — cards, screenshots, lists, sub-sections. */
  children?: ReactNode;
  /** Visual variant. 'default' for surface neutral, 'tinted' for accented bands. */
  variant?: 'default' | 'tinted' | undefined;
  /** Render <h1> for the hero (only one per page). */
  as?: 'h1' | 'h2' | undefined;
  /** Use narrower max-width for copy-dense sections. */
  narrow?: boolean | undefined;
  /** Optional id for in-page anchor linking. */
  id?: string | undefined;
  className?: string | undefined;
}

export function Section({
  eyebrow,
  title,
  lead,
  children,
  variant = 'default',
  as = 'h2',
  narrow = false,
  id,
  className,
}: SectionProps) {
  const Heading = as;
  return (
    <section
      id={id}
      className={`${styles.section} ${variant === 'tinted' ? styles.tinted : ''} ${className ?? ''}`}
    >
      <div className={`${styles.inner} ${narrow ? styles.narrow : ''}`}>
        {(eyebrow || title || lead) && (
          <header className={styles.head}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <Heading className={as === 'h1' ? styles.hero : styles.title}>{title}</Heading>}
            {lead && <p className={styles.lead}>{lead}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
