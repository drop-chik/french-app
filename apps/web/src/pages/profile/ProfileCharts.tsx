import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../../features/profile/api';
import { useI18n } from '../../shared/i18n';
import styles from './ProfileCharts.module.css';

export function ProfileCharts() {
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['profile-charts'],
    queryFn: profileApi.getCharts,
  });

  if (isLoading) return <p className={styles.empty}>{t.common.loading}</p>;
  if (!data) return null;

  const { activity, statusBreakdown, weekly } = data;
  const hasActivity = activity.some((d) => d.reviewed > 0);

  return (
    <div className={styles.charts}>
      {/* Activity bar chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{t.profile.chartActivity}</h3>
        {hasActivity ? (
          <ActivityChart activity={activity} t={t} />
        ) : (
          <p className={styles.empty}>{t.profile.chartNoData}</p>
        )}
      </div>

      {/* Accuracy line chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{t.profile.chartAccuracy}</h3>
        {weekly.length > 0 ? (
          <AccuracyChart weekly={weekly} t={t} />
        ) : (
          <p className={styles.empty}>{t.profile.chartNoData}</p>
        )}
      </div>

      {/* Word status donut */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{t.profile.chartWords}</h3>
        <WordDonut breakdown={statusBreakdown} t={t} />
      </div>
    </div>
  );
}

// ---- Activity bar chart (30 days) ----
function ActivityChart({ activity, t }: { activity: { date: string; reviewed: number; correct: number; incorrect: number }[]; t: any }) {
  const maxVal = Math.max(...activity.map((d) => d.reviewed), 1);
  const chartH = 80;
  const barW = 8;
  const gap = 3;
  const totalW = activity.length * (barW + gap) - gap;

  // Show only every 5th label
  const labelDates = activity.filter((_, i) => i % 5 === 0 || i === activity.length - 1);

  return (
    <div className={styles.svgWrapper}>
      <svg viewBox={`0 0 ${totalW} ${chartH + 20}`} className={styles.svg} preserveAspectRatio="none">
        {activity.map((d, i) => {
          const barH = (d.reviewed / maxVal) * chartH;
          const x = i * (barW + gap);
          const correctH = d.reviewed > 0 ? (d.correct / d.reviewed) * barH : 0;
          const incorrectH = barH - correctH;
          return (
            <g key={d.date}>
              {/* Incorrect (bottom part) */}
              {incorrectH > 0 && (
                <rect
                  x={x} y={chartH - barH} width={barW} height={incorrectH}
                  className={styles.barIncorrect}
                  rx={barW / 4}
                />
              )}
              {/* Correct (top part) */}
              {correctH > 0 && (
                <rect
                  x={x} y={chartH - barH + incorrectH} width={barW} height={correctH}
                  className={styles.barCorrect}
                  rx={barW / 4}
                />
              )}
              {/* Empty bar placeholder */}
              {d.reviewed === 0 && (
                <rect x={x} y={chartH - 2} width={barW} height={2} className={styles.barEmpty} rx={1} />
              )}
            </g>
          );
        })}
      </svg>
      {/* Date labels */}
      <div className={styles.barLabels}>
        {activity.map((d, i) => {
          const showLabel = i % 7 === 0 || i === activity.length - 1;
          const label = showLabel ? d.date.slice(5) : ''; // MM-DD
          return (
            <span key={d.date} className={styles.barLabel} style={{ flex: 1, textAlign: 'center' }}>
              {label}
            </span>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendDot} style={{ background: 'var(--chart-correct)' }} />
        <span className={styles.legendText}>{t.profile.chartCorrect}</span>
        <span className={styles.legendDot} style={{ background: 'var(--chart-incorrect)' }} />
        <span className={styles.legendText}>{t.profile.chartIncorrect}</span>
      </div>
    </div>
  );
}

// ---- Weekly accuracy line chart ----
function AccuracyChart({ weekly, t }: { weekly: { week: string; accuracy: number; correct: number; incorrect: number }[]; t: any }) {
  const W = 280;
  const H = 80;
  const pad = 10;

  if (weekly.length === 0) return <p className={styles.empty}>{t.profile.chartNoData}</p>;

  const pts = weekly.map((w, i) => ({
    x: weekly.length === 1 ? W / 2 : pad + (i / (weekly.length - 1)) * (W - pad * 2),
    y: H - pad - (w.accuracy / 100) * (H - pad * 2),
    acc: w.accuracy,
    week: w.week,
    correct: w.correct,
    incorrect: w.incorrect,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1]!.x.toFixed(1)},${H} L${pts[0]!.x.toFixed(1)},${H} Z`;

  return (
    <div className={styles.svgWrapper}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = H - pad - (pct / 100) * (H - pad * 2);
          return (
            <line key={pct} x1={pad} y1={y} x2={W - pad} y2={y} className={styles.gridLine} />
          );
        })}
        {/* Area fill */}
        <path d={areaD} className={styles.areaFill} />
        {/* Line */}
        <path d={pathD} className={styles.linePath} fill="none" />
        {/* Points */}
        {pts.map((p) => (
          <circle key={p.week} cx={p.x} cy={p.y} r={4} className={styles.linePoint} />
        ))}
        {/* Labels */}
        {pts.map((p) => (
          <text key={`lbl-${p.week}`} x={p.x} y={p.y - 8} className={styles.pointLabel} textAnchor="middle">
            {p.acc}%
          </text>
        ))}
      </svg>
      <div className={styles.weekLabels}>
        {pts.map((p) => (
          <span key={p.week} className={styles.weekLabel}>{p.week.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

// ---- Word status donut ----
const STATUS_COLORS: Record<string, string> = {
  new: '#94a3b8',
  learning: '#3b82f6',
  review: '#f59e0b',
  mastered: '#22c55e',
};

function WordDonut({ breakdown, t }: { breakdown: Record<string, number>; t: any }) {
  const statuses = ['new', 'learning', 'review', 'mastered'];
  const labels: Record<string, string> = {
    new: t.profile.wordStatusNew,
    learning: t.profile.wordStatusLearning,
    review: t.profile.wordStatusReview,
    mastered: t.profile.wordStatusMastered,
  };
  const total = statuses.reduce((s, k) => s + (breakdown[k] ?? 0), 0);

  if (total === 0) {
    return <p className={styles.empty}>{t.profile.chartNoData}</p>;
  }

  // SVG donut
  const R = 50; const r = 32; const cx = 65; const cy = 65;
  let cumAngle = -Math.PI / 2;

  const slices = statuses.map((k) => {
    const val = breakdown[k] ?? 0;
    const angle = (val / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { key: k, val, angle, startAngle, endAngle: cumAngle };
  }).filter((s) => s.val > 0);

  function arc(s: typeof slices[0]) {
    const x1 = cx + R * Math.cos(s.startAngle);
    const y1 = cy + R * Math.sin(s.startAngle);
    const x2 = cx + R * Math.cos(s.endAngle);
    const y2 = cy + R * Math.sin(s.endAngle);
    const ix1 = cx + r * Math.cos(s.startAngle);
    const iy1 = cy + r * Math.sin(s.startAngle);
    const ix2 = cx + r * Math.cos(s.endAngle);
    const iy2 = cy + r * Math.sin(s.endAngle);
    const large = s.angle > Math.PI ? 1 : 0;
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${r},${r} 0 ${large},0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
  }

  return (
    <div className={styles.donutWrapper}>
      <svg viewBox="0 0 130 130" className={styles.donutSvg}>
        {slices.map((s) => (
          <path key={s.key} d={arc(s)} fill={STATUS_COLORS[s.key]} className={styles.donutSlice} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className={styles.donutTotal}>{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className={styles.donutTotalLabel}>слов</text>
      </svg>
      <div className={styles.donutLegend}>
        {statuses.map((k) => (
          breakdown[k] ? (
            <div key={k} className={styles.donutLegendItem}>
              <span className={styles.donutDot} style={{ background: STATUS_COLORS[k] }} />
              <span className={styles.donutLabel}>{labels[k]}</span>
              <span className={styles.donutVal}>{breakdown[k]}</span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}
