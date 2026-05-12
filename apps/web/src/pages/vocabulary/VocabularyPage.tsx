import { useState, useMemo } from 'react';
import type React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { calculateNextReview, getStatus, createCard, orderByFrequency } from '@french-app/srs-engine';
import type { SRSGrade } from '@french-app/srs-engine';
import { Play, CheckCircle, ChevronDown, ChevronUp, History } from 'lucide-react';
import { wordsApi } from '../../features/words/api';
import { profileApi } from '../../features/profile/api';
import { grammarApi } from '../../features/grammar/api';
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
import { SmartLearnFlow } from './SmartLearnFlow/SmartLearnFlow';
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
  // Other-modes accordion — collapsed by default. Most users just want to
  // hit "Начать занятие" and not pick between 8 modes themselves.
  const [showOtherModes, setShowOtherModes] = useState(false);
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // filter=learning|review|mastered comes from Dictionary "Повторить" button
  // tag=… is a grammar topic slug (e.g. "verbes-pronominaux")
  // category=… is a vocabulary category (e.g. "food", "verbs_basic")
  const search = useSearch({ strict: false }) as { filter?: string; tag?: string; category?: string };
  const statusFilter = search.filter as string | undefined;
  const grammarTag = search.tag as string | undefined;
  const category = search.category as string | undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: grammarTag
      ? ['words-by-tag', grammarTag, lang]
      : category
        ? ['words-by-category', category, lang]
        : ['words-session', lang],
    queryFn: () => {
      if (grammarTag) return wordsApi.getByGrammarTag(grammarTag);
      if (category) return wordsApi.getByCategory(category);
      return wordsApi.getSession();
    },
    staleTime: 0,
  });

  // When arrived via /vocabulary?tag=… fetch the grammar topic title so the
  // banner shows a human-readable name instead of the raw slug.
  const { data: topicData } = useQuery({
    queryKey: ['grammar-topic-meta', grammarTag, lang],
    queryFn: () => grammarApi.getTopic(grammarTag as string),
    enabled: !!grammarTag,
    staleTime: 10 * 60 * 1000,
  });
  const tagTitle = topicData?.topic.title ?? grammarTag ?? '';
  const tagTitleFr = topicData?.topic.titleFr ?? '';

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

  // Last-7-days activity for the weekly summary block at the bottom of the
  // page. Reuses the existing /profile/charts endpoint (TanStack Query dedupes
  // with the Profile page's call, so no extra request when both open).
  const { data: chartsData } = useQuery({
    queryKey: ['profile-charts'],
    queryFn: profileApi.getCharts,
    staleTime: 5 * 60 * 1000,
  });

  // Build 7-day rolling window — pad missing days with zeros so the bar chart
  // always has 7 bars.
  const weekActivity = useMemo(() => {
    const map = new Map<string, { reviewed: number; correct: number; incorrect: number }>();
    for (const day of chartsData?.activity ?? []) {
      map.set(day.date, { reviewed: day.reviewed, correct: day.correct, incorrect: day.incorrect });
    }
    const days: Array<{ date: string; reviewed: number; isToday: boolean }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = map.get(key);
      days.push({ date: key, reviewed: entry?.reviewed ?? 0, isToday: i === 0 });
    }
    return days;
  }, [chartsData]);

  const weekTotal = weekActivity.reduce((s, d) => s + d.reviewed, 0);
  const weekDaysActive = weekActivity.filter((d) => d.reviewed > 0).length;
  const weekMax = Math.max(1, ...weekActivity.map((d) => d.reviewed));

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

  // If coming from Dictionary with a status filter, only show those words.
  // useMemo so we don't reshuffle on every render (which would visibly reorder
  // the cards while a session is open). Re-shuffle only when the underlying
  // data or filter changes.
  const sessionWords = useMemo(() => {
    const filtered = statusFilter
      ? words.filter((w) => w.progress?.status === statusFilter)
      : words;
    return orderByFrequency(filtered);
  }, [words, statusFilter]);

  const estimatedMin = Math.max(5, Math.ceil(sessionWords.length * 0.6));

  function handleComplete(rawResults: SessionResult[]) {
    const enriched: SessionResult[] = rawResults.map((r) => {
      const word = sessionWords.find((w) => w.id === r.wordId);
      if (!word) return r;
      const prevStatus = word.progress?.status ?? 'new';
      const card = word.progress
        ? {
            easinessFactor: Number(word.progress.easinessFactor),
            interval: word.progress.interval,
            repetitions: word.progress.repetitions,
            nextReview: new Date(word.progress.nextReview),
          }
        : createCard();
      const srsResult = calculateNextReview(card, r.grade as SRSGrade);
      const newStatus = getStatus(srsResult);
      return { ...r, prevStatus, newStatus };
    });
    setSessionResults(enriched);
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
  // 'smart' uses the new interleaved multi-stage flow (Intro → MC → Spelling
  // per word). The old SmartSessionMode is kept for callers that select it
  // explicitly elsewhere — not used from this page anymore.
  if (activeMode === 'smart' && sessionWords.length > 0) {
    void SmartSessionMode; // keep import referenced
    return withBack(<SmartLearnFlow words={sessionWords} onComplete={handleComplete} />);
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

      {/* Grammar-tag filter banner — shown when arrived from a grammar topic */}
      {grammarTag && (
        <div className={styles.tagBanner}>
          <div className={styles.tagBannerInfo}>
            <span className={styles.tagBannerLabel}>{t.vocabulary.tagFilterLabel}</span>
            <span className={styles.tagBannerTitle}>{tagTitle}</span>
            {tagTitleFr && <span className={styles.tagBannerFr}>{tagTitleFr}</span>}
          </div>
          <button
            type="button"
            className={styles.tagBannerClear}
            onClick={() => navigate({ to: '/grammar/$slug', params: { slug: grammarTag } })}
          >
            {t.vocabulary.tagFilterBack}
          </button>
        </div>
      )}

      {/* Category filter banner — shown when arrived from the Dictionary drawer */}
      {category && !grammarTag && (
        <div className={styles.tagBanner}>
          <div className={styles.tagBannerInfo}>
            <span className={styles.tagBannerLabel}>{t.vocabulary.categoryFilterLabel}</span>
            <span className={styles.tagBannerTitle}>
              {((t.dictionary.categoryNames as Record<string, string>)[category]) ?? category}
            </span>
          </div>
          <button
            type="button"
            className={styles.tagBannerClear}
            onClick={() => navigate({ to: '/dictionary' })}
          >
            {t.vocabulary.categoryFilterBack}
          </button>
        </div>
      )}

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
        <div className={styles.allDoneBanner}>
          {grammarTag ? t.vocabulary.tagEmpty : t.vocabulary.allDone}
        </div>
      )}

      {!isLoading && !error && sessionWords.length === 0 && words.length > 0 && statusFilter && (
        <div className={styles.allDoneBanner}>{t.dictionary.noWords}</div>
      )}

      {/* Weekly history — small bar chart + 2-stat strip showing how the user
          did over the last 7 days. Hidden when there's been zero activity. */}
      {!isLoading && weekTotal > 0 && (
        <div className={styles.weekBlock}>
          <div className={styles.weekHeader}>
            <History size={14} className={styles.weekIcon} />
            <span className={styles.weekTitle}>{t.vocabulary.weekTitle}</span>
            <span className={styles.weekStats}>
              <strong>{weekTotal}</strong> {t.vocabulary.weekStatsWords}
              <span className={styles.weekStatsSep}>·</span>
              <strong>{weekDaysActive}</strong> {t.vocabulary.weekStatsDays}
            </span>
          </div>
          <div className={styles.weekBars}>
            {weekActivity.map((d) => {
              const heightPct = d.reviewed > 0 ? Math.max(8, (d.reviewed / weekMax) * 100) : 4;
              return (
                <div
                  key={d.date}
                  className={`${styles.weekBar} ${d.isToday ? styles.weekBarToday : ''} ${d.reviewed > 0 ? styles.weekBarActive : ''}`}
                  title={`${d.date}: ${d.reviewed}`}
                >
                  <div className={styles.weekBarFill} style={{ height: `${heightPct}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other modes — collapsed by default. Power-users can expand to pick
          a specific mode (Spelling only, Speed-round only, etc.). Most users
          should just use the smart session. */}
      {!isLoading && words.length > 0 && (
        <div className={styles.otherModesBlock}>
          <button
            type="button"
            className={styles.otherModesToggle}
            onClick={() => setShowOtherModes((v) => !v)}
            aria-expanded={showOtherModes}
          >
            <span>{t.vocabulary.otherModesToggle}</span>
            {showOtherModes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showOtherModes && (
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
          )}
        </div>
      )}
    </div>
  );
}
