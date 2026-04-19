import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './SpeedRoundMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

const DURATION = 60;

export function SpeedRoundMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'done'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-15, 15]);
  const opacity = useTransform(x, [-150, -75, 0, 75, 150], [0.5, 1, 1, 1, 0.5]);
  const knowOpacity = useTransform(x, [0, 75], [0, 1]);
  const dontKnowOpacity = useTransform(x, [-75, 0], [1, 0]);

  const shuffled = useRef([...words].sort(() => Math.random() - 0.5));
  const current = shuffled.current[index % shuffled.current.length];

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) { setPhase('playing'); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
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

  const handleAnswer = useCallback(
    (know: boolean) => {
      if (phase !== 'playing' || !current) return;
      const grade = know ? 4 : 1;
      wordsApi.recordAnswer(current.id, grade).catch(console.error);
      setResults((r) => [...r, { wordId: current.id, grade }]);
      if (know) setCorrectCount((c) => c + 1);
      setSwipeDir(know ? 'right' : 'left');
      x.set(0);
      setIndex((i) => i + 1);
    },
    [phase, current, x],
  );

  // сброс направления свайпа после смены карточки
  useEffect(() => {
    setSwipeDir(null);
  }, [index]);

  useEffect(() => {
    if (phase !== 'playing') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'k') handleAnswer(true);
      if (e.key === 'ArrowLeft' || e.key === 'j') handleAnswer(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleAnswer]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (Math.abs(info.offset.x) > 80) handleAnswer(info.offset.x > 0);
    x.set(0);
  }

  if (phase === 'countdown') {
    return (
      <div className={styles.container}>
        <div className={styles.countdown}>
          <AnimatePresence mode="wait">
            <motion.span
              key={countdown}
              className={styles.countdownNumber}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {countdown === 0 ? t.speedRound.start : countdown}
            </motion.span>
          </AnimatePresence>
          <p className={styles.countdownHint}>{t.speedRound.hintArrows}</p>
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

      <div className={styles.labels}>
        <motion.span className={styles.labelNo} style={{ opacity: dontKnowOpacity }}>
          ✗ {t.speedRound.dontKnow}
        </motion.span>
        <motion.span className={styles.labelYes} style={{ opacity: knowOpacity }}>
          ✓ {t.speedRound.know}
        </motion.span>
      </div>

      <div className={styles.cardArea}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={index}
            className={styles.card}
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              x: swipeDir === 'right' ? 250 : swipeDir === 'left' ? -250 : 0,
              rotate: swipeDir === 'right' ? 20 : swipeDir === 'left' ? -20 : 0,
              transition: { duration: 0.18 },
            }}
            transition={{ duration: 0.15 }}
          >
            <p className={styles.cardFrench}>{current.french}</p>
            <p className={styles.cardTranslation}>{current.translation}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.buttons}>
        <button className={`${styles.btn} ${styles.btnNo}`} onClick={() => handleAnswer(false)}>
          ✗<span>{t.speedRound.dontKnow}</span><kbd>←</kbd>
        </button>
        <button className={`${styles.btn} ${styles.btnYes}`} onClick={() => handleAnswer(true)}>
          ✓<span>{t.speedRound.know}</span><kbd>→</kbd>
        </button>
      </div>
    </div>
  );
}
