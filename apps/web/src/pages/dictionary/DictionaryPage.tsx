import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { wordsApi } from '../../features/words/api';
import { useI18n } from '../../shared/i18n';
import styles from './DictionaryPage.module.css';

const STATUS_COLOR: Record<string, string> = {
  new: 'new',
  learning: 'learning',
  review: 'review',
  mastered: 'mastered',
};

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

export function DictionaryPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { t, lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['dictionary', lang],
    queryFn: () => wordsApi.getDictionary() as Promise<{ words: DictWord[] }>,
  });

  const words = (data?.words ?? []) as DictWord[];

  const filtered = words.filter((w) => {
    const matchSearch =
      !search ||
      w.word.french.toLowerCase().includes(search.toLowerCase()) ||
      w.word.translation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.dictionary.title}</h1>
        <p className={styles.subtitle}>
          {t.dictionary.wordsCount.replace('{n}', String(words.length))}
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.dictionary.searchPlaceholder}
          />
        </div>
        <div className={styles.filters}>
          {['all', 'learning', 'review', 'mastered'].map((s) => (
            <button
              key={s}
              className={`${styles.filter} ${filterStatus === s ? styles.filterActive : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? t.dictionary.filterAll : t.dictionary.status[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className={styles.empty}>{t.dictionary.loading}</p>}

      {!isLoading && filtered.length === 0 && (
        <p className={styles.empty}>
          {words.length === 0 ? t.dictionary.emptyStart : t.dictionary.emptySearch}
        </p>
      )}

      <div className={styles.list}>
        {filtered.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardMain}>
              <span className={styles.french}>{item.word.french}</span>
              <span className={styles.translation}>{item.word.translation}</span>
            </div>
            <div className={styles.cardMeta}>
              <span className={`${styles.status} ${styles[`status_${STATUS_COLOR[item.status] ?? 'new'}`]}`}>
                {t.dictionary.status[item.status] ?? item.status}
              </span>
              <span className={styles.stats}>
                ✓{item.correctCount} ✗{item.incorrectCount}
              </span>
              <span className={styles.level}>{item.word.level}</span>
            </div>
            {item.word.exampleFr && (
              <p className={styles.example}>{item.word.exampleFr}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
