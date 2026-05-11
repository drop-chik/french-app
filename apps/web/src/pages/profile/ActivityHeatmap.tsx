import { TrendingUp, Calendar, Flame } from 'lucide-react';
import styles from './ActivityHeatmap.module.css';

interface ActivityHeatmapProps {
  activity: { date: string; reviewed: number; correct: number; incorrect: number }[];
  labels: {
    title: string;
    less: string;
    more: string;
    activeDays: string;
    words: string;
    bestDay: string;
    avgPerDay: string;
    longestStreak: string;
    noData: string;
  };
  lang: 'ru' | 'en';
}

function getColor(reviewed: number): string {
  if (reviewed === 0) return 'var(--color-border)';
  if (reviewed <= 3)  return 'rgba(249,115,22,0.22)';
  if (reviewed <= 10) return 'rgba(249,115,22,0.45)';
  if (reviewed <= 25) return 'rgba(249,115,22,0.72)';
  return '#f97316';
}

const DAY_LABELS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ActivityHeatmap(props: ActivityHeatmapProps) {
  const { activity, labels, lang } = props;
  const today = new Date().toISOString().slice(0, 10);
  const activeDays = activity.filter((d) => d.reviewed > 0).length;
  const totalDays = activity.length;
  const dayLabels = lang === 'ru' ? DAY_LABELS_RU : DAY_LABELS_EN;

  // Build padded weekly grid (Mon=0..Sun=6 rows)
  const firstDate = new Date(activity[0]!.date + 'T12:00:00');
  const firstDow = (firstDate.getDay() + 6) % 7;
  const cells: ({ date: string; reviewed: number } | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...activity,
  ];
  const remainder = cells.length % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null);
  }
  const numWeeks = cells.length / 7;

  // Month labels per week column
  const monthFmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' });
  const monthByWeek: (string | null)[] = [];
  let lastMonth = -1;
  for (let w = 0; w < numWeeks; w++) {
    const firstCell = cells.slice(w * 7, w * 7 + 7).find((c) => c !== null);
    if (!firstCell) { monthByWeek.push(null); continue; }
    const d = new Date(firstCell.date + 'T12:00:00');
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthByWeek.push(monthFmt.format(d));
      lastMonth = m;
    } else {
      monthByWeek.push(null);
    }
  }

  // ── Stats ──
  const bestDay = activity.reduce<typeof activity[0] | null>(
    (best, d) => (d.reviewed > (best?.reviewed ?? 0) ? d : best),
    null,
  );
  const avgPerActiveDay = activeDays > 0
    ? Math.round(activity.reduce((s, d) => s + d.reviewed, 0) / activeDays)
    : 0;

  // Longest streak within the activity window
  let longestStreak = 0;
  let currentStreak = 0;
  for (const d of activity) {
    if (d.reviewed > 0) {
      currentStreak++;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const dateFmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
  const bestDayFmt = bestDay && bestDay.reviewed > 0
    ? dateFmt.format(new Date(bestDay.date + 'T12:00:00'))
    : '—';

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{labels.title}</h2>
        <span className={styles.activeDays}>
          {labels.activeDays.replace('{n}', String(activeDays)).replace('90', String(totalDays))}
        </span>
      </div>

      <div className={styles.body}>
        {/* Heatmap (left side, fixed size) */}
        <div className={styles.heatmapOuter}>
          <div className={styles.dayLabels}>
            <span className={styles.daySpacer} />
            {dayLabels.map((d, i) => (
              <span key={i} className={styles.dayLabel}>
                {i % 2 === 0 ? d : ''}
              </span>
            ))}
          </div>

          <div className={styles.gridArea}>
            <div
              className={styles.monthLabelsRow}
              style={{ gridTemplateColumns: `repeat(${numWeeks}, var(--cell))` }}
            >
              {monthByWeek.map((label, w) => (
                <span key={w} className={styles.monthLabel}>{label ?? ''}</span>
              ))}
            </div>
            <div
              className={styles.grid}
              style={{ gridTemplateColumns: `repeat(${numWeeks}, var(--cell))` }}
            >
              {cells.map((d, i) => (
                <div
                  key={i}
                  className={`${styles.cell} ${d?.date === today ? styles.cellToday : ''}`}
                  style={{ background: d ? getColor(d.reviewed) : 'transparent' }}
                  title={d ? `${d.date}: ${d.reviewed} ${labels.words}` : ''}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats panel (right side) */}
        <div className={styles.stats}>
          <StatRow
            icon={<TrendingUp size={16} />}
            label={labels.bestDay}
            value={bestDay && bestDay.reviewed > 0 ? `${bestDay.reviewed}` : '—'}
            sub={bestDay && bestDay.reviewed > 0 ? bestDayFmt : labels.noData}
            color="#f97316"
          />
          <StatRow
            icon={<Calendar size={16} />}
            label={labels.avgPerDay}
            value={avgPerActiveDay > 0 ? `${avgPerActiveDay}` : '—'}
            sub={labels.words}
            color="#3b82f6"
          />
          <StatRow
            icon={<Flame size={16} />}
            label={labels.longestStreak}
            value={longestStreak > 0 ? `${longestStreak}` : '—'}
            sub={lang === 'ru' ? 'дн.' : 'd'}
            color="#ef4444"
          />
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendText}>{labels.less}</span>
        <div className={styles.legendCells}>
          <div className={styles.legendCell} style={{ background: 'var(--color-border)' }} />
          <div className={styles.legendCell} style={{ background: 'rgba(249,115,22,0.22)' }} />
          <div className={styles.legendCell} style={{ background: 'rgba(249,115,22,0.45)' }} />
          <div className={styles.legendCell} style={{ background: 'rgba(249,115,22,0.72)' }} />
          <div className={styles.legendCell} style={{ background: '#f97316' }} />
        </div>
        <span className={styles.legendText}>{labels.more}</span>
      </div>
    </section>
  );
}

function StatRow({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className={styles.statRow}>
      <div className={styles.statIcon} style={{ color, background: `${color}1a` }}>
        {icon}
      </div>
      <div className={styles.statText}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statValueLine}>
          <span className={styles.statValue}>{value}</span>
          <span className={styles.statSub}>{sub}</span>
        </div>
      </div>
    </div>
  );
}
