import { Flame, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useCountUp } from './useCountUp';
import { WEEKLY_GOAL_TARGET } from './profile.constants';
import styles from './StatCards.module.css';

interface StreakCardProps {
  streak: number;
  todayCompleted: boolean;
  last7Days: { date: string; active: boolean }[];
  labels: {
    title: string;
    days: string;
    keepGoing: string;
    started: string;
    start: string;
    broken: string;
  };
  lang: 'ru' | 'en';
}

export function StreakCard(props: StreakCardProps) {
  const streakAnim = useCountUp(props.streak);

  let message: string;
  if (props.streak === 0) {
    // Was there activity in the last 2 days? If yes — broken, else — start
    const last2 = props.last7Days.slice(-2);
    message = last2.some((d) => d.active) ? props.labels.broken : props.labels.start;
  } else if (props.todayCompleted) {
    message = props.labels.started;
  } else {
    message = props.labels.keepGoing;
  }

  const dayNamesRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dayNamesEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNames = props.lang === 'ru' ? dayNamesRu : dayNamesEn;

  return (
    <div className={`${styles.card} ${styles.streakCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <Flame size={16} className={styles.streakIcon} />
          {props.labels.title}
        </div>
      </div>
      <div className={styles.streakBody}>
        <div className={styles.streakNumberWrap}>
          <span className={styles.streakNumber}>{streakAnim}</span>
          <span className={styles.streakDaysLabel}>
            {props.labels.days.replace('{n}', '')}
          </span>
        </div>
        <div className={styles.streakDays}>
          {props.last7Days.map((d) => {
            const dayOfWeek = new Date(d.date + 'T12:00:00').getDay();
            return (
              <div key={d.date} className={styles.streakDayCol}>
                <div
                  className={`${styles.streakDot} ${d.active ? styles.streakDotActive : ''}`}
                  title={d.date}
                />
                <span className={styles.streakDayName}>{dayNames[dayOfWeek]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className={styles.streakMsg}>{message}</p>
    </div>
  );
}

interface WeeklyGoalCardProps {
  current: number;
  trend: number | null;
  labels: {
    title: string;
    of: string;
    daysLeft: string;
    lastDay: string;
    done: string;
  };
}

export function WeeklyGoalCard(props: WeeklyGoalCardProps) {
  const target = WEEKLY_GOAL_TARGET;
  const pct = Math.min(100, Math.round((props.current / target) * 100));
  const animCurrent = useCountUp(props.current);
  const animPct = useCountUp(pct, 1100);

  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon..7=Sun
  const daysLeft = Math.max(0, 7 - dayOfWeek);

  let hint: string;
  if (props.current >= target) {
    hint = props.labels.done;
  } else if (daysLeft === 0) {
    hint = props.labels.lastDay;
  } else {
    hint = props.labels.daysLeft.replace('{n}', String(daysLeft));
  }

  const isDone = props.current >= target;
  const trendIsUp = (props.trend ?? 0) >= 0;

  return (
    <div className={`${styles.card} ${styles.goalCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <Target size={16} className={styles.goalIcon} />
          {props.labels.title}
        </div>
        {props.trend !== null && (
          <span className={`${styles.trendBadge} ${trendIsUp ? styles.trendUp : styles.trendDown}`}>
            {trendIsUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendIsUp ? '+' : ''}{props.trend}%
          </span>
        )}
      </div>
      <div className={styles.goalBody}>
        <div className={styles.goalNumberWrap}>
          <span className={styles.goalCurrent}>{animCurrent}</span>
          <span className={styles.goalSub}>{props.labels.of.replace('{n}', String(target))}</span>
        </div>
        <div className={styles.goalProgressTrack}>
          <div
            className={`${styles.goalProgressFill} ${isDone ? styles.goalProgressDone : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={styles.goalRow}>
          <span className={styles.goalPct}>{animPct}%</span>
          <span className={styles.goalHint}>{hint}</span>
        </div>
      </div>
    </div>
  );
}
