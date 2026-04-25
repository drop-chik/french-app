import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './SpeedRoundMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

interface Question {
  word: WordData;
  leftOption: string;
  rightOption: string;
  correctSide: 'left' | 'right';
}

const DURATION = 60;
const SWIPE_THRESHOLD = 90;
const FLY_DISTANCE = 400;

function buildQuestions(words: WordData[]): Question[] {
  return words.map((word) => {
    const pool = words.filter((w) => w.id !== word.id);
    const distractor = pool[Math.floor(Math.random() * pool.length)];
    const correctTrans = word.translation;
    const wrongTrans = distractor?.translation ?? '— — —';
    const correctSide = Math.random() < 0.5 ? 'left' : 'right';
    return {
      word,
      leftOption: correctSide === 'left' ? correctTrans : wrongTrans,
      rightOption: correctSide === 'right' ? correctTrans : wrongTrans,
      correctSide,
    };
  });
}

export function SpeedRoundMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'done'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = useMemo(() => buildQuestions([...words].sort(() => Math.random() - 0.5)), [words]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.6, 1, 1, 1, 0.6]);

  const leftOverlayOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);

  const controls = useAnimation();

  const current = questions[index];
  const next = questions[index + 1];

  const nextScale = useTransform(x, [-200, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, 200], [1, 1, 0.94, 1, 1]);
  const nextY = useTransform(x, [-200, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, 200], [0, 0, 10, 0, 0]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) { setPhase('playing'); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('done'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const flyOut = useCallback(async (side: 'left' | 'right') => {
    if (isAnimating || phase !== 'playing' || !current) return;
    setIsAnimating(true);

    const targetX = side === 'right' ? FLY_DISTANCE : -FLY_DISTANCE;
    const targetRotate = side === 'right' ? 25 : -25;

    await controls.start({
      x: targetX,
      rotate: targetRotate,
      opacity: 0,
      transition: { duration: 0.25, ease: 'easeOut' },
    });

    const isCorrect = side === current.correctSide;
    const grade = isCorrect ? 5 : 1;
    wordsApi.recordAnswer(current.word.id, grade).catch(console.error);
    setResults((r) => [...r, { wordId: current.word.id, grade }]);
    if (isCorrect) setCorrectCount((c) => c + 1);

    x.set(0);
    await controls.set({ x: 0, rotate: 0, opacity: 1 });

    const nextIndex = index + 1;
    if (nextIndex >= questions.length) {
      clearInterval(timerRef.current!);
      setPhase('done');
    } else {
      setIndex(nextIndex);
    }
    setIsAnimating(false);
  }, [isAnimating, phase, current, controls, x, index, questions.length]);

  useEffect(() => {
    if (phase !== 'playing') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'k') flyOut('right');
      if (e.key === 'ArrowLeft' || e.key === 'j') flyOut('left');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, flyOut]);

  async function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
      await flyOut(offset > 0 || velocity > 0 ? 'right' : 'left');
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }
  }

  // ── Phases ──

  if (phase === 'countdown') {
    return (
      <div className={styles.container}>
        <div className={styles.countdown}>
          <motion.span
            key={countdown}
            className={styles.countdownNumber}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {countdown === 0 ? t.speedRound.start : countdown}
          </motion.span>
          <p className={styles.countdownHint}>{t.speedRound.chooseTranslation}</p>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className={styles.container}>
        <motion.div
          className={styles.result}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className={styles.resultEmoji}>⚡</span>
          <h2 className={styles.resultTitle}>{t.speedRound.timeUp}</h2>
          <p className={styles.resultScore}>
            {correctCount} {t.speedRound.scoreOf} {results.length} {t.speedRound.wordsLabel}
          </p>
          <p className={styles.resultSub}>
            {Math.round((correctCount / Math.max(results.length, 1)) * 100)}{t.speedRound.correctPct}
          </p>
          <button className={styles.doneBtn} onClick={() => onComplete(results)}>
            {t.speedRound.finish}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!current) return null;

  const timerPct = (timeLeft / DURATION) * 100;
  const timerColor = timeLeft > 20 ? 'var(--color-brand)' : timeLeft > 10 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div className={styles.container}>
      <div className={styles.timerRow}>
        <div className={styles.timerBar}>
          <div className={styles.timerFill} style={{ width: `${timerPct}%`, backgroundColor: timerColor }} />
        </div>
        <span className={styles.timerText} style={{ color: timerColor }}>{timeLeft}s</span>
      </div>

      <div className={styles.stats}>
        <span className={styles.statCorrect}>✓ {correctCount}</span>
        <span className={styles.statTotal}>{index} {t.speedRound.cards}</span>
      </div>

      <div className={styles.cardArea}>
        {next && (
          <motion.div
            key={`next-${index}`}
            className={`${styles.card} ${styles.cardNext}`}
            style={{ scale: nextScale, y: nextY }}
          >
            <p className={styles.cardFrench}>{next.word.french}</p>
            <div className={styles.optionsRow}>
              <span className={styles.optionChip}>{next.leftOption}</span>
              <span className={styles.optionChip}>{next.rightOption}</span>
            </div>
          </motion.div>
        )}

        <motion.div
          key={`card-${index}`}
          className={styles.card}
          style={{ x, rotate, opacity: cardOpacity }}
          animate={controls}
          drag={isAnimating ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          whileTap={{ cursor: 'grabbing' }}
        >
          {/* Оверлеи нейтральные — цвет одинаковый, не раскрывает правильный ответ */}
          <motion.div
            className={styles.swipeOverlay}
            style={{ opacity: leftOverlayOpacity }}
          >
            <span className={styles.swipeOptionText}>{current.leftOption}</span>
          </motion.div>

          <motion.div
            className={styles.swipeOverlay}
            style={{ opacity: rightOverlayOpacity }}
          >
            <span className={styles.swipeOptionText}>{current.rightOption}</span>
          </motion.div>

          <p className={styles.cardFrench}>{current.word.french}</p>
          <div className={styles.optionsRow}>
            <span className={styles.optionChip}>{current.leftOption}</span>
            <span className={styles.optionChip}>{current.rightOption}</span>
          </div>
          <p className={styles.swipeHint}>{t.speedRound.hintSwipe}</p>
        </motion.div>
      </div>

      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${styles.btnLeft}`}
          onClick={() => flyOut('left')}
          disabled={isAnimating}
        >
          <span className={styles.btnOption}>{current.leftOption}</span>
          <kbd>←</kbd>
        </button>
        <button
          className={`${styles.btn} ${styles.btnRight}`}
          onClick={() => flyOut('right')}
          disabled={isAnimating}
        >
          <span className={styles.btnOption}>{current.rightOption}</span>
          <kbd>→</kbd>
        </button>
      </div>
    </div>
  );
}
