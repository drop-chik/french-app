import { Link } from '@tanstack/react-router';
import { ArrowRight, Lock } from 'lucide-react';
import type { LevelProgressData } from '../../features/profile/api';
import { useI18n } from '../../shared/i18n';
import styles from './LevelTierGrid.module.css';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Cefr = (typeof LEVEL_ORDER)[number];

interface LevelTierGridProps {
  levels: LevelProgressData[];
  currentLevel: string;
}

/**
 * SavoirX-style vocabulary tier grid — six cards, one per CEFR level.
 * Visual language matches our existing TodayHero/dashboard pattern:
 * dark surface card with a coloured left accent bar carrying the level
 * identity, *not* a saturated rainbow background (that read as
 * plastic-toy on dark theme).
 *
 * Stage 1 (this commit) renders the cards as decorative status surfaces.
 * Stage 2 will wire the click into an in-app inside-level view; until
 * then we don't link out to /level/{X} because that jumps the user from
 * the auth layout into the public marketing page, which feels like
 * being kicked out of the app.
 */
export function LevelTierGrid({ levels, currentLevel }: LevelTierGridProps) {
  const { t } = useI18n();
  const tn = t.vocabulary.tier as {
    title: string;
    lead: string;
    currentChip: string;
    locked: string;
    wordsSuffix: string;
    learnedShort: string;
  };
  const names = t.vocabulary.tierNames as Record<Cefr, string>;
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel as Cefr);
  const byLevel = new Map(levels.map((l) => [l.level, l]));

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{tn.title}</p>
        <p className={styles.lead}>{tn.lead}</p>
      </header>

      <div className={styles.grid}>
        {LEVEL_ORDER.map((lv, i) => {
          const data = byLevel.get(lv);
          const target = data?.targetWords ?? data?.totalWords ?? 0;
          const learned = data?.learnedWords ?? 0;
          const pct = data?.percent ?? 0;
          const isCurrent = lv === currentLevel;
          const isLocked = i > currentIdx + 1;
          const body = (
            <>
              <span className={styles.accentBar} />

              <header className={styles.cardHead}>
                <span className={styles.cardLevel}>{lv}</span>
                {isCurrent && <span className={styles.currentChip}>{tn.currentChip}</span>}
                {isLocked && (
                  <span className={styles.lockChip}>
                    <Lock size={10} /> {tn.locked}
                  </span>
                )}
              </header>

              <h3 className={styles.cardTitle}>{names[lv]}</h3>

              <div className={styles.cardCount}>
                <span className={styles.cardCountValue}>{target.toLocaleString('ru-RU')}</span>
                <span className={styles.cardCountSuffix}>{tn.wordsSuffix}</span>
              </div>

              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>

              <footer className={styles.cardFoot}>
                <span className={styles.cardFootLearned}>
                  {learned.toLocaleString('ru-RU')} {tn.learnedShort}
                </span>
                <span className={styles.cardFootEnd}>
                  {pct > 0 && <span className={styles.cardFootPct}>{pct}%</span>}
                  {!isLocked && <ArrowRight size={14} className={styles.cardArrow} />}
                </span>
              </footer>
            </>
          );

          const className = [
            styles.card,
            styles[`card${lv}`],
            isCurrent ? styles.cardCurrent : '',
            isLocked ? styles.cardLocked : '',
          ].filter(Boolean).join(' ');

          if (isLocked) {
            return <div key={lv} className={className} aria-disabled="true">{body}</div>;
          }
          return (
            <Link
              key={lv}
              to="/vocabulary/level/$level"
              params={{ level: lv }}
              className={className}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
