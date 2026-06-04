import { CheckCheck, BookOpen, GraduationCap, MessageSquare, Users, Pencil, AlignLeft } from 'lucide-react';
import styles from './RubricGrid.module.css';

/**
 * SavoirX-style writing rubric card — now 7 dimensions, deeper than the
 * canonical DELF 4-5 grid. The extra three (sociolinguistic register,
 * spelling, presentation) make the grading both more granular for the
 * learner and a stronger trust signal on the marketing surfaces ("we
 * grade on 7 dimensions, they grade on 5").
 *
 * Legacy submissions saved before this rollout don't carry the new
 * fields — sociolinguistic/spelling/presentation render as null/skipped
 * via the `?? null` guards below, so old results don't crash.
 */

export type RubricCriterion =
  | 'task' | 'coherence' | 'vocabulary' | 'grammar'
  | 'sociolinguistic' | 'spelling' | 'presentation';

interface RubricGridProps {
  scores: {
    taskCompletion: number;
    coherence: number;
    vocabulary: number;
    grammar: number;
    sociolinguistic?: number | null;
    spelling?: number | null;
    presentation?: number | null;
    taskMax?: number;
    cohMax?: number;
    vocMax?: number;
    gramMax?: number;
    socioMax?: number;
    spellMax?: number;
    presMax?: number;
    total: number;
    maxTotal: number;
  };
  labels: {
    task: string;
    coherence: string;
    vocabulary: string;
    grammar: string;
    sociolinguistic: string;
    spelling: string;
    presentation: string;
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
  const taskMax  = scores.taskMax  ?? Math.round(scores.maxTotal * 0.32);
  const cohMax   = scores.cohMax   ?? Math.round(scores.maxTotal * 0.24);
  const vocMax   = scores.vocMax   ?? Math.round(scores.maxTotal * 0.16);
  const gramMax  = scores.gramMax  ?? Math.round(scores.maxTotal * 0.12);
  const socioMax = scores.socioMax ?? Math.round(scores.maxTotal * 0.08);
  const spellMax = scores.spellMax ?? Math.round(scores.maxTotal * 0.08);
  const presMax  = scores.presMax  ?? Math.max(1, Math.round(scores.maxTotal * 0.04));

  const overallPct = scores.maxTotal > 0 ? Math.round((scores.total / scores.maxTotal) * 100) : 0;
  const overallGrade = letterGrade(overallPct);
  const overallTone = gradeTone(overallPct);

  // Legacy submissions (4-category, before the rubric extension) won't
  // carry the new score fields. Render only the four core cells in
  // that case to avoid showing empty / wrong-zero new dimensions.
  const hasExtended =
    scores.sociolinguistic != null
    || scores.spelling != null
    || scores.presentation != null;

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
        <Cell icon={<CheckCheck size={18} />}     label={labels.task}        score={scores.taskCompletion}        max={taskMax}  />
        <Cell icon={<MessageSquare size={18} />}  label={labels.coherence}   score={scores.coherence}             max={cohMax}   />
        <Cell icon={<BookOpen size={18} />}       label={labels.vocabulary}  score={scores.vocabulary}            max={vocMax}   />
        <Cell icon={<GraduationCap size={18} />}  label={labels.grammar}     score={scores.grammar}               max={gramMax}  />
        {hasExtended && (
          <>
            <Cell icon={<Users size={18} />}      label={labels.sociolinguistic} score={scores.sociolinguistic ?? 0} max={socioMax} />
            <Cell icon={<Pencil size={18} />}     label={labels.spelling}        score={scores.spelling ?? 0}        max={spellMax} />
            <Cell icon={<AlignLeft size={18} />}  label={labels.presentation}    score={scores.presentation ?? 0}    max={presMax}  />
          </>
        )}
      </div>
    </div>
  );
}
