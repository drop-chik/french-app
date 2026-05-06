import { useState } from 'react';
import type React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Play, CheckCircle } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // filter=learning|review|mastered comes from Dictionary "Повторить" button
  const search = useSearch({ strict: false }) as { filter?: string };
  const statusFilter = search.filter as string | undefined;

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

  const repairMutation = useMutation({
    mutationFn: profileApi.repairStreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
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
  const todayCompleted = streakData?.todayCompleted ?? false;
  const repairAvailable = streakData?.repairAvailable ?? false;
  const savedStreak = streakData?.savedStreak ?? 0;

  // If coming from Dictionary with a status filter, only show those words
  const sessionWords = statusFilter
    ? words.filter((w) => w.progress?.status === statusFilter)
    : words;

  const estimatedMin = Math.max(5, Math.ceil(sessionWords.length * 0.6));

  function handleComplete(results: SessionResult[]) {
    setSessionResults(results);
    setActiveMode('complete');
    queryClient.invalidateQueries({ queryKey: ['streak'] });
  }

  function handleRestart() {
    refetch();
    // Clear filter when restarting from complete screen
    if (statusFilter) navigate({ to: '/vocabulary' });
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
  if (activeMode === 'smart' && sessionWords.length > 0) {
    return withBack(<SmartSessionMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'flashcard' && sessionWords.length > 0) {
    return withBack(<FlashcardMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'multiple-choice' && sessionWords.length > 0) {
    return withBack(<MultipleChoiceMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'spelling' && sessionWords.length > 0) {
    return withBack(<SpellingMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'matching' && sessionWords.length > 0) {
    return withBack(<MatchingMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'fill-blank' && sessionWords.length > 0) {
    return withBack(<FillBlankMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'speed-round' && sessionWords.length > 0) {
    return withBack(<SpeedRoundMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'context-builder' && sessionWords.length > 0) {
    return withBack(<ContextBuilderMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'listening-recall' && sessionWords.length > 0) {
    return withBack(<ListeningRecallMode words={sessionWords} onComplete={handleComplete} />);
  }
  if (activeMode === 'complete') {
    return (
      <SessionComplete
        results={sessionResults}
        streak={streak}
        onRestart={handleRestart}
        onBack={() => { setActiveMode('menu'); if (statusFilter) navigate({ to: '/vocabulary' }); }}
        onConversation={() => navigate({ to: '/conversation' })}
      />
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t.vocabulary.title}</h1>
      </div>

      {/* Stats bar */}
      {!isLoading && !error && (
        <div className={`${styles.statsBar} ${todayCompleted ? styles.statsBarDone : ''}`}>
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
          {streak > 0 && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.statPill}>
                <span className={`${styles.statValue} ${todayCompleted ? styles.statValueStreakDone : styles.statValueStreak}`}>
                  🔥 {streak}
                </span>
                <span className={styles.statLabel}>{t.vocabulary.streakLabel}</span>
              </div>
            </>
          )}
        </div>
      )}

      {isLoading && <p className={styles.loading}>{t.vocabulary.loading}</p>}
      {error && <p className={styles.error}>{t.vocabulary.errorLoad}</p>}

      {/* Streak repair banner */}
      {repairAvailable && !repairMutation.isSuccess && (
        <div className={styles.repairBanner}>
          <div className={styles.repairInfo}>
            <p className={styles.repairTitle}>{t.vocabulary.streakRepairTitle}</p>
            <p className={styles.repairDesc}>
              {t.vocabulary.streakRepairDesc.replace('{n}', String(savedStreak))}
            </p>
          </div>
          <button
            className={styles.repairBtn}
            disabled={repairMutation.isPending}
            onClick={() => repairMutation.mutate()}
          >
            {repairMutation.isPending
              ? t.vocabulary.streakRepairLoading
              : t.vocabulary.streakRepairBtn}
          </button>
        </div>
      )}
      {repairMutation.isSuccess && (
        <div className={styles.allDoneBanner}>
          {t.vocabulary.streakRepairDone.replace('{n}', String(repairMutation.data?.newStreak ?? savedStreak))}
        </div>
      )}

      {/* CTA — primary action */}
      {!isLoading && !error && sessionWords.length > 0 && (
        <button
          className={`${styles.startBtn} ${todayCompleted && !statusFilter ? styles.startBtnDone : ''}`}
          onClick={() => setActiveMode('smart')}
        >
          {todayCompleted && !statusFilter
            ? <CheckCircle size={18} className={styles.startBtnIcon} />
            : <Play size={18} className={styles.startBtnIcon} />
          }
          <span>
            {statusFilter
              ? t.dictionary.status[statusFilter as keyof typeof t.dictionary.status] ?? t.vocabulary.startSession
              : todayCompleted
              ? t.vocabulary.practiceMore
              : t.vocabulary.startSession}
            <span className={styles.startBtnMeta}>
              {sessionWords.length} {t.vocabulary.wordsShort} · ~{estimatedMin} {t.vocabulary.minShort}
            </span>
          </span>
        </button>
      )}

      {!isLoading && !error && sessionWords.length === 0 && words.length === 0 && (
        <div className={styles.allDoneBanner}>{t.vocabulary.allDone}</div>
      )}

      {!isLoading && !error && sessionWords.length === 0 && words.length > 0 && statusFilter && (
        <div className={styles.allDoneBanner}>{t.dictionary.noWords}</div>
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
