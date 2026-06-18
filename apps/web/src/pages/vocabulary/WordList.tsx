import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { wordsApi, type BrowseWord } from '../../features/words/api';
import { useI18n } from '../../shared/i18n';
import { formatPos } from '../../shared/pos';
import styles from './WordList.module.css';

const PAGE_SIZE = 50;

type StatusTab = 'all' | 'in-progress' | 'mastered' | 'not-started';
type Sort = 'recent' | 'alphabet' | 'frequency';

interface WordListProps {
  level: string;
}

/**
 * SavoirX-style word list, rendered below the hero on /vocabulary/level/{X}.
 * Three responsibilities:
 *   - status filter (All / Learning / Mastered / New) — tabs on top
 *   - reveal/hide translations toggle (default: hidden — blurs translations
 *     so the user reads the French first; click to reveal one or all)
 *   - sort (Recently practised / Alphabetical / Frequency)
 *
 * The strength % per row is computed from the SM-2 progress (interval +
 * repetitions), matching how the dashboard ring is scaled.
 */
export function WordList({ level }: WordListProps) {
  const { t } = useI18n();
  const tn = t.wordList as {
    countSuffix: string;
    tabs: { all: string; inProgress: string; mastered: string; new: string };
    reveal: string;
    hide: string;
    sortLabel: string;
    sort: { recent: string; alphabet: string; frequency: string };
    empty: string;
    loading: string;
  };

  const [status, setStatus] = useState<StatusTab>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [reveal, setReveal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['words-browse', level, status, sort],
    queryFn: () => wordsApi.browse(level, null, 0, PAGE_SIZE, undefined, sort, status),
    staleTime: 60_000,
  });

  const total = data?.total ?? 0;
  const items = data?.words ?? [];

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2 className={styles.title}>
          {total.toLocaleString('ru-RU')} <span className={styles.titleSuffix}>{tn.countSuffix}</span>
        </h2>
        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.revealBtn} ${reveal ? styles.revealActive : ''}`}
            onClick={() => setReveal((v) => !v)}
          >
            {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
            {reveal ? tn.hide : tn.reveal}
          </button>

          <label className={styles.sortWrap}>
            <span className={styles.sortLabel}>{tn.sortLabel}</span>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <option value="recent">{tn.sort.recent}</option>
              <option value="alphabet">{tn.sort.alphabet}</option>
              <option value="frequency">{tn.sort.frequency}</option>
            </select>
            <ChevronDown size={14} className={styles.sortChevron} />
          </label>
        </div>
      </header>

      <div className={styles.tabs} role="tablist">
        {([
          ['all', tn.tabs.all],
          ['in-progress', tn.tabs.inProgress],
          ['mastered', tn.tabs.mastered],
          ['not-started', tn.tabs.new],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={status === key}
            className={`${styles.tab} ${status === key ? styles.tabActive : ''}`}
            onClick={() => setStatus(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className={styles.empty}>{tn.loading}</p>}
      {!isLoading && items.length === 0 && <p className={styles.empty}>{tn.empty}</p>}
      {!isLoading && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((w) => (
            <WordRow key={w.id} word={w} reveal={reveal} />
          ))}
        </ul>
      )}
    </section>
  );
}

function WordRow({ word, reveal }: { word: BrowseWord; reveal: boolean }) {
  const [localReveal, setLocalReveal] = useState(false);
  const isRevealed = reveal || localReveal;
  const strength = strengthPct(word);

  return (
    <li className={styles.row}>
      <span
        className={styles.strength}
        style={{ background: `conic-gradient(var(--color-brand) ${strength * 3.6}deg, var(--color-border) 0)` }}
        title={`${Math.round(strength)}%`}
      >
        <span className={styles.strengthInner}>{Math.round(strength)}</span>
      </span>

      <div className={styles.rowBody}>
        <div className={styles.rowMain}>
          <span className={styles.french}>{word.french}</span>
          {word.ipa && <span className={styles.ipa}>/{word.ipa}/</span>}
        </div>
        <div className={styles.rowMeta}>
          <span className={`${styles.pos} ${styles[`pos_${word.partOfSpeech}`] ?? ''}`}>
            {formatPos(word.partOfSpeech, word.gender)}
          </span>
          <button
            type="button"
            className={`${styles.translation} ${isRevealed ? styles.translationOn : styles.translationOff}`}
            onClick={() => setLocalReveal((v) => !v)}
            aria-label={isRevealed ? 'hide' : 'reveal'}
          >
            {isRevealed ? word.translation : '•••••'}
          </button>
        </div>
      </div>
    </li>
  );
}

function strengthPct(w: BrowseWord): number {
  if (!w.progress) return 0;
  if (w.progress.status === 'mastered') return 100;
  // SM-2-ish heuristic: interval (days until next review) + reps cap.
  // Interval 21+ days ≈ stable memory; 0 reps ≈ first sight.
  const intervalScore = Math.min(w.progress.interval / 21, 1) * 65;
  const repsScore = Math.min(w.progress.repetitions / 4, 1) * 35;
  return Math.min(100, Math.round(intervalScore + repsScore));
}

