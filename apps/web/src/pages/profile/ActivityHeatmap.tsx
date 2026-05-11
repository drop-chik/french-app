import styles from './ActivityHeatmap.module.css';

interface ActivityHeatmapProps {
  activity: { date: string; reviewed: number; correct: number; incorrect: number }[];
  labels: {
    title: string;
    less: string;
    more: string;
    activeDays: string;
    words: string;
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

  // Pad the start so the first real cell lands on the correct weekday (Mon=0..Sun=6)
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

  // Build month labels — one slot per week column, show label when month changes
  const monthFmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' });
  const monthByWeek: (string | null)[] = [];
  let lastMonth = -1;
  for (let w = 0; w < numWeeks; w++) {
    const firstCell = cells.slice(w * 7, w * 7 + 7).find((c) => c !== null);
    if (!firstCell) {
      monthByWeek.push(null);
      continue;
    }
    const d = new Date(firstCell.date + 'T12:00:00');
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthByWeek.push(monthFmt.format(d));
      lastMonth = m;
    } else {
      monthByWeek.push(null);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{labels.title}</h2>
        <span className={styles.activeDays}>
          {labels.activeDays.replace('{n}', String(activeDays)).replace('90', String(totalDays))}
        </span>
      </div>

      <div className={styles.heatmapOuter}>
        {/* Day-of-week labels (left column) */}
        <div className={styles.dayLabels}>
          <span className={styles.daySpacer} />
          {dayLabels.map((d, i) => (
            <span key={i} className={styles.dayLabel}>
              {i % 2 === 0 ? d : ''}
            </span>
          ))}
        </div>

        {/* Grid area: month labels row + cells grid */}
        <div className={styles.gridArea}>
          <div
            className={styles.monthLabelsRow}
            style={{ gridTemplateColumns: `repeat(${numWeeks}, minmax(0, 1fr))` }}
          >
            {monthByWeek.map((label, w) => (
              <span key={w} className={styles.monthLabel}>
                {label ?? ''}
              </span>
            ))}
          </div>
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${numWeeks}, minmax(0, 1fr))` }}
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
