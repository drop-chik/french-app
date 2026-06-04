import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, X as XMark, ArrowRight, Volume2 } from 'lucide-react';
import { wordsApi, type BrowseWord } from '../../features/words/api';
import { useI18n } from '../../shared/i18n';
import styles from './NewWordsPreview.module.css';

interface NewWordsPreviewProps {
  level: string;
  onClose: () => void;
  onStartQuiz: () => void;
}

/**
 * Pre-quiz word preview carousel — SavoirX-style "Scroll through to
 * preview all new words before the quiz". One word per card:
 *   - big French
 *   - IPA badge + audio (if available)
 *   - colour-coded POS chip(s) with gender for nouns
 *   - up to 2 example sentences (FR + translation if available)
 *   - "Don't know" / "I know this" decisions, kept locally
 *
 * The decisions stay client-side for now; "I know this" doesn't yet
 * skip the word in the upcoming SRS session. That's a smart-session
 * patch for a later chunk. For this stage, the preview is the
 * "browse + warm up" experience itself.
 */
export function NewWordsPreview({ level, onClose, onStartQuiz }: NewWordsPreviewProps) {
  const { t } = useI18n();
  const tn = t.newWordsPreview as {
    title: string;
    subtitle: string;
    startQuiz: string;
    dontKnow: string;
    iKnow: string;
    close: string;
    empty: string;
    loading: string;
    counter: string;
  };

  const [idx, setIdx] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, 'know' | 'dont'>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['new-words-preview', level],
    queryFn: () => wordsApi.browse(level, null, 0, 20, undefined, 'frequency', 'not-started'),
    staleTime: 60_000,
  });

  const words = useMemo<BrowseWord[]>(() => data?.words ?? [], [data]);
  const total = words.length;
  const current = words[idx];

  const next = () => setIdx((i) => Math.min(i + 1, total - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const decide = (verdict: 'know' | 'dont') => {
    if (!current) return;
    setDecisions((d) => ({ ...d, [current.id]: verdict }));
    if (idx < total - 1) next();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <header className={styles.bar}>
        <button type="button" className={styles.close} onClick={onClose} aria-label={tn.close}>
          <X size={16} /> {tn.close}
        </button>
        <div className={styles.barCenter}>
          <h2 className={styles.title}>{tn.title.replace('{n}', String(total))}</h2>
          <p className={styles.subtitle}>{tn.subtitle}</p>
        </div>
        <button
          type="button"
          className={styles.startBtn}
          onClick={onStartQuiz}
          disabled={total === 0}
        >
          {tn.startQuiz} <ArrowRight size={14} />
        </button>
      </header>

      <div className={styles.stage}>
        {isLoading && <p className={styles.empty}>{tn.loading}</p>}
        {!isLoading && total === 0 && <p className={styles.empty}>{tn.empty}</p>}

        {!isLoading && total > 0 && current && (
          <div className={styles.cardWrap}>
            <button
              type="button"
              className={styles.navArrow}
              onClick={prev}
              disabled={idx === 0}
              aria-label="prev"
            >
              <ChevronLeft size={20} />
            </button>

            <AnimatePresence mode="wait">
              <motion.article
                key={current.id}
                className={styles.card}
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.96 }}
                transition={{ duration: 0.22 }}
              >
                <h3 className={styles.french}>{current.french}</h3>

                <div className={styles.metaRow}>
                  {current.ipa && (
                    <span className={styles.ipaBadge}>/{current.ipa}/</span>
                  )}
                  <button
                    type="button"
                    className={styles.audioBtn}
                    onClick={() => speak(current.french)}
                    aria-label="play"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>

                <div className={styles.posRow}>
                  <span className={`${styles.pos} ${styles[`pos_${current.partOfSpeech}`] ?? ''}`}>
                    {posLabel(current.partOfSpeech, current.gender)}
                  </span>
                  <span className={styles.translation}>{current.translation}</span>
                </div>

                {current.exampleFr && (
                  <div className={styles.example}>
                    <p className={styles.exampleFr}>«{current.exampleFr}»</p>
                    {current.exampleRu && <p className={styles.exampleRu}>{current.exampleRu}</p>}
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.btnGhost} ${decisions[current.id] === 'dont' ? styles.btnGhostActive : ''}`}
                    onClick={() => decide('dont')}
                  >
                    <XMark size={14} /> {tn.dontKnow}
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnPrimary} ${decisions[current.id] === 'know' ? styles.btnPrimaryActive : ''}`}
                    onClick={() => decide('know')}
                  >
                    <Check size={14} /> {tn.iKnow}
                  </button>
                </div>
              </motion.article>
            </AnimatePresence>

            <button
              type="button"
              className={styles.navArrow}
              onClick={next}
              disabled={idx === total - 1}
              aria-label="next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {total > 0 && (
        <footer className={styles.footer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
          <span className={styles.counter}>
            {tn.counter
              .replace('{i}', String(idx + 1))
              .replace('{n}', String(total))}
          </span>
        </footer>
      )}
    </div>
  );
}

function posLabel(pos: string, gender: string | null): string {
  if (pos === 'noun' && gender) return `n(${gender})`;
  if (pos === 'verb') return 'v';
  if (pos === 'adjective') return 'adj';
  if (pos === 'adverb') return 'adv';
  if (pos === 'preposition') return 'prep';
  if (pos === 'conjunction') return 'conj';
  if (pos === 'pronoun') return 'pron';
  if (pos === 'determiner') return 'det';
  return pos;
}

// Browser speechSynthesis fallback — speaks the French word so the
// preview is multi-modal. Works offline, no API key needed. If the
// user's browser ships no French voice, the call is a silent no-op.
function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
