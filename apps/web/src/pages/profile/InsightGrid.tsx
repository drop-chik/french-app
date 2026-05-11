import { Link } from '@tanstack/react-router';
import { Zap, CheckCircle2 } from 'lucide-react';
import { useCountUp } from './useCountUp';
import styles from './InsightGrid.module.css';

interface InsightGridProps {
  wordsBreakdown: Record<string, number>;
  wordsDueToday: number;
  grammarCompleted: number;
  listeningCompleted: number;
  conversations: number;
  weekReviews: number;
  weekActivity: number[];
  labels: {
    wordsTitle: string;
    wordsSub: string;
    wordsStatus: { new: string; learning: string; review: string; mastered: string };
    reviewTitle: string;
    reviewSub: string;
    reviewCta: string;
    reviewDone: string;
    skillsTitle: string;
    skillsGrammar: string;
    skillsListening: string;
    skillsConversations: string;
    weekTitle: string;
    weekSub: string;
  };
}

export function InsightGrid(props: InsightGridProps) {
  return (
    <div className={styles.grid}>
      <WordsInsight
        breakdown={props.wordsBreakdown}
        title={props.labels.wordsTitle}
        sub={props.labels.wordsSub}
        statusLabels={props.labels.wordsStatus}
      />
      <ReviewTodayInsight
        due={props.wordsDueToday}
        labels={{
          title: props.labels.reviewTitle,
          sub: props.labels.reviewSub,
          cta: props.labels.reviewCta,
          done: props.labels.reviewDone,
        }}
      />
      <SkillsInsight
        grammar={props.grammarCompleted}
        listening={props.listeningCompleted}
        conversations={props.conversations}
        title={props.labels.skillsTitle}
        grammarLabel={props.labels.skillsGrammar}
        listeningLabel={props.labels.skillsListening}
        conversationsLabel={props.labels.skillsConversations}
      />
      <WeekInsight
        total={props.weekReviews}
        activity={props.weekActivity}
        title={props.labels.weekTitle}
        sub={props.labels.weekSub}
      />
    </div>
  );
}

// ── 1) Words insight — large number + segmented bar ──────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: '#94a3b8',
  learning: '#3b82f6',
  review: '#f59e0b',
  mastered: '#22c55e',
};

function WordsInsight({
  breakdown,
  title,
  sub,
  statusLabels,
}: {
  breakdown: Record<string, number>;
  title: string;
  sub: string;
  statusLabels: { new: string; learning: string; review: string; mastered: string };
}) {
  const statuses = ['new', 'learning', 'review', 'mastered'] as const;
  const total = statuses.reduce((s, k) => s + (breakdown[k] ?? 0), 0);
  const animTotal = useCountUp(total);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.wordsBig}>{animTotal}</div>
      <p className={styles.cardSub}>{sub}</p>
      {total > 0 ? (
        <>
          <div className={styles.segBar}>
            {statuses.map((k) => {
              const val = breakdown[k] ?? 0;
              const pct = (val / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={k}
                  className={styles.segBarPart}
                  style={{ width: `${pct}%`, background: STATUS_COLORS[k] }}
                  title={`${statusLabels[k]}: ${val}`}
                />
              );
            })}
          </div>
          <div className={styles.segLegend}>
            {statuses.map((k) => {
              const val = breakdown[k] ?? 0;
              if (val === 0) return null;
              return (
                <div key={k} className={styles.segLegendItem}>
                  <span className={styles.segDot} style={{ background: STATUS_COLORS[k] }} />
                  <span className={styles.segLegendLabel}>{statusLabels[k]}</span>
                  <span className={styles.segLegendVal}>{val}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.emptyHint}>—</div>
      )}
    </div>
  );
}

// ── 2) Review today — actionable card ────────────────────────────────────────

function ReviewTodayInsight({
  due,
  labels,
}: {
  due: number;
  labels: { title: string; sub: string; cta: string; done: string };
}) {
  const anim = useCountUp(due);
  const allDone = due === 0;

  return (
    <div className={`${styles.card} ${allDone ? styles.cardDone : styles.cardCta}`}>
      <h3 className={styles.cardTitle}>{labels.title}</h3>

      {allDone ? (
        <div className={styles.doneWrap}>
          <CheckCircle2 size={48} className={styles.doneIcon} />
          <p className={styles.doneText}>{labels.done}</p>
        </div>
      ) : (
        <>
          <div className={styles.reviewBig}>
            <Zap size={28} className={styles.reviewBigIcon} />
            <span>{anim}</span>
          </div>
          <p className={styles.cardSub}>{labels.sub}</p>
          <Link to="/vocabulary" className={styles.reviewCta}>
            {labels.cta}
            <span className={styles.reviewCtaArrow}>→</span>
          </Link>
        </>
      )}
    </div>
  );
}

// ── 3) Skills insight — three mini bars ──────────────────────────────────────

function SkillsInsight({
  grammar,
  listening,
  conversations,
  title,
  grammarLabel,
  listeningLabel,
  conversationsLabel,
}: {
  grammar: number;
  listening: number;
  conversations: number;
  title: string;
  grammarLabel: string;
  listeningLabel: string;
  conversationsLabel: string;
}) {
  const animG = useCountUp(grammar);
  const animL = useCountUp(listening);
  const animC = useCountUp(conversations);
  const max = Math.max(grammar, listening, conversations, 1);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.skills}>
        <SkillRow icon="📝" label={grammarLabel} value={animG} pct={(grammar / max) * 100} color="#8b5cf6" />
        <SkillRow icon="🎧" label={listeningLabel} value={animL} pct={(listening / max) * 100} color="#3b82f6" />
        <SkillRow icon="💬" label={conversationsLabel} value={animC} pct={(conversations / max) * 100} color="#ec4899" />
      </div>
    </div>
  );
}

function SkillRow({
  icon,
  label,
  value,
  pct,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className={styles.skillRow}>
      <div className={styles.skillHead}>
        <span className={styles.skillIcon}>{icon}</span>
        <span className={styles.skillLabel}>{label}</span>
        <span className={styles.skillValue}>{value}</span>
      </div>
      <div className={styles.skillTrack}>
        <div className={styles.skillFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── 4) Week insight — big number + 7-day sparkline ───────────────────────────

function WeekInsight({
  total,
  activity,
  title,
  sub,
}: {
  total: number;
  activity: number[];
  title: string;
  sub: string;
}) {
  const anim = useCountUp(total);
  const max = Math.max(...activity, 1);
  const w = 220;
  const h = 60;
  const barW = (w / activity.length) * 0.7;
  const gap = (w / activity.length) * 0.3;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.weekBig}>{anim}</div>
      <p className={styles.cardSub}>{sub}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.weekSpark} preserveAspectRatio="none">
        {activity.map((v, i) => {
          const barH = (v / max) * (h - 4);
          const x = i * (barW + gap);
          return (
            <rect
              key={i}
              x={x}
              y={h - barH}
              width={barW}
              height={Math.max(barH, 2)}
              rx={2}
              className={v > 0 ? styles.weekBar : styles.weekBarEmpty}
            />
          );
        })}
      </svg>
    </div>
  );
}
