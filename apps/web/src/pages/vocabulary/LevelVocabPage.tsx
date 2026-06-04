import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Sparkles, Target, RefreshCw, CheckCircle2 } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { Pill } from '../../shared/components/ui';
import { LEVEL_DATA, type Level } from '../level/levelData';
import { WordList } from './WordList';
import { NewWordsPreview } from './NewWordsPreview';
import styles from './LevelVocabPage.module.css';

/**
 * Inside-level vocabulary view — what the user lands on when they click
 * a CEFR card on /vocabulary. SavoirX-style layout:
 *
 *   ← back
 *   ┌──────────────────────────────────────────────┐
 *   │  YOUR PROGRESS         [LEVEL]               │
 *   │  ┌──┬──┬──┬──┐         Beginner              │
 *   │  │N │N │N │N │         1000 words            │
 *   │  └──┴──┴──┴──┘                               │
 *   │                        ▶ Start smart practice│
 *   │                        secondary buttons     │
 *   └──────────────────────────────────────────────┘
 *
 * Stage 2a (this commit): the hero card + stats + CTA. Word list
 * lives below — added in stage 2b.
 */
export function LevelVocabPage() {
  const { level: rawLevel } = useParams({ from: '/_auth/vocabulary_/level/$level' });
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const userLevel = useAuthStore((s) => s.user?.level);
  const [showPreview, setShowPreview] = useState(false);

  const level = (rawLevel ?? '').toUpperCase() as Level;
  const data = LEVEL_DATA[level];
  const tn = t.levelVocab as {
    back: string;
    eyebrow: string;
    learned: string;
    mastered: string;
    remaining: string;
    target: string;
    cta: string;
    ctaNew: string;
    ctaBrowse: string;
    notFound: string;
    recommended: string;
    yourProgress: string;
  };
  const tierNames = t.vocabulary.tierNames as Record<Level, string>;

  const { data: levelsProgress } = useQuery({
    queryKey: ['levels-progress'],
    queryFn: profileApi.getLevelsProgress,
    staleTime: 5 * 60 * 1000,
  });

  if (!data) {
    return (
      <div className={styles.notFound}>
        <p>{tn.notFound}</p>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate({ to: '/vocabulary' })}>
          {tn.back}
        </button>
      </div>
    );
  }

  const myProgress = levelsProgress?.levels?.find((l) => l.level === level);
  const target   = myProgress?.targetWords ?? data.targetWords;
  const learned  = myProgress?.learnedWords ?? 0;
  const mastered = myProgress?.masteredWords ?? 0;
  const remaining = Math.max(0, target - learned);
  const pct = target > 0 ? Math.min(Math.round((learned / target) * 100), 100) : 0;

  const isCurrent = level === (userLevel ?? '').toUpperCase();
  const name = lang === 'ru' ? data.nameRu : data.nameEn;

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.back}
        onClick={() => navigate({ to: '/vocabulary' })}
      >
        <ArrowLeft size={16} /> {tn.back}
      </button>

      <article className={`${styles.hero} ${styles[`hero${level}`]}`}>
        <div className={styles.heroLeft}>
          <span className={styles.heroEyebrow}>{tn.yourProgress}</span>
          <div className={styles.statsGrid}>
            <StatCard icon={<RefreshCw size={14} />} label={tn.learned}   value={learned}   tone="brand" />
            <StatCard icon={<Sparkles size={14} />}  label={tn.mastered}  value={mastered}  tone="success" />
            <StatCard icon={<Target size={14} />}    label={tn.remaining} value={remaining} tone="neutral" />
            <StatCard icon={<CheckCircle2 size={14} />} label={tn.target} value={target}    tone="neutral" />
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={styles.heroRight}>
          <Pill tone="level" level={level}>{level}</Pill>
          <h1 className={styles.heroTitle}>{tierNames[level]}</h1>
          <p className={styles.heroSub}>
            {target.toLocaleString('ru-RU')} {t.vocabulary.tier.wordsSuffix}
          </p>

          {isCurrent && remaining > 0 && (
            <p className={styles.recommendedHint}>
              <span className={styles.recommendedLabel}>{tn.recommended}</span>
              <span className={styles.recommendedValue}>{remaining}</span>
            </p>
          )}

          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => navigate({ to: '/vocabulary', search: { startSmart: '1', level } })}
          >
            {tn.cta} <ArrowRight size={16} />
          </button>

          <div className={styles.ctaSecondaryRow}>
            <button type="button" className={styles.ctaSecondary} onClick={() => setShowPreview(true)}>
              <Sparkles size={14} /> {tn.ctaNew}
            </button>
            <button type="button" className={styles.ctaSecondary} onClick={() => navigate({ to: '/dictionary' })}>
              <Target size={14} /> {tn.ctaBrowse}
            </button>
          </div>
        </div>
      </article>

      <WordList level={level} />

      {showPreview && (
        <NewWordsPreview
          level={level}
          onClose={() => setShowPreview(false)}
          onStartQuiz={() => {
            setShowPreview(false);
            navigate({ to: '/vocabulary', search: { startSmart: '1', level } });
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'brand' | 'success' | 'neutral';
}

function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <div className={`${styles.stat} ${styles[`stat${tone[0]!.toUpperCase()}${tone.slice(1)}`]}`}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value.toLocaleString('ru-RU')}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
