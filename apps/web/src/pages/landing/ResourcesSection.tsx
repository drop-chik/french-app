import { ExternalLink } from 'lucide-react';
import { Section } from '../../shared/components/ui';
import { useI18n } from '../../shared/i18n';
import styles from './ResourcesSection.module.css';

/**
 * Curated external resources. SavoirX-style: linking to competitors /
 * supplements signals confidence and turns the page from a sales pitch
 * into a learner's reference.
 */
export function ResourcesSection() {
  const { t } = useI18n();
  const r = t.landing.resources;

  return (
    <Section eyebrow={r.eyebrow} title={r.title} lead={r.lead} variant="tinted" narrow>
      <ul className={styles.list}>
        {(r.items as ReadonlyArray<{ name: string; desc: string; url: string }>).map((item) => (
          <li key={item.url}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.row}>
              <span className={styles.text}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.desc}>{item.desc}</span>
              </span>
              <ExternalLink size={16} className={styles.icon} />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
