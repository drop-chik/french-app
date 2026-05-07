import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Search, ChevronDown, ChevronUp, X, BookOpen, RefreshCw, Star } from 'lucide-react';
import { wordsApi, type BrowseWord } from '../../features/words/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import styles from './DictionaryPage.module.css';

interface DictWord {
  id: string;
  status: string;
  correctCount: number;
  incorrectCount: number;
  interval: number;
  nextReview: string;
  word: {
    id: string;
    french: string;
    translation: string;
    level: string;
    category: string;
    exampleFr: string | null;
    exampleRu: string | null;
  };
}

const SECTION_PREVIEW = 8;
const STATUS_ORDER = ['learning', 'review', 'mastered'] as const;
const STATUS_META = {
  learning: { icon: BookOpen,  colorClass: 'learning' },
  review:   { icon: RefreshCw, colorClass: 'review'   },
  mastered: { icon: Star,      colorClass: 'mastered' },
} as const;

function daysUntilReview(nextReview: string): number {
  const diff = new Date(nextReview).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ReviewBadge({ nextReview, t }: { nextReview: string; t: Translations }) {
  const days = daysUntilReview(nextReview);
  if (days <= 0) return <span className={`${styles.reviewBadge} ${styles.reviewBadgeToday}`}>{t.dictionary.reviewToday}</span>;
  if (days === 1) return <span className={`${styles.reviewBadge} ${styles.reviewBadgeSoon}`}>{t.dictionary.reviewTomorrow}</span>;
  return <span className={styles.reviewBadge}>{t.dictionary.nextReview.replace('{n}', String(days))}</span>;
}

function WordRow({ item, t }: { item: DictWord; t: Translations }) {
  return (
    <div className={styles.wordRow}>
      <div className={styles.wordMain}>
        <span className={styles.wordFrench}>{item.word.french}</span>
        <span className={styles.wordTranslation}>{item.word.translation}</span>
      </div>
      <div className={styles.wordRight}>
        <span className={styles.wordLevel}>{item.word.level}</span>
        {item.status !== 'mastered' && (
          <ReviewBadge nextReview={item.nextReview} t={t} />
        )}
      </div>
      {item.word.exampleFr && (
        <p className={styles.wordExample}>{item.word.exampleFr}</p>
      )}
    </div>
  );
}

const BROWSE_STATUS_CLASS: Record<string, string> = {
  learning: styles.statusLearning ?? '',
  review:   styles.statusReview ?? '',
  mastered: styles.statusMastered ?? '',
};

function BrowseWordRow({ item, t }: { item: BrowseWord; t: Translations }) {
  const statusLabel = item.progress
    ? t.dictionary.status[item.progress.status as keyof typeof t.dictionary.status] ?? item.progress.status
    : t.dictionary.notStudied;
  const statusClass = item.progress
    ? (BROWSE_STATUS_CLASS[item.progress.status] ?? '')
    : (styles.statusNone ?? '');

  return (
    <div className={styles.wordRow}>
      <div className={styles.wordMain}>
        <span className={styles.wordFrench}>{item.french}</span>
        <span className={styles.wordTranslation}>{item.translation}</span>
      </div>
      <div className={styles.wordRight}>
        <span className={styles.wordLevel}>{item.level}</span>
        <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
      </div>
      {item.exampleFr && (
        <p className={styles.wordExample}>{item.exampleFr}</p>
      )}
    </div>
  );
}

interface SectionProps {
  status: typeof STATUS_ORDER[number];
  words: DictWord[];
  t: Translations;
  defaultOpen: boolean;
  onPractice: (status: string) => void;
}

function Section({ status, words, t, defaultOpen, onPractice }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [modalOpen, setModalOpen] = useState(false);
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const preview = words.slice(0, SECTION_PREVIEW);
  const hasMore = words.length > SECTION_PREVIEW;

  return (
    <>
      <div className={`${styles.section} ${styles[`section_${meta.colorClass}`] ?? ''}`}>
        <button className={styles.sectionHeader} onClick={() => setOpen((v) => !v)}>
          <div className={styles.sectionHeaderLeft}>
            <span className={`${styles.sectionIcon} ${styles[`sectionIcon_${meta.colorClass}`] ?? ''}`}>
              <Icon size={16} />
            </span>
            <span className={styles.sectionTitle}>{t.dictionary.status[status]}</span>
            <span className={`${styles.sectionCount} ${styles[`sectionCount_${meta.colorClass}`] ?? ''}`}>
              {words.length}
            </span>
          </div>
          <div className={styles.sectionHeaderRight}>
            {words.length > 0 && (
              <button
                className={styles.practiceBtn}
                onClick={(e) => { e.stopPropagation(); onPractice(status); }}
              >
                {t.dictionary.practiceGroup}
              </button>
            )}
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {open && (
          <div className={styles.sectionBody}>
            {words.length === 0 ? (
              <p className={styles.sectionEmpty}>{t.dictionary.noWords}</p>
            ) : (
              <>
                <div className={styles.wordList}>
                  {preview.map((item) => (
                    <WordRow key={item.id} item={item} t={t} />
                  ))}
                </div>
                {hasMore && (
                  <button className={styles.showAllBtn} onClick={() => setModalOpen(true)}>
                    {t.dictionary.showAll.replace('{n}', String(words.length))}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {t.dictionary.status[status]} — {words.length}
              </span>
              <button className={styles.modalClose} onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {words.map((item) => (
                <WordRow key={item.id} item={item} t={t} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DictionaryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userLevel = user?.level ?? 'B2';

  // ── "Мои слова" data ──────────────────────────────────────────────────
  const { data: mineData, isLoading: mineLoading } = useQuery({
    queryKey: ['dictionary', lang],
    queryFn: () => wordsApi.getDictionary() as Promise<{ words: DictWord[] }>,
  });

  const mineWords = (mineData?.words ?? []) as DictWord[];

  const counts = useMemo(() => {
    const c: Record<typeof STATUS_ORDER[number], number> = { learning: 0, review: 0, mastered: 0 };
    for (const w of mineWords) {
      const key = w.status as typeof STATUS_ORDER[number];
      if (key in c) c[key]++;
    }
    return c;
  }, [mineWords]);

  const grouped = useMemo(() => {
    const g: Record<typeof STATUS_ORDER[number], DictWord[]> = { learning: [], review: [], mastered: [] };
    for (const w of mineWords) {
      const key = w.status as typeof STATUS_ORDER[number];
      if (key in g) g[key].push(w);
    }
    g.review.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    g.learning.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    return g;
  }, [mineWords]);

  // ── "Все слова" data ──────────────────────────────────────────────────
  const { data: categoriesData } = useQuery({
    queryKey: ['word-categories', userLevel],
    queryFn: () => wordsApi.getCategories(userLevel),
    enabled: tab === 'all',
    staleTime: 5 * 60 * 1000,
  });

  const { data: browseData, isLoading: browseLoading } = useQuery({
    queryKey: ['browse-words', userLevel, activeCategory, lang],
    queryFn: () => wordsApi.browse(userLevel, activeCategory),
    enabled: tab === 'all',
    staleTime: 2 * 60 * 1000,
  });

  const categories = categoriesData?.categories ?? [];
  const browseWords = browseData?.words ?? [];

  // ── Search ────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    if (tab === 'mine') {
      return mineWords.filter(
        (w) => w.word.french.toLowerCase().includes(q) || w.word.translation.toLowerCase().includes(q),
      );
    }
    return null; // browse search handled separately
  }, [search, tab, mineWords]);

  const browseSearchResults = useMemo(() => {
    if (!search.trim() || tab !== 'all') return null;
    const q = search.toLowerCase();
    return browseWords.filter(
      (w) => w.french.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q),
    );
  }, [search, tab, browseWords]);

  function handlePractice(status: string) {
    navigate({ to: '/vocabulary', search: { filter: status } });
  }

  const totalStudied = counts.learning + counts.review + counts.mastered;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t.dictionary.title}</h1>
        <p className={styles.subtitle}>{t.dictionary.wordsCount.replace('{n}', String(totalStudied))}</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statsRow}>
        {(['learning', 'review', 'mastered'] as const).map((status) => {
          const Icon = STATUS_META[status].icon;
          const colorClass = STATUS_META[status].colorClass;
          return (
            <div key={status} className={`${styles.statCard} ${styles[`statCard_${colorClass}`] ?? ''}`}>
              <span className={styles.statIcon}><Icon size={18} /></span>
              <span className={styles.statValue}>{counts[status]}</span>
              <span className={styles.statLabel}>{t.dictionary.status[status]}</span>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'mine' ? styles.tabActive ?? '' : ''}`}
          onClick={() => setTab('mine')}
        >
          {t.dictionary.tabMine}
        </button>
        <button
          className={`${styles.tab} ${tab === 'all' ? styles.tabActive ?? '' : ''}`}
          onClick={() => setTab('all')}
        >
          {t.dictionary.tabAll}
        </button>
      </div>

      {/* Category chips (browse tab) */}
      {tab === 'all' && categories.length > 0 && (
        <div className={styles.categoryFilters}>
          <button
            className={`${styles.categoryChip} ${activeCategory === null ? styles.categoryChipActive ?? '' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            {t.dictionary.categoryAll}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`${styles.categoryChip} ${activeCategory === cat.name ? styles.categoryChipActive ?? '' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name} <span className={styles.chipCount}>{cat.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.dictionary.searchPlaceholder}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── "Мои слова" tab ── */}
      {tab === 'mine' && (
        <>
          {mineLoading && <p className={styles.loading}>{t.dictionary.loading}</p>}

          {searchResults !== null && (
            <div className={styles.searchResults}>
              {searchResults.length === 0 ? (
                <p className={styles.emptySearch}>{t.dictionary.emptySearch}</p>
              ) : (
                <div className={styles.wordList}>
                  {searchResults.map((item) => (
                    <WordRow key={item.id} item={item} t={t} />
                  ))}
                </div>
              )}
            </div>
          )}

          {!mineLoading && searchResults === null && (
            mineWords.length === 0 ? (
              <p className={styles.emptyStart}>{t.dictionary.emptyStart}</p>
            ) : (
              <div className={styles.sections}>
                {STATUS_ORDER.map((status) => (
                  <Section
                    key={status}
                    status={status}
                    words={grouped[status] ?? []}
                    t={t}
                    defaultOpen={status === 'learning' || status === 'review'}
                    onPractice={handlePractice}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* ── "Все слова" tab ── */}
      {tab === 'all' && (
        <>
          {browseLoading && <p className={styles.loading}>{t.dictionary.loading}</p>}

          {!browseLoading && (
            <>
              {browseSearchResults !== null ? (
                <div className={styles.searchResults}>
                  {browseSearchResults.length === 0 ? (
                    <p className={styles.emptySearch}>{t.dictionary.emptySearch}</p>
                  ) : (
                    <div className={styles.wordList}>
                      {browseSearchResults.map((item) => (
                        <BrowseWordRow key={item.id} item={item} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              ) : browseWords.length === 0 ? (
                <p className={styles.emptySearch}>{t.dictionary.browseEmpty}</p>
              ) : (
                <div className={styles.browseList}>
                  {browseWords.map((item) => (
                    <BrowseWordRow key={item.id} item={item} t={t} />
                  ))}
                  {(browseData?.total ?? 0) > browseWords.length && (
                    <p className={styles.browseMore}>
                      {browseData?.total} {t.dictionary.filterAll}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
