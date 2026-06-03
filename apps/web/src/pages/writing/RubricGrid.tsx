import { CheckCheck, BookOpen, GraduationCap, MessageSquare } from 'lucide-react';
import styles from './RubricGrid.module.css';

/**
 * SavoirX-style writing rubric card.
 *
 * Renders the four DELF-style criteria as a flat grid of cards. Each
 * card shows: criterion name, big letter grade, raw score, slim bar.
 * The previous ScoreBar component was just bars — readable but it
 * looked like a settings panel, not a graded essay. This reads like
 * a real exam rubric.
 *
 * Letter-grade scale matches typical academic rubrics:
 *   ≥90% A · 85% A− · 80% B+ · 75% B · 70% B− · 65% C+ · 60% C ·
 *   55% C− · 50% D+ · below D
 */

export type RubricCriterion = 'task' | 'coherence' | 'vocabulary' | 'grammar';

interface RubricGridProps {
  scores: {
    taskCompletion: number;
    coherence: number;
    vocabulary: number;
    grammar: number;
    taskMax?: number;
    cohMax?: number;
    vocMax?: number;
    gramMax?: number;
    total: number;
    maxTotal: number;
  };
  labels: {
    task: string;
    coherence: string;
    vocabulary: string;
    grammar: string;
    overallLabel: string;
  };
}

function letterGrade(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 85) return 'A−';
  if (pct >= 80) return 'B+';
  if (pct >= 75) return 'B';
  if (pct >= 70) return 'B−';
  if (pct >= 65) return 'C+';
  if (pct >= 60) return 'C';
  if (pct >= 55) return 'C−';
  if (pct >= 50) return 'D+';
  return 'D';
}

function gradeTone(pct: number): 'good' | 'mid' | 'low' {
  if (pct >= 75) return 'good';
  if (pct >= 55) return 'mid';
  return 'low';
}

interface CellProps {
  icon: React.ReactNode;
  label: string;
  score: number;
  max: number;
}

function Cell({ icon, label, score, max }: CellProps) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const grade = letterGrade(pct);
  const tone = gradeTone(pct);
  return (
    <div className={`${styles.cell} ${styles[tone]}`}>
      <div className={styles.head}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.grade}>{grade}</div>
      <div className={styles.score}>{score} / {max}</div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RubricGrid({ scores, labels }: RubricGridProps) {
  const taskMax = scores.taskMax ?? Math.round(scores.maxTotal * 0.4);
  const cohMax = scores.cohMax ?? Math.round(scores.maxTotal * 0.3);
  const vocMax = scores.vocMax ?? Math.round(scores.maxTotal * 0.2);
  const gramMax = scores.gramMax ?? Math.round(scores.maxTotal * 0.1);

  const overallPct = scores.maxTotal > 0 ? Math.round((scores.total / scores.maxTotal) * 100) : 0;
  const overallGrade = letterGrade(overallPct);
  const overallTone = gradeTone(overallPct);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.overall} ${styles[overallTone]}`}>
        <div className={styles.overallGrade}>{overallGrade}</div>
        <div className={styles.overallText}>
          <div className={styles.overallLabel}>{labels.overallLabel}</div>
          <div className={styles.overallScore}>{scores.total} / {scores.maxTotal} · {overallPct}%</div>
        </div>
      </div>
      <div className={styles.grid}>
        <Cell icon={<CheckCheck size={18} />} label={labels.task} score={scores.taskCompletion} max={taskMax} />
        <Cell icon={<MessageSquare size={18} />} label={labels.coherence} score={scores.coherence} max={cohMax} />
        <Cell icon={<BookOpen size={18} />} label={labels.vocabulary} score={scores.vocabulary} max={vocMax} />
        <Cell icon={<GraduationCap size={18} />} label={labels.grammar} score={scores.grammar} max={gramMax} />
      </div>
    </div>
  );
}
