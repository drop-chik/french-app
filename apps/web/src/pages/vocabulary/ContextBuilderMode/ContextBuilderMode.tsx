import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './ContextBuilderMode.module.css';

interface Props { words: WordData[]; onComplete: (results: SessionResult[]) => void; }
interface Question { word: WordData; tokens: string[]; correct: string[]; }

function tokenize(sentence: string): string[] { return sentence.split(/\s+/).filter(Boolean); }
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

function buildQuestions(words: WordData[]): Question[] {
  return words
    .filter((w) => w.exampleFr && w.exampleFr.trim().split(/\s+/).length >= 3)
    .map((w) => { const correct = tokenize(w.exampleFr!); return { word: w, tokens: shuffle([...correct]), correct }; });
}

export function ContextBuilderMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [questions] = useState<Question[]>(() => buildQuestions(words));
  const [index, setIndex] = useState(0);
  const [arranged, setArranged] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);

  const current = questions[index];

  useEffect(() => {
    if (!current) return;
    setAvailable([...current.tokens]);
    setArranged([]);
    setChecked(null);
  }, [index, current]);

  const addToken = useCallback((token: string, tokenIndex: number) => {
    if (checked !== null) return;
    const newAvail = [...available];
    newAvail.splice(tokenIndex, 1);
    setAvailable(newAvail);
    setArranged((a) => [...a, token]);
  }, [available, checked]);

  const removeToken = useCallback((token: string, tokenIndex: number) => {
    if (checked !== null) return;
    const newArr = [...arranged];
    newArr.splice(tokenIndex, 1);
    setArranged(newArr);
    setAvailable((a) => [...a, token]);
  }, [arranged, checked]);

  const handleCheck = useCallback(() => {
    if (!current || arranged.length !== current.correct.length) return;
    const isCorrect = arranged.join(' ') === current.correct.join(' ');
    setChecked(isCorrect);
    wordsApi.recordAnswer(current.word.id, isCorrect ? 5 : 2).catch(console.error);
    setResults((r) => [...r, { wordId: current.word.id, grade: isCorrect ? 5 : 2 }]);
  }, [current, arranged]);

  const handleRetry = useCallback(() => {
    if (!current) return;
    setAvailable([...current.tokens]);
    setArranged([]);
    setChecked(null);
  }, [current]);

  const advance = useCallback(() => {
    if (!current) return;
    if (index + 1 >= questions.length) { onComplete(results); return; }
    setIndex((i) => i + 1);
  }, [current, index, questions.length, results, onComplete]);

  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>{t.contextBuilder.noExamples}</p>
          <button className={styles.nextBtn} onClick={() => onComplete([])}>{t.contextBuilder.back}</button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const progress = (index / questions.length) * 100;
  const canCheck = arranged.length === current.correct.length && checked === null;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
      <div className={styles.counter}>{index + 1} / {questions.length}</div>

      <AnimatePresence mode="wait">
        <motion.div key={current.word.id} className={styles.card}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          <p className={styles.instruction}>{t.contextBuilder.instruction}</p>
          <p className={styles.wordHint}><strong>{current.word.french}</strong> — {current.word.translation}</p>
          {current.word.exampleRu && <p className={styles.meaning}>{current.word.exampleRu}</p>}

          <div className={`${styles.answerArea} ${checked === true ? styles.answerCorrect : ''} ${checked === false ? styles.answerWrong : ''}`}>
            {arranged.length === 0 ? (
              <span className={styles.placeholder}>{t.contextBuilder.placeholder}</span>
            ) : (
              <div className={styles.arrangedTokens}>
                {arranged.map((token, i) => (
                  <motion.button key={`arr-${i}-${token}`} className={styles.tokenArranged}
                    onClick={() => removeToken(token, i)} disabled={checked !== null}
                    layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    {token}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.availableTokens}>
            <AnimatePresence>
              {available.map((token, i) => (
                <motion.button key={`avail-${i}-${token}`} className={styles.tokenAvailable}
                  onClick={() => addToken(token, i)} disabled={checked !== null}
                  layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                  {token}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {checked !== null && (
            <motion.div className={`${styles.feedback} ${checked ? styles.feedbackOk : styles.feedbackFail}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.feedbackHeader}>
                {checked ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{checked ? t.contextBuilder.correct : t.contextBuilder.wrong}</span>
              </div>
              {!checked && <p className={styles.correctSentence}>{current.correct.join(' ')}</p>}
            </motion.div>
          )}

          <div className={styles.actions}>
            {checked === null ? (
              <>
                <button className={styles.retryBtn} onClick={handleRetry} disabled={arranged.length === 0}>
                  <RefreshCw size={14} /> {t.contextBuilder.reset}
                </button>
                <button className={styles.checkBtn} onClick={handleCheck} disabled={!canCheck}>
                  {t.contextBuilder.check}
                </button>
              </>
            ) : (
              <button className={styles.nextBtn} onClick={advance}>
                {index + 1 < questions.length ? t.contextBuilder.next : t.contextBuilder.finish}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
