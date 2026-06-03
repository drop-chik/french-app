import { ArrowRight, Target, Plane, Briefcase } from 'lucide-react';
import { Section, Action, Pill } from '../../shared/components/ui';
import { useI18n } from '../../shared/i18n';
import styles from './OutcomeSection.module.css';

const ICONS = [Target, Plane, Briefcase];

/**
 * Three outcome cards under the hero. SavoirX-style: instead of "we
 * teach French", ask the user which specific goal they're chasing.
 * Each card → /level/{X} (chunk 3) for a focused next step.
 */
export function OutcomeSection() {
  const { t } = useI18n();
  const o = t.landing.outcomes;

  return (
    <Section eyebrow={o.eyebrow} title={o.title} lead={o.lead} variant="tinted">
      <div className={styles.grid}>
        {(o.cards as ReadonlyArray<{
          tag: string; title: string; body: string; cta: string; to: string;
        }>).map((card, i) => {
          const Icon = ICONS[i] ?? Target;
          return (
            <article key={card.title} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}><Icon size={20} /></span>
                <Pill tone="brand">{card.tag}</Pill>
              </div>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardBody}>{card.body}</p>
              <Action to={card.to} variant="ghost" icon={<ArrowRight size={16} />}>
                {card.cta}
              </Action>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
