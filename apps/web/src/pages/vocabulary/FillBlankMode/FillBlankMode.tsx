import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './FillBlankMode.module.css';

interface Props { words: WordData[]; onComplete: (results: SessionResult[]) => void; }
interface Question { word: WordData; sentence: string; options: string[]; correctOption: string; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

function makeSentence(word: WordData): { sentence: string; answer: string } | null {
  if (!word.exampleFr) return null;
  const regex = new RegExp(word.french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (!regex.test(word.exampleFr)) return null;
  return { sentence: word.exampleFr.replace(regex, '___'), answer: word.french };
}

export function FillBlankMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      const qs = await Promise.all(
        words.map(async (word) => {
          const parsed = makeSentence(word);
          const sentence = parsed?.sentence ?? `___ — ${word.translation}`;
          const answer = parsed?.answer ?? word.french;
          let distractors: string[] = [];
          try {
            const res = await wordsApi.getDistractors(word.id);
            distractors = res.distractors.map((d) => d.french);
          } catch {
            distractors = words.filter((w) => w.id !== word.id).slice(0, 3).map((w) => w.french);
          }
          return { word, sentence, options: shuffle([answer, ...distractors.slice(0, 3)]), correctOption: answer };
        }),
      );
      if (!cancelled) { setQuestions(qs); setLoading(false); }
    }
    build();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = questions[index];

  const handleChoose = useCallback((option: string) => {
    if (chosen || !current) return;
    setChosen(option);
    const isCorrect = option === current.correctOption;
    wordsApi.recordAnswer(current.word.id, isCorrect ? 5 : 1).catch(console.error);
    setResults((r) => [...r, { wordId: current.word.id, grade: isCorrect ? 5 : 1 }]);
  }, [chosen, current]);

  const advance = useCallback(() => {
    if (!current) return;
    if (index + 1 >= questions.length) { onComplete(results); return; }
    setChosen(null);
    setIndex((i) => i + 1);
  }, [current, index, questions.length, results, onComplete]);

  if (loading) return <div className={styles.container}><p className={styles.loading}>{t.fillBlank.loading}</p></div>;
  if (!current) return null;
  const progress = (index / questions.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
      <div className={styles.counter}>{index + 1} / {questions.length}</div>

      <AnimatePresence mode="wait">
        <motion.div key={current.word.id} className={styles.card}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <p className={styles.instruction}>{t.fillBlank.instruction}</p>
          <p className={styles.sentence}>{current.sentence}</p>
          <p className={styles.hint}>{current.word.translation}</p>

          <div className={styles.options}>
            {current.options.map((opt) => {
              const isSelected = chosen === opt;
              const isCorrect = chosen && opt === current.correctOption;
              const isWrong = isSelected && opt !== current.correctOption;
              return (
                <button key={opt}
                  className={`${styles.option} ${isCorrect ? styles.optionCorrect : ''} ${isWrong ? styles.optionWrong : ''} ${isSelected && !isWrong ? styles.optionSelected : ''}`}
                  onClick={() => handleChoose(opt)} disabled={!!chosen}>
                  {isCorrect && <CheckCircle size={14} />}
                  {isWrong && <XCircle size={14} />}
                  {opt}
                </button>
              );
            })}
          </div>

          {chosen && (
            <motion.div className={styles.feedback} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {chosen === current.correctOption ? (
                <span className={styles.feedbackCorrect}>{t.fillBlank.correct}</span>
              ) : (
                <span className={styles.feedbackWrong}>{t.fillBlank.wrongPrefix} <strong>{current.correctOption}</strong></span>
              )}
              {current.word.exampleRu && <span className={styles.feedbackHint}>{current.word.exampleRu}</span>}
              <button className={styles.nextBtn} onClick={advance}>
                {index + 1 < questions.length ? t.fillBlank.next : t.fillBlank.finish}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
