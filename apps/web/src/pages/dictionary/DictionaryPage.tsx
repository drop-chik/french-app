import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Search, X, List, LayoutGrid, BookOpen, RefreshCw, Star, ChevronRight, Plus, Check, Volume2 } from 'lucide-react';
import { wordsApi, type BrowseWord, type WordCategory } from '../../features/words/api';
import { listeningApi } from '../../features/listening/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import { WordDetailsModal } from './WordDetailsModal';
import styles from './DictionaryPage.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type Level = typeof ALL_LEVELS[number];

const PALETTE = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];
function categoryColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length] ?? PALETTE[0]!;
}

function getCategoryName(name: string, categoryNames: Record<string, string>): string {
  // Exact match
  if (categoryNames[name]) return categoryNames[name]!;

  // Progressive suffix stripping: travel_detailed_b1 → travel_detailed → travel
  const parts = name.split('_');
  for (let len = parts.length - 1; len >= 1; len--) {
    const candidate = parts.slice(0, len).join('_');
    if (categoryNames[candidate]) return categoryNames[candidate]!;
  }

  // Final fallback: capitalize each word
  return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

// Word "strength" 0-100 — visual proxy for how solid the user has the word.
// Driven by SRS status + interval. Doesn't have to match the SRS engine
// exactly; it's a UI hint, not a scientific measurement.
//
//   new       →   0
//   learning  →  25
//   review    →  50-80 (longer interval → higher, capped at 30-day interval)
//   mastered  → 100
function strengthFromProgress(p: BrowseWord['progress']): number {
  if (!p) return 0;
  if (p.status === 'mastered') return 100;
  if (p.status === 'new') return 0;
  if (p.status === 'learning') return 25;
  // review — scale 50→80 by interval (0d = 50%, 30d+ = 80%)
  const intervalBonus = Math.min(p.interval / 30, 1) * 30;
  return Math.round(50 + intervalBonus);
}

function strengthColor(strength: number): string {
  if (strength === 0) return '#9ca3af';      // grey — untouched
  if (strength < 30) return '#ef4444';        // red — fresh learning
  if (strength < 60) return '#f59e0b';        // amber — getting there
  if (strength < 85) return '#3b82f6';        // blue — solid review
  return '#22c55e';                            // green — mastered
}

// ── Status badge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string | null;
  nextReview?: string | null;
  t: Translations;
}

function StatusBadge({ status, nextReview, t }: StatusBadgeProps) {
  if (!status) return <span className={`${styles.badge} ${styles.badgeNone}`}>{t.dictionary.notStudied}</span>;

  if (status === 'mastered') return <span className={`${styles.badge} ${styles.badgeMastered}`}><Star size={10} />{t.dictionary.status.mastered}</span>;
  if (status === 'review') {
    const days = nextReview ? daysUntil(nextReview) : 0;
    const label = days <= 0 ? t.dictionary.reviewToday : days === 1 ? t.dictionary.reviewTomorrow : t.dictionary.nextReview.replace('{n}', String(days));
    return <span className={`${styles.badge} ${styles.badgeReview}`}><RefreshCw size={10} />{label}</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeLearning}`}><BookOpen size={10} />{t.dictionary.status.learning}</span>;
}

// ── Word row with action buttons ──────────────────────────────────────────────

interface WordRowProps {
  word: BrowseWord;
  t: Translations;
  onMark: (id: string, action: 'study' | 'mastered') => void;
  onOpen: (id: string) => void;
  markingId: string | null;
  showLevel?: boolean;
}

// Play a word out loud via on-demand TTS. Cached briefly to avoid hitting the
// backend repeatedly for the same word.
const ttsCache = new Map<string, string>();
async function playTts(text: string) {
  let url = ttsCache.get(text);
  if (!url) {
    try {
      const blob = await listeningApi.generateTTS(text);
      url = URL.createObjectURL(blob);
      ttsCache.set(text, url);
    } catch {
      return;
    }
  }
  new Audio(url).play().catch(() => null);
}

const LEVEL_TINT: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#f59e0b',
  B2: '#8b5cf6',
};

function WordRow({ word, t, onMark, onOpen, markingId, showLevel }: WordRowProps) {
  const status = word.progress?.status ?? null;
  const isBusy = markingId === word.id;
  const strength = strengthFromProgress(word.progress);
  const isDismissed = word.progress?.dismissed ?? false;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={styles.wordRow} onClick={() => onOpen(word.id)} role="button" tabIndex={0}>
      <button
        type="button"
        className={styles.wordAudioBtn}
        onClick={(e) => { stop(e); void playTts(word.french); }}
        title={t.dictionary.listen}
      >
        <Volume2 size={14} />
      </button>
      <div className={styles.wordInfo}>
        <span className={styles.wordFrLine}>
          <span className={styles.wordFr}>{word.french}</span>
          {showLevel && word.level && (
            <span
              className={styles.wordLevelChip}
              style={{ color: LEVEL_TINT[word.level], background: `${LEVEL_TINT[word.level]}1a` }}
            >
              {word.level}
            </span>
          )}
          {isDismissed && (
            <span className={styles.wordDismissedFlag} title={t.dictionary.dismissedLabel}>
              ✕
            </span>
          )}
        </span>
        <span className={styles.wordRu}>{word.translation}</span>
        {word.exampleFr && <span className={styles.wordEx}>{word.exampleFr}</span>}
        {/* Strength bar — visual proxy for how solid the user has the word.
            0 (grey) → red → amber → blue → green (100). Hidden for never-studied. */}
        {strength > 0 && (
          <div className={styles.wordStrengthTrack} aria-label={`${strength}%`}>
            <div
              className={styles.wordStrengthFill}
              style={{ width: `${strength}%`, background: strengthColor(strength) }}
            />
          </div>
        )}
      </div>
      <div className={styles.wordActions} onClick={stop}>
        <StatusBadge status={status} nextReview={null} t={t} />
        {status === null && (
          <>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnStudy}`}
              onClick={() => onMark(word.id, 'study')}
              disabled={isBusy}
              title={t.dictionary.markStudy}
            >
              <Plus size={13} />
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnMastered}`}
              onClick={() => onMark(word.id, 'mastered')}
              disabled={isBusy}
              title={t.dictionary.markMastered}
            >
              <Check size={13} />
            </button>
          </>
        )}
        {status !== null && status !== 'mastered' && (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnMastered}`}
            onClick={() => onMark(word.id, 'mastered')}
            disabled={isBusy}
            title={t.dictionary.markMastered}
          >
            <Check size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────

interface CategoryCardProps {
  cat: WordCategory;
  color: string;
  label: string;
  onClick: () => void;
}

function CategoryCard({ cat, color, label, onClick }: CategoryCardProps) {
  const pct = cat.count > 0 ? Math.round((cat.masteredCount / cat.count) * 100) : 0;
  return (
    <button className={styles.catCard} onClick={onClick} style={{ '--cat-color': color } as React.CSSProperties}>
      <div className={styles.catCardAccent} />
      <div className={styles.catCardBody}>
        <div className={styles.catCardTop}>
          <span className={styles.catCardName}>{label}</span>
          <ChevronRight size={14} className={styles.catCardArrow} />
        </div>
        <span className={styles.catCardCount}>{cat.count} слов</span>
        <div className={styles.catProgressWrap}>
          <div className={styles.catProgressBar}>
            <div className={styles.catProgressFill} style={{ width: `${pct}%`, background: color }} />
          </div>
          <span className={styles.catProgressPct}>{pct}%</span>
        </div>
      </div>
    </button>
  );
}

// ── Drawer (bottom sheet with category word list) ─────────────────────────────

interface DrawerProps {
  category: WordCategory | null;
  level: Level;
  lang: string;
  t: Translations;
  onClose: () => void;
  onMark: (id: string, action: 'study' | 'mastered') => void;
  onOpen: (id: string) => void;
  markingId: string | null;
  navigate: ReturnType<typeof useNavigate>;
}

function Drawer({ category, level, lang, t, onClose, onMark, onOpen, markingId, navigate }: DrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['browse-words', level, category?.name ?? null, lang, ''],
    queryFn: () => wordsApi.browse(level, category?.name ?? null, 0, 200),
    enabled: !!category,
    staleTime: 60_000,
  });

  const words = data?.words ?? [];
  const color = category ? categoryColor(category.name) : '#3b82f6';

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!category) return null;
  const label = getCategoryName(category.name, (t.dictionary.categoryNames ?? {}) as Record<string, string>);

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHandle} />
        <div className={styles.drawerHeader} style={{ borderColor: color }}>
          <div className={styles.drawerHeaderLeft}>
            <span className={styles.drawerTitle}>{label}</span>
            <span className={styles.drawerSubtitle}>
              {t.dictionary.masteredOf
                .replace('{mastered}', String(category.masteredCount))
                .replace('{total}', String(category.count))}
            </span>
          </div>
          <div className={styles.drawerHeaderRight}>
            <button
              className={styles.drawerPracticeBtn}
              style={{ background: color }}
              onClick={() => {
                onClose();
                navigate({ to: '/vocabulary', search: { category: category.name } as never });
              }}
            >
              {t.dictionary.drawerPractice}
            </button>
            <button className={styles.drawerCloseBtn} onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <div className={styles.drawerBody}>
          {isLoading && <p className={styles.loadingText}>{t.dictionary.loading}</p>}
          {!isLoading && words.length === 0 && <p className={styles.loadingText}>{t.dictionary.noWordsInCategory}</p>}
          {words.map((w) => (
            <WordRow key={w.id} word={w} t={t} onMark={onMark} onOpen={onOpen} markingId={markingId} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DictionaryPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userLevel = useAuthStore((s) => s.user?.level);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Default to the user's CEFR level so first-time visitors see their own
  // vocab, not B2. Falls back to A1 if level is somehow missing.
  const initialLevel: Level = (userLevel && (ALL_LEVELS as readonly string[]).includes(userLevel))
    ? userLevel as Level
    : 'A1';
  const [level, setLevel] = useState<Level>(initialLevel);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'level' | 'all'>('level');
  const [selectedCat, setSelectedCat] = useState<WordCategory | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: catsData, isLoading: catsLoading } = useQuery({
    queryKey: ['word-categories', level, lang],
    queryFn: () => wordsApi.getCategories(level),
    staleTime: 2 * 60_000,
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['browse-words', level, null, lang, ''],
    queryFn: () => wordsApi.browse(level, null, 0, 200),
    enabled: viewMode === 'list',
    staleTime: 2 * 60_000,
  });

  const debouncedQuery = useDebounce(query, 280);
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['browse-search', searchScope, searchScope === 'level' ? level : 'all', debouncedQuery, lang],
    queryFn: () => wordsApi.browse(searchScope === 'all' ? 'all' : level, null, 0, 80, debouncedQuery),
    enabled: searchActive && debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // ── Mutation ───────────────────────────────────────────────────────────────

  const { mutate: markWordMutate } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'study' | 'mastered' }) =>
      wordsApi.markWord(id, action),
    onMutate: ({ id }) => setMarkingId(id),
    onSettled: (_data, _err, { action }) => {
      setMarkingId(null);
      queryClient.invalidateQueries({ queryKey: ['browse-words', level] });
      queryClient.invalidateQueries({ queryKey: ['browse-search', level] });
      queryClient.invalidateQueries({ queryKey: ['word-categories', level] });
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
      if (action === 'study') queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });

  const handleMark = useCallback((id: string, action: 'study' | 'mastered') => {
    markWordMutate({ id, action });
  }, [markWordMutate]);

  // ── Stats strip ────────────────────────────────────────────────────────────

  const categories = catsData?.categories ?? [];
  const totalMastered = categories.reduce((s, c) => s + c.masteredCount, 0);
  const totalWords = categories.reduce((s, c) => s + c.count, 0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openSearch() {
    setSearchActive(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchActive(false);
    setQuery('');
  }

  function handleLevelChange(l: Level) {
    setLevel(l);
    setSelectedCat(null);
  }

  const listWords = listData?.words ?? [];
  const searchWords = searchData?.words ?? [];
  const showSearch = searchActive && debouncedQuery.length >= 2;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            {t.dictionary.title}
          </h1>
          {totalWords > 0 && (
            <span className={styles.statsStrip}>
              <span className={styles.statItem} data-color="mastered">
                <Star size={12} /> {totalMastered}
              </span>
              <span className={styles.statDivider}>/</span>
              <span className={styles.statTotal}>{totalWords}</span>
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          {!searchActive && (
            <>
              <button
                className={`${styles.iconBtn} ${viewMode === 'grid' ? styles.iconBtnActive ?? '' : ''}`}
                onClick={() => setViewMode('grid')}
                title={t.dictionary.gridView}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                className={`${styles.iconBtn} ${viewMode === 'list' ? styles.iconBtnActive ?? '' : ''}`}
                onClick={() => setViewMode('list')}
                title={t.dictionary.listView}
              >
                <List size={17} />
              </button>
            </>
          )}
          <button className={styles.iconBtn} onClick={searchActive ? closeSearch : openSearch}>
            {searchActive ? <X size={17} /> : <Search size={17} />}
          </button>
        </div>
      </div>

      {/* ── Search bar ── */}
      {searchActive && (
        <>
          <div className={styles.searchBar}>
            <Search size={15} className={styles.searchIcon} />
            <input
              ref={searchRef}
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.dictionary.searchPlaceholder}
            />
            {query && <button className={styles.searchClear} onClick={() => setQuery('')}><X size={13} /></button>}
          </div>
          {/* Scope toggle — search current level only vs all levels */}
          <div className={styles.searchScope}>
            <button
              className={`${styles.searchScopeBtn} ${searchScope === 'level' ? styles.searchScopeActive : ''}`}
              onClick={() => setSearchScope('level')}
            >
              {t.dictionary.searchScopeLevel.replace('{level}', level)}
            </button>
            <button
              className={`${styles.searchScopeBtn} ${searchScope === 'all' ? styles.searchScopeActive : ''}`}
              onClick={() => setSearchScope('all')}
            >
              {t.dictionary.searchScopeAll}
            </button>
          </div>
        </>
      )}

      {/* ── Level pills ── */}
      {!showSearch && (
        <div className={styles.levelPills}>
          {ALL_LEVELS.map((l) => (
            <button
              key={l}
              className={`${styles.levelPill} ${level === l ? styles.levelPillActive ?? '' : ''}`}
              onClick={() => handleLevelChange(l)}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* ── Search results ── */}
      {showSearch && (
        <div className={styles.wordListCard}>
          {searchLoading && <p className={styles.loadingText}>{t.dictionary.loading}</p>}
          {!searchLoading && searchWords.length === 0 && (
            <p className={styles.emptyText}>{t.dictionary.emptySearch}</p>
          )}
          {searchWords.map((w) => (
            <WordRow key={w.id} word={w} t={t} onMark={handleMark} onOpen={setSelectedWordId} markingId={markingId} showLevel />
          ))}
        </div>
      )}

      {/* ── Grid view ── */}
      {!showSearch && viewMode === 'grid' && (
        <>
          {catsLoading && <p className={styles.loadingText}>{t.dictionary.loading}</p>}
          {!catsLoading && (
            <div className={styles.catGrid}>
              {categories.map((cat) => {
                const color = categoryColor(cat.name);
                const label = getCategoryName(cat.name, (t.dictionary.categoryNames ?? {}) as Record<string, string>);
                return (
                  <CategoryCard
                    key={cat.name}
                    cat={cat}
                    color={color}
                    label={label}
                    onClick={() => setSelectedCat(cat)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── List view ── */}
      {!showSearch && viewMode === 'list' && (
        <div className={styles.wordListCard}>
          {listLoading && <p className={styles.loadingText}>{t.dictionary.loading}</p>}
          {!listLoading && listWords.map((w) => (
            <WordRow key={w.id} word={w} t={t} onMark={handleMark} onOpen={setSelectedWordId} markingId={markingId} />
          ))}
          {!listLoading && listWords.length === 0 && (
            <p className={styles.emptyText}>{t.dictionary.emptySearch}</p>
          )}
        </div>
      )}

      {/* ── Category drawer ── */}
      {selectedCat && (
        <Drawer
          category={selectedCat}
          level={level}
          lang={lang}
          t={t}
          onClose={() => setSelectedCat(null)}
          onMark={handleMark}
          onOpen={setSelectedWordId}
          markingId={markingId}
          navigate={navigate}
        />
      )}

      {/* ── Word details modal — opens on click of any word row ── */}
      {selectedWordId && (
        <WordDetailsModal
          wordId={selectedWordId}
          onClose={() => setSelectedWordId(null)}
          onMutated={() => {
            queryClient.invalidateQueries({ queryKey: ['browse-words'] });
            queryClient.invalidateQueries({ queryKey: ['browse-search'] });
            queryClient.invalidateQueries({ queryKey: ['word-categories'] });
          }}
        />
      )}
    </div>
  );
}

// ── useDebounce ───────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
