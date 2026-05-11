import { Link } from '@tanstack/react-router';
import { Zap, CheckCircle2, ArrowRight, BookOpen, Headphones, BookText } from 'lucide-react';
import { useCountUp } from './useCountUp';
import styles from './InsightGrid.module.css';

interface NextItem {
  slug?: string;
  id?: string;
  title: string;
}

interface InsightGridProps {
  wordsBreakdown: Record<string, number>;
  wordsDueToday: number;
  grammarCompleted: number;
  grammarTotal: number;
  listeningCompleted: number;
  listeningTotal: number;
  nextGrammar: { slug: string; title: string; status: string } | null;
  nextListening: { id: string; title: string; durationSec: number } | null;
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
    continueTitle: string;
    continueGrammar: string;
    continueListening: string;
    continueReading: string;
    continueReadingSub: string;
    continueAllDone: string;
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
      <ContinueLearningInsight
        nextGrammar={props.nextGrammar}
        nextListening={props.nextListening}
        grammarCompleted={props.grammarCompleted}
        grammarTotal={props.grammarTotal}
        listeningCompleted={props.listeningCompleted}
        listeningTotal={props.listeningTotal}
        labels={{
          title: props.labels.continueTitle,
          grammar: props.labels.continueGrammar,
          listening: props.labels.continueListening,
          reading: props.labels.continueReading,
          readingSub: props.labels.continueReadingSub,
          allDone: props.labels.continueAllDone,
        }}
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

// ── 3) Continue Learning — actionable next steps with progress ───────────────

function ContinueLearningInsight({
  nextGrammar,
  nextListening,
  grammarCompleted,
  grammarTotal,
  listeningCompleted,
  listeningTotal,
  labels,
}: {
  nextGrammar: { slug: string; title: string; status: string } | null;
  nextListening: { id: string; title: string; durationSec: number } | null;
  grammarCompleted: number;
  grammarTotal: number;
  listeningCompleted: number;
  listeningTotal: number;
  labels: {
    title: string;
    grammar: string;
    listening: string;
    reading: string;
    readingSub: string;
    allDone: string;
  };
}) {
  const grammarPct = grammarTotal > 0 ? (grammarCompleted / grammarTotal) * 100 : 0;
  const listeningPct = listeningTotal > 0 ? (listeningCompleted / listeningTotal) * 100 : 0;

  const allDone = !nextGrammar && !nextListening;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{labels.title}</h3>

      {allDone ? (
        <div className={styles.doneWrap}>
          <CheckCircle2 size={40} className={styles.doneIcon} />
          <p className={styles.doneText}>{labels.allDone}</p>
        </div>
      ) : (
        <div className={styles.continueList}>
          {nextGrammar && (
            <ContinueRow
              icon={<BookOpen size={16} />}
              category={labels.grammar}
              title={nextGrammar.title}
              progress={grammarPct}
              progressText={`${grammarCompleted}/${grammarTotal}`}
              color="#8b5cf6"
              to={`/grammar/${nextGrammar.slug}` as const}
            />
          )}
          {nextListening && (
            <ContinueRow
              icon={<Headphones size={16} />}
              category={labels.listening}
              title={nextListening.title}
              progress={listeningPct}
              progressText={`${listeningCompleted}/${listeningTotal}`}
              color="#3b82f6"
              to={`/listening/${nextListening.id}` as const}
            />
          )}
          <ContinueRow
            icon={<BookText size={16} />}
            category={labels.reading}
            title={labels.readingSub}
            color="#ec4899"
            to="/reading"
            standalone
          />
        </div>
      )}
    </div>
  );
}

function ContinueRow({
  icon,
  category,
  title,
  progress,
  progressText,
  color,
  to,
  standalone,
}: {
  icon: React.ReactNode;
  category: string;
  title: string;
  progress?: number;
  progressText?: string;
  color: string;
  to: string;
  standalone?: boolean;
}) {
  return (
    <Link to={to} className={styles.continueRow}>
      <div className={styles.continueIcon} style={{ color, background: `${color}1a` }}>
        {icon}
      </div>
      <div className={styles.continueText}>
        <span className={styles.continueCategory}>{category}</span>
        <span className={styles.continueTitle}>{title}</span>
        {!standalone && progress !== undefined && (
          <div className={styles.continueProgress}>
            <div className={styles.continueTrack}>
              <div
                className={styles.continueFill}
                style={{ width: `${progress}%`, background: color }}
              />
            </div>
            {progressText && <span className={styles.continueProgressText}>{progressText}</span>}
          </div>
        )}
      </div>
      <ArrowRight size={16} className={styles.continueArrow} />
    </Link>
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
