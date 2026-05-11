import { useCountUp } from './useCountUp';
import styles from './InsightGrid.module.css';

interface InsightGridProps {
  wordsBreakdown: Record<string, number>;
  correctAnswers: number;
  incorrectAnswers: number;
  grammarCompleted: number;
  listeningCompleted: number;
  conversations: number;
  weekReviews: number;
  weekActivity: number[]; // last 7 days reviewed counts (for sparkline)
  labels: {
    wordsTitle: string;
    wordsSub: string;
    wordsStatus: { new: string; learning: string; review: string; mastered: string };
    accuracyTitle: string;
    accuracySub: string;
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
      <AccuracyInsight
        correct={props.correctAnswers}
        incorrect={props.incorrectAnswers}
        title={props.labels.accuracyTitle}
        subTemplate={props.labels.accuracySub}
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

// ── 2) Accuracy insight — radial progress ────────────────────────────────────

function AccuracyInsight({
  correct,
  incorrect,
  title,
  subTemplate,
}: {
  correct: number;
  incorrect: number;
  title: string;
  subTemplate: string;
}) {
  const total = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const animAccuracy = useCountUp(accuracy, 1000);

  const size = 120;
  const stroke = 12;
  const R = size / 2 - stroke / 2;
  const C = 2 * Math.PI * R;
  const filled = (accuracy / 100) * C;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.radialWrap}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke="var(--color-border)"
            strokeWidth={stroke}
            fill="none"
          />
          {accuracy > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={R}
              stroke="#22c55e"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${filled.toFixed(1)} ${(C - filled).toFixed(1)}`}
              strokeLinecap="round"
              style={{
                transformOrigin: `${size / 2}px ${size / 2}px`,
                transform: 'rotate(-90deg)',
                transition: 'stroke-dasharray 0.9s cubic-bezier(0.25,1,0.5,1)',
              }}
            />
          )}
          <text
            x={size / 2}
            y={size / 2 + 7}
            textAnchor="middle"
            fontSize="28"
            fontWeight="800"
            fill="var(--color-text-primary)"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {animAccuracy}%
          </text>
        </svg>
      </div>
      <p className={styles.cardSub}>
        {total > 0
          ? subTemplate.replace('{c}', String(correct)).replace('{t}', String(total))
          : '—'}
      </p>
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
