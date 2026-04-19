import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp, X, BookOpen, RefreshCw, Star } from 'lucide-react';
import { wordsApi } from '../../features/words/api';
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

interface SectionProps {
  status: typeof STATUS_ORDER[number];
  words: DictWord[];
  t: Translations;
  defaultOpen: boolean;
}

function Section({ status, words, t, defaultOpen }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [modalOpen, setModalOpen] = useState(false);
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const preview = words.slice(0, SECTION_PREVIEW);
  const hasMore = words.length > SECTION_PREVIEW;

  return (
    <>
      <div className={`${styles.section} ${styles[`section_${meta.colorClass}`]}`}>
        {/* Section header */}
        <button className={styles.sectionHeader} onClick={() => setOpen((v) => !v)}>
          <div className={styles.sectionHeaderLeft}>
            <span className={`${styles.sectionIcon} ${styles[`sectionIcon_${meta.colorClass}`]}`}>
              <Icon size={16} />
            </span>
            <span className={styles.sectionTitle}>{t.dictionary.status[status]}</span>
            <span className={`${styles.sectionCount} ${styles[`sectionCount_${meta.colorClass}`]}`}>
              {words.length}
            </span>
          </div>
          <div className={styles.sectionHeaderRight}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* Words list */}
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

      {/* Modal with full list */}
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
  const { t, lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['dictionary', lang],
    queryFn: () => wordsApi.getDictionary() as Promise<{ words: DictWord[] }>,
  });

  const words = (data?.words ?? []) as DictWord[];

  // Stats per status
  const counts = useMemo(() => {
    const c: Record<typeof STATUS_ORDER[number], number> = { learning: 0, review: 0, mastered: 0 };
    for (const w of words) {
      const key = w.status as typeof STATUS_ORDER[number];
      if (key in c) c[key]++;
    }
    return c;
  }, [words]);

  // Grouped
  const grouped = useMemo(() => {
    const g: Record<typeof STATUS_ORDER[number], DictWord[]> = { learning: [], review: [], mastered: [] };
    for (const w of words) {
      const key = w.status as typeof STATUS_ORDER[number];
      if (key in g) g[key].push(w);
    }
    // Sort review/learning by nextReview asc
    g.review.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    g.learning.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    return g;
  }, [words]);

  // Search results
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return words.filter(
      (w) =>
        w.word.french.toLowerCase().includes(q) ||
        w.word.translation.toLowerCase().includes(q),
    );
  }, [search, words]);

  const STAT_CARDS = [
    { status: 'learning', colorClass: 'learning', icon: BookOpen  },
    { status: 'review',   colorClass: 'review',   icon: RefreshCw },
    { status: 'mastered', colorClass: 'mastered', icon: Star      },
  ] as const;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t.dictionary.title}</h1>
        <p className={styles.subtitle}>{t.dictionary.wordsCount.replace('{n}', String(counts.learning + counts.review + counts.mastered))}</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statsRow}>
        {STAT_CARDS.map(({ status, colorClass, icon: Icon }) => (
          <div key={status} className={`${styles.statCard} ${styles[`statCard_${colorClass}`]}`}>
            <span className={styles.statIcon}><Icon size={18} /></span>
            <span className={styles.statValue}>{counts[status]}</span>
            <span className={styles.statLabel}>{t.dictionary.status[status]}</span>
          </div>
        ))}
      </div>

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

      {isLoading && <p className={styles.loading}>{t.dictionary.loading}</p>}

      {/* Search results */}
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

      {/* Sections */}
      {!isLoading && searchResults === null && (
        <>
          {words.length === 0 ? (
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
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
