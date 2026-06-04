import { useState, useMemo, useEffect, useRef } from 'react';
import type React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { calculateNextReview, getStatus, createCard, orderByFrequency } from '@french-app/srs-engine';
import type { SRSGrade } from '@french-app/srs-engine';
import { Play, CheckCircle, ChevronDown, ChevronUp, Check, Flame, RefreshCw, Sparkles, Settings, X as XIcon } from 'lucide-react';
import { wordsApi } from '../../features/words/api';
import { profileApi } from '../../features/profile/api';
import { conversationApi } from '../../features/conversation/api';
import { useAuthStore } from '../../features/auth/authStore';
import { grammarApi } from '../../features/grammar/api';
import { useI18n } from '../../shared/i18n';
import { useVocabSessionRecovery } from '../../features/vocabulary/useSessionRecovery';
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
import { AdaptiveLearnFlow } from './AdaptiveLearnFlow/AdaptiveLearnFlow';
import { SessionComplete } from './SessionComplete/SessionComplete';
import type { SessionResult } from './FlashcardMode/FlashcardMode';
import { LevelTierGrid } from './LevelTierGrid';
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

// SVG progress ring — used inside the hero card. percent 0-100. The unfilled
// arc is a soft grey; the filled portion uses the brand gradient (or whatever
// `color` is set to).
function ProgressRing({
  percent,
  size = 104,
  stroke = 8,
  color,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string | undefined;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="vocabRingGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? 'url(#vocabRingGrad)'}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className={styles.ringInner}>{children}</div>
    </div>
  );
}

// Russian: Mon→Sun in order, indexed by JS getDay() (0=Sun, 1=Mon, ..., 6=Sat).
const WEEKDAY_LETTER_RU = ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'] as const;

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

// ─────────────────────────────────────────────────────────────────────────────
// Compact session-size settings popover triggered by the gear icon in the
// Vocabulary page header. Edits the same dailyNewWordsLimit /
// dailyDueWordsLimit fields as before — just no longer buried inside Profile.
// Closes on outside-click / Escape.
// ─────────────────────────────────────────────────────────────────────────────
function SessionSettingsPopover({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 60_000,
  });

  const [newLimit, setNewLimit] = useState<number>(5);
  const [dueLimit, setDueLimit] = useState<number>(5);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNewLimit(profile.dailyNewWordsLimit ?? 5);
      setDueLimit(profile.dailyDueWordsLimit ?? 5);
    }
  }, [profile]);

  // Close on outside-click and Escape.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: () => profileApi.updateProfile({ dailyNewWordsLimit: newLimit, dailyDueWordsLimit: dueLimit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['words-session'] });
      setMsg(t.profile.saved);
      setTimeout(() => { setMsg(null); onClose(); }, 1200);
    },
  });

  return (
    <div className={styles.settingsPopover} ref={ref}>
      <div className={styles.settingsPopoverHeader}>
        <span className={styles.settingsPopoverTitle}>{t.profile.sessionTitle}</span>
        <button type="button" className={styles.settingsPopoverClose} onClick={onClose} aria-label="Close">
          <XIcon size={14} />
        </button>
      </div>
      <p className={styles.settingsPopoverHint}>{t.profile.sessionDesc}</p>
      <form
        className={styles.settingsPopoverForm}
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      >
        <label className={styles.settingsPopoverField}>
          <span className={styles.settingsPopoverLabel}>{t.profile.dailyNewWords}</span>
          <input
            type="number"
            min={1}
            max={50}
            value={newLimit}
            onChange={(e) => setNewLimit(parseInt(e.target.value, 10) || 5)}
            className={styles.settingsPopoverInput}
          />
        </label>
        <label className={styles.settingsPopoverField}>
          <span className={styles.settingsPopoverLabel}>{t.profile.dailyDueWords}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={dueLimit}
            onChange={(e) => setDueLimit(parseInt(e.target.value, 10) || 5)}
            className={styles.settingsPopoverInput}
          />
        </label>
        {msg && <p className={styles.settingsPopoverMsg}>{msg}</p>}
        <button
          type="submit"
          className={styles.settingsPopoverSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? t.common.loading : t.profile.saveChanges}
        </button>
      </form>
    </div>
  );
}

export function VocabularyPage() {
  const [activeMode, setActiveMode] = useState<ActiveMode>('menu');
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  // Lightweight resume-prompt — see useSessionRecovery for design notes.
  const { snapshot: recoverySnap, recordModeStart, dismissBanner } = useVocabSessionRecovery();

  // Mirror activeMode into localStorage. The hook decides whether the value
  // is worth keeping (non-menu/complete) or to wipe (menu/complete reached).
  useEffect(() => {
    recordModeStart(activeMode);
  }, [activeMode, recordModeStart]);
  // Other-modes accordion — collapsed by default. Most users just want to
  // hit "Начать занятие" and not pick between 8 modes themselves.
  const [showOtherModes, setShowOtherModes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  // Per-CEFR-level progress, drives the new tier grid below the hero.
  const { data: levelsProgress } = useQuery({
    queryKey: ['levels-progress'],
    queryFn: profileApi.getLevelsProgress,
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

  // Bridge from the SessionComplete screen → AI conversation. Creates a
  // primed session: server seeds the AI's opening turn with 2-3 of the
  // just-studied words so the user lands on a chat that's already in motion.
  // On failure, falls back to the regular topic-picker page.
  async function handleStartConversation() {
    const justLearned = sessionWords.slice(0, 8).map((w) => ({
      french: w.french,
      translation: w.translation,
    }));
    if (justLearned.length === 0) {
      navigate({ to: '/conversation' });
      return;
    }
    try {
      const userLevel = useAuthStore.getState().user?.level ?? sessionWords[0]?.level ?? 'B1';
      const { session } = await conversationApi.createSessionWithPrimer({
        words: justLearned,
        level: userLevel,
      });
      queryClient.invalidateQueries({ queryKey: ['conversation-sessions'] });
      navigate({ to: '/conversation', search: { session: session.id } as never });
    } catch (err) {
      console.error('Failed to start primed conversation:', err);
      navigate({ to: '/conversation' });
    }
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
  // 'smart' теперь использует AdaptiveLearnFlow — четыре стадии (Intro → MC →
  // Cloze → Spell) с растущими интервалами Pimsleur, финальный speed-mix.
  // Старый SmartLearnFlow остаётся в репо как fallback для отладки.
  if (activeMode === 'smart' && sessionWords.length > 0) {
    void SmartLearnFlow;     // legacy fallback — kept imported but unused
    void SmartSessionMode;   // even older fallback
    return withBack(<AdaptiveLearnFlow words={sessionWords} onComplete={handleComplete} />);
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
        onConversation={() => void handleStartConversation()}
      />
    );
  }

  // Long-term progress visual for the hero ring. Uses "% of session words
  // already mastered" as a rough proxy — grows as the user advances through
  // the level. When today is done, the ring is fully green.
  const sessionMastered = sessionWords.filter((w) => w.progress?.status === 'mastered').length;
  const ringPercent = todayCompleted
    ? 100
    : sessionWords.length > 0
      ? Math.round((sessionMastered / sessionWords.length) * 100)
      : 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t.vocabulary.title}</h1>
        {!isLoading && masteredTotal > 0 && (
          <span className={styles.headerSub}>
            <Sparkles size={12} /> {masteredTotal} {t.vocabulary.masteredCount}
          </span>
        )}
        <div className={styles.headerSpacer} />
        <div className={styles.settingsWrap}>
          <button
            type="button"
            className={styles.settingsBtn}
            onClick={() => setShowSettings((v) => !v)}
            aria-label={t.profile.sessionTitle}
            title={t.profile.sessionTitle}
          >
            <Settings size={16} />
          </button>
          {showSettings && (
            <SessionSettingsPopover onClose={() => setShowSettings(false)} />
          )}
        </div>
      </div>

      {/* Resume-session banner — visible only when there's a recent
          unfinished session AND user is back at the menu. Hidden once they
          enter any mode (so it doesn't haunt the in-session view).
          Continue button hops straight into Smart Session — the SRS planner
          re-surfaces what was due, no data loss. */}
      {recoverySnap && activeMode === 'menu' && !isLoading && (
        <div className={styles.resumeBanner}>
          <div className={styles.resumeBannerText}>
            <strong>{t.vocabulary.resumeTitle}</strong>
            <span>{t.vocabulary.resumeBody.replace('{n}', String(recoverySnap.minutesAgo))}</span>
          </div>
          <div className={styles.resumeBannerActions}>
            <button
              type="button"
              className={styles.resumeBtnPrimary}
              onClick={() => setActiveMode('smart')}
            >
              {t.vocabulary.resumeContinue}
            </button>
            <button
              type="button"
              className={styles.resumeBtnGhost}
              onClick={dismissBanner}
              aria-label={t.vocabulary.resumeDismiss}
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className={styles.loading}>{t.vocabulary.loading}</p>}
      {error && <p className={styles.error}>{t.vocabulary.errorLoad}</p>}

      {/* Hero "Today" card — replaces the old stats bar + standalone CTA.
          A progress ring shows how far the user is through their current
          session pool; the right side shows what awaits + a single CTA. */}
      {!isLoading && !error && sessionWords.length > 0 && (
        <div className={`${styles.hero} ${todayCompleted ? styles.heroDone : ''}`} data-tour="session-progress">
          <ProgressRing
            percent={ringPercent}
            color={todayCompleted ? 'var(--color-success)' : undefined}
          >
            {todayCompleted ? (
              <Check size={32} strokeWidth={3} className={styles.ringDoneIcon} />
            ) : (
              <>
                <span className={styles.ringBigNum}>{sessionWords.length}</span>
                <span className={styles.ringBigSub}>{t.vocabulary.wordsShort}</span>
              </>
            )}
          </ProgressRing>

          <div className={styles.heroBody}>
            <span className={styles.heroEyebrow}>
              {todayCompleted ? t.vocabulary.streakDone : t.vocabulary.weekTitle}
            </span>
            <h2 className={styles.heroTitle}>
              {todayCompleted
                ? t.vocabulary.allDone
                : `~${estimatedMin} ${t.vocabulary.minShort}`}
            </h2>
            <div className={styles.heroMeta}>
              {dueCount > 0 && (
                <span className={styles.heroMetaItem}>
                  <RefreshCw size={12} /> {dueCount} {t.vocabulary.dueCount}
                </span>
              )}
              {newCount > 0 && (
                <span className={styles.heroMetaItem}>
                  <Sparkles size={12} /> {newCount} {t.vocabulary.newCount}
                </span>
              )}
            </div>
            <button
              className={`${styles.heroCta} ${todayCompleted ? styles.heroCtaDone : ''}`}
              onClick={() => setActiveMode('smart')}
            >
              {todayCompleted ? <CheckCircle size={18} /> : <Play size={18} />}
              <span>
                {statusFilter
                  ? t.dictionary.status[statusFilter as keyof typeof t.dictionary.status] ?? t.vocabulary.startSession
                  : todayCompleted
                  ? t.vocabulary.practiceMore
                  : t.vocabulary.startSession}
              </span>
            </button>
          </div>
        </div>
      )}

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

      {!isLoading && !error && sessionWords.length === 0 && words.length === 0 && (
        <div className={styles.allDoneCard}>
          <div className={styles.allDoneEmoji}>🎉</div>
          <p className={styles.allDoneTitle}>
            {grammarTag ? t.vocabulary.tagEmpty : t.vocabulary.allDone}
          </p>
        </div>
      )}

      {!isLoading && !error && sessionWords.length === 0 && words.length > 0 && statusFilter && (
        <div className={styles.allDoneCard}>
          <p className={styles.allDoneTitle}>{t.dictionary.noWords}</p>
        </div>
      )}

      {/* SavoirX-style tier grid — primary navigation across CEFR levels.
          Renders only on the menu screen; in-session views hide it so the
          user isn't tempted to bail mid-session. */}
      {!isLoading && activeMode === 'menu' && levelsProgress && levelsProgress.levels.length > 0 && (
        <LevelTierGrid
          levels={levelsProgress.levels}
          currentLevel={useAuthStore.getState().user?.level ?? 'B1'}
        />
      )}

      {/* Streak card — flame + 7-day dots. Replaces the old separate weekBlock
          and the streak pill that lived inside the stats bar. */}
      {!isLoading && (streak > 0 || weekTotal > 0) && (
        <div className={styles.streakCard}>
          <div className={styles.streakHead}>
            <div className={`${styles.streakFlame} ${todayCompleted ? styles.streakFlameOn : ''}`}>
              <Flame size={22} />
            </div>
            <div className={styles.streakHeadText}>
              <span className={styles.streakNumber}>
                {streak}
                <span className={styles.streakNumberLabel}> {t.vocabulary.streakLabel}</span>
              </span>
              {weekTotal > 0 && (
                <span className={styles.streakSub}>
                  {weekDaysActive}/7 {t.vocabulary.weekStatsDays} · {weekTotal} {t.vocabulary.weekStatsWords}
                </span>
              )}
            </div>
          </div>
          <div className={styles.weekDots}>
            {weekActivity.map((d) => {
              const dayLetter = WEEKDAY_LETTER_RU[new Date(d.date).getDay()];
              const intensity = d.reviewed === 0
                ? 0
                : Math.min(1, d.reviewed / Math.max(weekMax, 1));
              return (
                <div
                  key={d.date}
                  className={`${styles.weekDot} ${d.isToday ? styles.weekDotToday : ''} ${d.reviewed > 0 ? styles.weekDotActive : ''}`}
                  title={`${d.date}: ${d.reviewed}`}
                  style={d.reviewed > 0 ? { opacity: 0.4 + intensity * 0.6 } : undefined}
                >
                  <span className={styles.weekDotInner} />
                  <span className={styles.weekDotLabel}>{dayLetter}</span>
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
