import { X, Check } from 'lucide-react';
import { Section } from '../../shared/components/ui';
import { useI18n } from '../../shared/i18n';
import styles from './OnePlaceSection.module.css';

/**
 * Anti-fragmentation pitch. Two columns: the messy 5-8 service stack
 * a typical learner stitches together vs. FrenchUp as one app. Replaces
 * the earlier "external resources" section — confidence comes from
 * scope, not from sending users away.
 */
export function OnePlaceSection() {
  const { t } = useI18n();
  const o = t.landing.onePlace;

  return (
    <Section eyebrow={o.eyebrow} title={o.title} lead={o.lead}>
      <div className={styles.grid}>
        <div className={`${styles.column} ${styles.messy}`}>
          <h3 className={styles.colTitle}>{o.messy.title}</h3>
          <ul className={styles.list}>
            {(o.messy.items as ReadonlyArray<{ name: string; role: string }>).map((item) => (
              <li key={item.name} className={styles.itemMessy}>
                <span className={styles.markMessy}><X size={14} /></span>
                <div className={styles.itemBody}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemRole}>{item.role}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.column} ${styles.clean}`}>
          <h3 className={styles.colTitle}>{o.clean.title}</h3>
          <p className={styles.tagline}>{o.clean.tagline}</p>
          <ul className={styles.list}>
            {(o.clean.items as readonly string[]).map((item) => (
              <li key={item} className={styles.itemClean}>
                <span className={styles.markClean}><Check size={14} /></span>
                <span className={styles.itemName}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
