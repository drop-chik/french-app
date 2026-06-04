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
 * SavoirX-style vocabulary tier grid — six coloured cards, one per CEFR
 * level. Each card surfaces target word count + learned + progress bar
 * with the rainbow level palette as identity colour. Replaces the flat
 * "9 modes" menu as the primary entry point: pick the level you want
 * to grind, jump in. Locked tiers (CEFR above current) render dimmed
 * so the next milestone is visible but not the default action.
 *
 * Card click currently links into the existing public `/level/{X}` page
 * for orientation. Stage-2 will swap that for an in-app vocabulary
 * inside-level view.
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
        <h2 className={styles.title}>{tn.title}</h2>
        <p className={styles.lead}>{tn.lead}</p>
      </header>

      <div className={styles.grid}>
        {LEVEL_ORDER.map((lv, i) => {
          const data = byLevel.get(lv);
          const target = data?.targetWords ?? data?.totalWords ?? 0;
          const learned = data?.learnedWords ?? 0;
          const pct = data?.percent ?? 0;
          const isCurrent = lv === currentLevel;
          const isLocked = i > currentIdx + 1; // current + next tier are open
          return (
            <Link
              key={lv}
              to="/level/$level"
              params={{ level: lv }}
              className={`${styles.card} ${styles[`card${lv}`]} ${isLocked ? styles.locked : ''}`}
              aria-disabled={isLocked || undefined}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
            >
              <header className={styles.cardHead}>
                <span className={styles.cardLevel}>{lv}</span>
                {isCurrent && <span className={styles.currentChip}>{tn.currentChip}</span>}
                {isLocked && <span className={styles.lockChip}><Lock size={12} /> {tn.locked}</span>}
              </header>

              <h3 className={styles.cardTitle}>{names[lv]}</h3>

              <div className={styles.cardCount}>
                <span className={styles.cardCountValue}>{target.toLocaleString()}</span>
                <span className={styles.cardCountSuffix}>{tn.wordsSuffix}</span>
              </div>

              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>

              <footer className={styles.cardFoot}>
                <span className={styles.cardFootLearned}>
                  {learned.toLocaleString()} {tn.learnedShort}
                </span>
                <span className={styles.cardFootArrow}>
                  {isLocked ? <Lock size={14} /> : <ArrowRight size={14} />}
                </span>
              </footer>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
