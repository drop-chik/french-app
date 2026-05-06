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

export function SessionComplete({ results, streak, onRestart, onBack, onConversation }: Props) {
  const { t } = useI18n();
  const correct = results.filter((r) => r.grade >= 3).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  // Words that need more practice (answered incorrectly)
  const wordsQueued = results.filter((r) => r.grade < 3).length;

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
      transition={{ duration: 0.3 }}
    >
      <div className={styles.emoji}>{emoji}</div>
      <h2 className={styles.title}>{t.session.done}</h2>
      <p className={styles.message}>{message}</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{total}</span>
          <span className={styles.statLabel}>{t.session.words}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.correct}`}>{correct}</span>
          <span className={styles.statLabel}>{t.session.knew}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.incorrect}`}>{total - correct}</span>
          <span className={styles.statLabel}>{t.session.didntKnow}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{pct}%</span>
          <span className={styles.statLabel}>{t.session.result}</span>
        </div>
      </div>

      {/* Streak + words queued row */}
      <div className={styles.meta}>
        {streakText && <span className={styles.metaStreak}>{streakText}</span>}
        {wordsQueued > 0 && (
          <span className={styles.metaQueued}>
            {t.session.wordsQueued.replace('{n}', String(wordsQueued))}
          </span>
        )}
      </div>

      {onConversation && (
        <button className={styles.conversationBtn} onClick={onConversation}>
          {t.session.practiceConversation}
        </button>
      )}

      <div className={styles.actions}>
        <button className={styles.restartBtn} onClick={onRestart}>{t.session.again}</button>
        <button className={styles.backBtn} onClick={onBack}>{t.session.toModes}</button>
      </div>
    </motion.div>
  );
}
