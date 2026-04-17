import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './MultipleChoiceMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

interface Question {
  word: WordData;
  options: string[];
  correctIndex: number;
}

export function MultipleChoiceMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      const qs: Question[] = [];
      for (const word of words) {
        try {
          const { distractors } = await wordsApi.getDistractors(word.id);
          const wrongOptions = distractors.map((d) => d.translation).slice(0, 3);
          const allOptions = [...wrongOptions, word.translation];
          for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j]!, allOptions[i]!];
          }
          const correctIndex = allOptions.indexOf(word.translation);
          qs.push({ word, options: allOptions, correctIndex });
        } catch {
          qs.push({ word, options: [word.translation, '???', '???', '???'], correctIndex: 0 });
        }
      }
      if (!cancelled) { setQuestions(qs); setLoading(false); }
    }
    build();
    return () => { cancelled = true; };
  }, [words]);

  const handleSelect = useCallback(
    async (optionIndex: number) => {
      if (selected !== null) return;
      const q = questions[index];
      if (!q) return;
      setSelected(optionIndex);
      const isCorrect = optionIndex === q.correctIndex;
      wordsApi.recordAnswer(q.word.id, isCorrect ? 5 : 1).catch(console.error);
      const newResults = [...results, { wordId: q.word.id, grade: isCorrect ? 5 : 1 }];
      setResults(newResults);
      setTimeout(() => {
        if (index + 1 >= questions.length) { onComplete(newResults); return; }
        setSelected(null);
        setIndex((i) => i + 1);
      }, 1000);
    },
    [selected, questions, index, results, onComplete],
  );

  if (loading) return <div className={styles.loading}>{t.multipleChoice.loading}</div>;

  const q = questions[index];
  if (!q) return null;
  const progress = (index / questions.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.counter}>{index + 1} / {questions.length}</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.word.id}
          className={styles.question}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <p className={styles.prompt}>{t.multipleChoice.howToTranslate}</p>
          <p className={styles.wordText}>{q.word.french}</p>
          {q.word.exampleFr && <p className={styles.exampleHint}>{q.word.exampleFr}</p>}
        </motion.div>
      </AnimatePresence>

      <div className={styles.options}>
        {q.options.map((option, i) => {
          let state: 'default' | 'correct' | 'wrong' | 'disabled' = 'default';
          if (selected !== null) {
            if (i === q.correctIndex) state = 'correct';
            else if (i === selected) state = 'wrong';
            else state = 'disabled';
          }
          return (
            <motion.button
              key={i}
              className={`${styles.option} ${styles[`option_${state}`]}`}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              whileTap={selected === null ? { scale: 0.98 } : {}}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
