import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { listeningApi } from '../../../features/listening/api';
import { useI18n } from '../../../shared/i18n';
import styles from './FlashcardMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

export interface SessionResult {
  wordId: string;
  grade: number;
  prevStatus?: string;
  newStatus?: string;
}

export function FlashcardMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const GRADES = [
    { value: 1, label: t.flashcard.grades.bad, color: 'error' },
    { value: 3, label: t.flashcard.grades.hard, color: 'warning' },
    { value: 5, label: t.flashcard.grades.good, color: 'success' },
  ] as const;

  const current = words[index];

  const flip = useCallback(() => {
    if (!isAnimating) setFlipped((f) => !f);
  }, [isAnimating]);

  const playAudio = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!current || loadingAudio) return;
    if (current.audioUrl) {
      new Audio(current.audioUrl).play().catch(() => null);
      return;
    }
    setLoadingAudio(true);
    try {
      const blob = await listeningApi.generateTTS(current.french);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch(() => null);
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setLoadingAudio(false);
    }
  }, [current, loadingAudio]);

  const handleGrade = useCallback(
    async (grade: number) => {
      if (!current || isAnimating) return;
      setIsAnimating(true);
      const newResults = [...results, { wordId: current.id, grade }];
      setResults(newResults);
      wordsApi.recordAnswer(current.id, grade).catch(console.error);
      if (index + 1 >= words.length) {
        onComplete(newResults);
        return;
      }
      setTimeout(() => {
        setFlipped(false);
        setTimeout(() => {
          setIndex((i) => i + 1);
          setImageError(false);
          setIsAnimating(false);
        }, 150);
      }, 100);
    },
    [current, index, isAnimating, results, words.length, onComplete],
  );

  if (!current) return null;

  const progress = (index / words.length) * 100;
  const categoryLabel = (t.flashcard.categories[current.category] as string | undefined) ?? current.category;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.counter}>{index + 1} / {words.length}</div>

      <div
        className={styles.cardWrapper}
        onClick={!flipped ? flip : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') ? flip() : null}
        aria-label={t.flashcard.flipHint}
      >
        <motion.div
          className={styles.card}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className={`${styles.face} ${styles.front}`}>
            {current.imageUrl && !imageError ? (
              <img
                src={current.imageUrl}
                alt={current.french}
                className={`${styles.illustration} word-illustration`}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={styles.illustrationPlaceholder}>
                <span className={styles.illustrationEmoji}>{getCategoryEmoji(current.category)}</span>
              </div>
            )}
            <div className={styles.word}>{current.french}</div>
            <div className={styles.category}>{categoryLabel}</div>
            <button
              className={styles.audioBtn}
              onClick={playAudio}
              aria-label={t.spelling.listen}
              disabled={loadingAudio}
            >
              <Volume2 size={18} />
            </button>
            <div className={styles.flipHint}>{t.flashcard.flipHint}</div>
          </div>

          <div className={`${styles.face} ${styles.back}`}>
            <div className={styles.translation}>{current.translation}</div>
            {current.exampleFr && (
              <div className={styles.example}>
                <p className={styles.exampleFr}>{current.exampleFr}</p>
                <p className={styles.exampleRu}>{current.exampleRu}</p>
              </div>
            )}
            {current.progress && (
              <div className={styles.stats}>
                ✓ {current.progress.correctCount} &nbsp;✗ {current.progress.incorrectCount}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            className={styles.grades}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {GRADES.map((g) => (
              <button
                key={g.value}
                className={`${styles.gradeBtn} ${styles[`grade_${g.color}`]}`}
                onClick={() => handleGrade(g.value)}
                disabled={isAnimating}
              >
                {g.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className={styles.keyboardHint}>
          <kbd>Space</kbd> / <kbd>Enter</kbd> — {t.flashcard.keyboardHint}
        </p>
      )}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    // A1
    verbs: '🏃', verbs_basic: '🏃', family: '👨‍👩‍👧', food: '🍎', house: '🏠',
    home: '🏠', transport: '🚌', body: '💪', clothes: '👕', colors: '🎨',
    numbers: '🔢', time: '⏰', nature: '🌿', adjectives: '✨',
    description: '✨', basics: '💬', prepositions: '🔗',
    shopping: '🛒', professions: '💼', school: '📐', leisure: '🎮',
    // A2
    emotions: '😊', health: '🏥', weather: '⛅', city: '🏙️',
    descriptions: '✨', time_expressions: '⌛', media_culture: '🎬',
    social: '🤝',
  };
  return map[category] ?? '📚';
}
