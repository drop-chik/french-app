import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import { useI18n } from '../../../shared/i18n';
import styles from './SessionComplete.module.css';

interface Props {
  results: SessionResult[];
  streak: number;
  onRestart: () => void;
  onBack: () => void;
  onConversation?: () => void;
}

function useCountUp(target: number, duration = 550, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return count;
}

function Confetti() {
  return (
    <div className={styles.confettiWrap} aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={styles.confetti} style={{ '--ci': i } as React.CSSProperties} />
      ))}
    </div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
};

const popVariant = {
  hidden: { opacity: 0, scale: 0.4 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 480, damping: 22, delay: 0.5 },
  },
};

export function SessionComplete({ results, streak, onRestart, onBack, onConversation }: Props) {
  const { t } = useI18n();
  const correct = results.filter((r) => r.grade >= 3).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wordsQueued = results.filter((r) => r.grade < 3).length;

  const newlyMastered = results.filter((r) => r.prevStatus !== 'mastered' && r.newStatus === 'mastered').length;
  const improved = results.filter((r) => {
    const order = ['new', 'learning', 'review', 'mastered'];
    const prev = order.indexOf(r.prevStatus ?? 'new');
    const next = order.indexOf(r.newStatus ?? 'new');
    return next > prev;
  }).length;

  const cTotal   = useCountUp(total,           500, 220);
  const cCorrect = useCountUp(correct,          500, 310);
  const cWrong   = useCountUp(total - correct,  500, 400);
  const cPct     = useCountUp(pct,              550, 220);

  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  const message = pct >= 80 ? t.session.great : pct >= 50 ? t.session.good : t.session.keep;

  const streakText = streak > 1
    ? t.session.streakContinue.replace('{n}', String(streak))
    : streak === 1
    ? t.session.streakFirst
    : null;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28 }}
    >
      {newlyMastered > 0 && <Confetti />}

      <motion.div
        className={styles.emoji}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 18, delay: 0.05 }}
      >
        {emoji}
      </motion.div>

      <motion.h2
        className={styles.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.18 }}
      >
        {t.session.done}
      </motion.h2>

      <motion.p
        className={styles.message}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, delay: 0.25 }}
      >
        {message}
      </motion.p>

      <motion.div className={styles.stats} variants={stagger} initial="hidden" animate="show">
        <motion.div className={styles.stat} variants={item}>
          <span className={styles.statValue}>{cTotal}</span>
          <span className={styles.statLabel}>{t.session.words}</span>
        </motion.div>
        <motion.div className={styles.statDivider} variants={item} />
        <motion.div className={styles.stat} variants={item}>
          <span className={`${styles.statValue} ${styles.correct}`}>{cCorrect}</span>
          <span className={styles.statLabel}>{t.session.knew}</span>
        </motion.div>
        <motion.div className={styles.statDivider} variants={item} />
        <motion.div className={styles.stat} variants={item}>
          <span className={`${styles.statValue} ${styles.incorrect}`}>{cWrong}</span>
          <span className={styles.statLabel}>{t.session.didntKnow}</span>
        </motion.div>
        <motion.div className={styles.statDivider} variants={item} />
        <motion.div className={styles.stat} variants={item}>
          <span className={styles.statValue}>{cPct}%</span>
          <span className={styles.statLabel}>{t.session.result}</span>
        </motion.div>
      </motion.div>

      {(newlyMastered > 0 || improved > 0) && (
        <motion.div className={styles.transitions} variants={stagger} initial="hidden" animate="show">
          {newlyMastered > 0 && (
            <motion.span className={styles.transitionMastered} variants={popVariant}>
              🏆 {t.session.newlyMastered.replace('{n}', String(newlyMastered))}
            </motion.span>
          )}
          {improved > 0 && (
            <motion.span className={styles.transitionImproved} variants={popVariant}>
              📈 {t.session.improved.replace('{n}', String(improved))}
            </motion.span>
          )}
        </motion.div>
      )}

      <motion.div
        className={styles.meta}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, delay: 0.65 }}
      >
        {streakText && <span className={styles.metaStreak}>{streakText}</span>}
        {wordsQueued > 0 && (
          <span className={styles.metaQueued}>
            {t.session.wordsQueued.replace('{n}', String(wordsQueued))}
          </span>
        )}
      </motion.div>

      {onConversation && (
        <motion.button
          className={styles.conversationBtn}
          onClick={onConversation}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.72 }}
        >
          {t.session.practiceConversation}
        </motion.button>
      )}

      <motion.div
        className={styles.actions}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.78 }}
      >
        <button className={styles.restartBtn} onClick={onRestart}>{t.session.again}</button>
        <button className={styles.backBtn} onClick={onBack}>{t.session.toModes}</button>
      </motion.div>
    </motion.div>
  );
}
