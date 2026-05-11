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
  if (reviewed <= 3)  return 'rgba(249,115,22,0.20)';
  if (reviewed <= 10) return 'rgba(249,115,22,0.45)';
  if (reviewed <= 25) return 'rgba(249,115,22,0.72)';
  return '#f97316';
}

const DAY_LABELS_RU = ['', 'Пн', '', 'Ср', '', 'Пт', ''];
const DAY_LABELS_EN = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityHeatmap(props: ActivityHeatmapProps) {
  const { activity, labels, lang } = props;
  const today = new Date().toISOString().slice(0, 10);
  const activeDays = activity.filter((d) => d.reviewed > 0).length;
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

  // Build month labels — show when month changes between weeks
  const monthFmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' });
  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < numWeeks; w++) {
    // First non-null cell in this week
    const firstCell = cells.slice(w * 7, w * 7 + 7).find((c) => c !== null);
    if (!firstCell) continue;
    const d = new Date(firstCell.date + 'T12:00:00');
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ week: w, label: monthFmt.format(d) });
      lastMonth = m;
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{labels.title}</h2>
        <span className={styles.activeDays}>
          {labels.activeDays.replace('{n}', String(activeDays))}
        </span>
      </div>

      <div className={styles.heatmapScroll}>
        <div className={styles.heatmapOuter}>
          <div className={styles.dayLabels}>
            {dayLabels.map((d, i) => (
              <span key={i} className={styles.dayLabel}>{d}</span>
            ))}
          </div>
          <div className={styles.gridWrap}>
            <div
              className={styles.monthLabels}
              style={{ gridTemplateColumns: `repeat(${numWeeks}, var(--cell))` }}
            >
              {Array.from({ length: numWeeks }, (_, w) => {
                const ml = monthLabels.find((m) => m.week === w);
                return (
                  <span key={w} className={styles.monthLabel}>
                    {ml ? ml.label : ''}
                  </span>
                );
              })}
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
      </div>

      <div className={styles.legend}>
        <span className={styles.legendText}>{labels.less}</span>
        <div className={styles.legendCells}>
          <div className={styles.legendCell} style={{ background: 'var(--color-border)' }} />
          <div className={styles.legendCell} style={{ background: 'rgba(249,115,22,0.20)' }} />
          <div className={styles.legendCell} style={{ background: 'rgba(249,115,22,0.45)' }} />
          <div className={styles.legendCell} style={{ background: 'rgba(249,115,22,0.72)' }} />
          <div className={styles.legendCell} style={{ background: '#f97316' }} />
        </div>
        <span className={styles.legendText}>{labels.more}</span>
      </div>
    </section>
  );
}
