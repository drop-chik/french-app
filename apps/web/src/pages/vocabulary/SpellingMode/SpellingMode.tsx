import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './SpellingMode.module.css';

interface Props { words: WordData[]; onComplete: (results: SessionResult[]) => void; }
type State = 'input' | 'correct' | 'wrong';

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

export function SpellingMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [state, setState] = useState<State>('input');
  const [hint, setHint] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = words[index];

  const playAudio = useCallback(() => {
    if (!current?.audioUrl) return;
    new Audio(current.audioUrl).play().catch(() => null);
  }, [current]);

  const showHint = useCallback(() => {
    if (!current) return;
    setHint((h) => Math.min(h + 1, current.french.length));
  }, [current]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!current || state !== 'input') return;
    const exact = value.trim().toLowerCase() === current.french.toLowerCase();
    const fuzzy = normalize(value.trim()) === normalize(current.french);
    const isCorrect = exact || fuzzy;
    setState(isCorrect ? 'correct' : 'wrong');
    let grade: number;
    if (!isCorrect) {
      grade = 1;
    } else if (hint === 0) {
      grade = exact ? 5 : 4;
    } else if (hint >= current.french.length) {
      grade = 2;
    } else {
      grade = 3;
    }
    wordsApi.recordAnswer(current.id, grade).catch(console.error);
    setResults((r) => [...r, { wordId: current.id, grade }]);
  }, [current, state, value, hint]);

  const advance = useCallback(() => {
    if (!current) return;
    if (index + 1 >= words.length) { onComplete(results); return; }
    setValue(''); setState('input'); setHint(0);
    setIndex((i) => i + 1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [current, index, words.length, results, onComplete]);

  if (!current) return null;
  const progress = (index / words.length) * 100;
  const hintText = current.french.split('').map((ch, i) => (i < hint ? ch : ch === ' ' ? ' ' : '?')).join('');

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
      <div className={styles.counter}>{index + 1} / {words.length}</div>

      <AnimatePresence mode="wait">
        <motion.div key={current.id} className={styles.card}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <p className={styles.prompt}>{t.spelling.prompt}</p>
          <p className={styles.translation}>{current.translation}</p>
          {current.exampleRu && <p className={styles.example}>{current.exampleRu}</p>}

          <div className={styles.audioRow}>
            {current.audioUrl && (
              <button className={styles.audioBtn} onClick={playAudio} type="button">
                <Volume2 size={16} /> {t.spelling.listen}
              </button>
            )}
            {hint < current.french.length && state === 'input' && (
              <button className={styles.hintBtn} onClick={showHint} type="button">
                {t.spelling.hint} ({hint}/{current.french.length})
              </button>
            )}
          </div>

          {hint > 0 && state === 'input' && <div className={styles.hint}>{hintText}</div>}

          {state === 'input' ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input ref={inputRef} className={styles.input} value={value}
                onChange={(e) => setValue(e.target.value)} placeholder={t.spelling.placeholder}
                autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} />
              <button className={styles.submitBtn} type="submit" disabled={!value.trim()}>
                {t.spelling.check}
              </button>
            </form>
          ) : (
            <motion.div className={styles.result} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              {state === 'correct' ? (
                <div className={styles.correct}>
                  <span>{t.spelling.correct}</span>
                  <strong>{current.french}</strong>
                </div>
              ) : (
                <div className={styles.wrong}>
                  <span>{t.spelling.wrongPrefix} <em>{value}</em></span>
                  <span>{t.spelling.correctAnswer} <strong>{current.french}</strong></span>
                </div>
              )}
              <button className={styles.nextBtn} onClick={advance}>
                {index + 1 < words.length ? t.spelling.next : t.spelling.finish}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
