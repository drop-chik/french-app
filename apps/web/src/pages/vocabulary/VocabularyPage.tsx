import { useState } from 'react';
import type React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { wordsApi } from '../../features/words/api';
import { profileApi } from '../../features/profile/api';
import { useI18n } from '../../shared/i18n';
import { FlashcardMode } from './FlashcardMode/FlashcardMode';
import { MultipleChoiceMode } from './MultipleChoiceMode/MultipleChoiceMode';
import { SpellingMode } from './SpellingMode/SpellingMode';
import { MatchingMode } from './MatchingMode/MatchingMode';
import { FillBlankMode } from './FillBlankMode/FillBlankMode';
import { SpeedRoundMode } from './SpeedRoundMode/SpeedRoundMode';
import { ContextBuilderMode } from './ContextBuilderMode/ContextBuilderMode';
import { ListeningRecallMode } from './ListeningRecallMode/ListeningRecallMode';
import { SmartSessionMode } from './SmartSessionMode/SmartSessionMode';
import { SessionComplete } from './SessionComplete/SessionComplete';
import type { SessionResult } from './FlashcardMode/FlashcardMode';
import styles from './VocabularyPage.module.css';

type ActiveMode =
  | 'menu'
  | 'smart'
  | 'flashcard'
  | 'multiple-choice'
  | 'spelling'
  | 'matching'
  | 'fill-blank'
  | 'speed-round'
  | 'context-builder'
  | 'listening-recall'
  | 'complete';

const MODE_IDS = [
  { id: 'flashcard', icon: '🃏', ready: true },
  { id: 'multiple-choice', icon: '✅', ready: true },
  { id: 'spelling', icon: '✏️', ready: true },
  { id: 'matching', icon: '🔗', ready: true },
  { id: 'fill-blank', icon: '📝', ready: true },
  { id: 'speed-round', icon: '⚡', ready: true },
  { id: 'context-builder', icon: '🧩', ready: true },
  { id: 'listening-recall', icon: '👂', ready: true },
] as const;

export function VocabularyPage() {
  const [activeMode, setActiveMode] = useState<ActiveMode>('menu');
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { t, lang } = useI18n();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['words-session', lang],
    queryFn: () => wordsApi.getSession(),
    staleTime: 0,
  });

  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: profileApi.getStreak,
    staleTime: 5 * 60 * 1000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: profileApi.getStats,
    staleTime: 5 * 60 * 1000,
  });

  const words = data?.words ?? [];
  const dueCount = words.filter(
    (w) => w.progress && ['learning', 'review', 'mastered'].includes(w.progress.status),
  ).length;
  const newCount = words.filter((w) => !w.progress || w.progress.status === 'new').length;
  const masteredTotal = statsData?.words.mastered ?? 0;
  const streak = streakData?.streak ?? 0;
  const estimatedMin = Math.max(5, Math.ceil(words.length * 0.6));

  function handleComplete(results: SessionResult[]) {
    setSessionResults(results);
    setActiveMode('complete');
  }

  function handleRestart() {
    refetch();
    setActiveMode('menu');
  }

  function withBack(node: React.ReactNode) {
    return (
      <div className={styles.modeContainer}>
        <button className={styles.backBtn} onClick={() => setActiveMode('menu')}>{t.vocabulary.back}</button>
        {node}
      </div>
    );
  }

  // — режимы —
  if (activeMode === 'smart' && words.length > 0) {
    return withBack(<SmartSessionMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'flashcard' && words.length > 0) {
    return withBack(<FlashcardMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'multiple-choice' && words.length > 0) {
    return withBack(<MultipleChoiceMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'spelling' && words.length > 0) {
    return withBack(<SpellingMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'matching' && words.length > 0) {
    return withBack(<MatchingMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'fill-blank' && words.length > 0) {
    return withBack(<FillBlankMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'speed-round' && words.length > 0) {
    return withBack(<SpeedRoundMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'context-builder' && words.length > 0) {
    return withBack(<ContextBuilderMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'listening-recall' && words.length > 0) {
    return withBack(<ListeningRecallMode words={words} onComplete={handleComplete} />);
  }
  if (activeMode === 'complete') {
    return (
      <SessionComplete
        results={sessionResults}
        onRestart={handleRestart}
        onBack={() => setActiveMode('menu')}
      />
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t.vocabulary.title}</h1>
        {streak > 0 && (
          <div className={styles.streak}>
            <span className={styles.streakFire}>🔥</span>
            <span className={styles.streakText}>{streak} {t.vocabulary.streakLabel}</span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {!isLoading && !error && (
        <div className={styles.statsBar}>
          <div className={styles.statPill}>
            <span className={styles.statValue}>{dueCount}</span>
            <span className={styles.statLabel}>{t.vocabulary.dueCount}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statPill}>
            <span className={styles.statValue}>{newCount}</span>
            <span className={styles.statLabel}>{t.vocabulary.newCount}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statPill}>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>{masteredTotal}</span>
            <span className={styles.statLabel}>{t.vocabulary.masteredCount}</span>
          </div>
        </div>
      )}

      {isLoading && <p className={styles.loading}>{t.vocabulary.loading}</p>}
      {error && <p className={styles.error}>{t.vocabulary.errorLoad}</p>}

      {/* CTA — primary action */}
      {!isLoading && !error && words.length > 0 && (
        <button className={styles.startBtn} onClick={() => setActiveMode('smart')}>
          <Play size={18} className={styles.startBtnIcon} />
          <span>
            {t.vocabulary.startSession}
            <span className={styles.startBtnMeta}>
              {words.length} {lang === 'ru' ? 'слов' : 'words'} · ~{estimatedMin} {lang === 'ru' ? 'мин' : 'min'}
            </span>
          </span>
        </button>
      )}

      {!isLoading && !error && words.length === 0 && (
        <div className={styles.allDoneBanner}>{t.vocabulary.allDone}</div>
      )}

      {/* Divider */}
      {!isLoading && (
        <>
          <div className={styles.divider}>
            <span>{t.vocabulary.practiceLabel}</span>
          </div>

          <div className={styles.modes}>
            {MODE_IDS.map((mode) => {
              const modeT = t.vocabulary.modes[mode.id as keyof typeof t.vocabulary.modes];
              const isDisabled = !mode.ready || words.length === 0;
              return (
                <button
                  key={mode.id}
                  className={`${styles.modeCard} ${isDisabled ? styles.modeCardDisabled : ''}`}
                  onClick={() => !isDisabled && setActiveMode(mode.id as ActiveMode)}
                  disabled={isDisabled}
                >
                  <span className={styles.modeIcon}>{mode.icon}</span>
                  <span className={styles.modeName}>{modeT.name}</span>
                  <span className={styles.modeDesc}>{modeT.description}</span>
                  {!mode.ready && <span className={styles.soon}>{t.vocabulary.soon}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
