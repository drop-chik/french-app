import { Check, AlertTriangle } from 'lucide-react';
import { Section } from '../../shared/components/ui';
import { useI18n } from '../../shared/i18n';
import styles from './HonestAISection.module.css';

/**
 * "Где AI работает / где AI промахивается" — honesty-as-positioning.
 * Two columns: strengths (green ticks) + limits (amber warnings).
 * Disarms the "AI hype" skeptic before they hit pricing / signup.
 */
export function HonestAISection() {
  const { t } = useI18n();
  const h = t.landing.honestAI;

  return (
    <Section eyebrow={h.eyebrow} title={h.title} lead={h.lead}>
      <div className={styles.grid}>
        <div className={`${styles.column} ${styles.good}`}>
          <h3 className={styles.colTitle}>{h.good.title}</h3>
          <ul className={styles.list}>
            {(h.good.items as readonly string[]).map((item) => (
              <li key={item} className={styles.item}>
                <span className={styles.markGood}><Check size={14} /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.column} ${styles.limits}`}>
          <h3 className={styles.colTitle}>{h.limits.title}</h3>
          <ul className={styles.list}>
            {(h.limits.items as readonly string[]).map((item) => (
              <li key={item} className={styles.item}>
                <span className={styles.markLimit}><AlertTriangle size={14} /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
