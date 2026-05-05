import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { drillsApi, type DrillQuestion } from '../../features/drills/api';
import { useI18n } from '../../shared/i18n';
import styles from './DrillSessionPage.module.css';

interface Props { slug: string }
type Phase = 'playing' | 'result';

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
  disabled,
}: {
  question: DrillQuestion;
  index: number;
  answer: unknown;
  onAnswer: (v: unknown) => void;
  disabled: boolean;
}) {
  const q = question.question as Record<string, unknown>;
  const text = q.text as string;

  if (question.type === 'multiple_choice') {
    const options = q.options as string[];
    return (
      <div className={styles.questionCard}>
        <p className={styles.questionText}>
          <span className={styles.questionNum}>{index + 1}.</span> {text}
        </p>
        <div className={styles.options}>
          {options.map((opt) => (
            <button
              key={opt}
              className={`${styles.option} ${answer === opt ? styles.optionSelected : ''}`}
              onClick={() => !disabled && onAnswer(opt)}
              disabled={disabled}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // fill_blank
  const blanks = (q.blanks as number) ?? 1;
  const parts = text.split('___');
  const userValues = (answer as string[] | undefined) ?? Array(blanks).fill('');

  const handleChange = (i: number, val: string) => {
    const next = [...userValues];
    next[i] = val;
    onAnswer(next);
  };

  return (
    <div className={styles.questionCard}>
      <p className={styles.questionText}>
        <span className={styles.questionNum}>{index + 1}.</span>{' '}
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                className={styles.blankInput}
                value={userValues[i] ?? ''}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={disabled}
                placeholder="..."
              />
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

export function DrillSessionPage({ slug }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang, t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['drill-session', slug, lang],
    queryFn: () => drillsApi.getSession(slug, lang),
    staleTime: 0,
  });

  const drill = data?.drill;
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<Phase>('playing');
  const [submitResult, setSubmitResult] = useState<Awaited<ReturnType<typeof drillsApi.submit>> | null>(null);

  const submitMutation = useMutation({
    mutationFn: (ans: Record<string, unknown>) => drillsApi.submit(slug, ans),
    onSuccess: (result) => {
      setSubmitResult(result);
      setPhase('result');
      queryClient.invalidateQueries({ queryKey: ['drills'] });
    },
  });

  const handleRetry = () => {
    setAnswers({});
    setPhase('playing');
    setSubmitResult(null);
    queryClient.invalidateQueries({ queryKey: ['drill-session', slug] });
  };

  const allAnswered = drill
    ? drill.questions.every((q) => {
        const a = answers[q.id];
        if (q.type === 'multiple_choice') return !!a;
        const blanks = (q.question as Record<string, unknown>).blanks as number ?? 1;
        return Array.isArray(a) ? a.length === blanks && a.every((v) => v.trim() !== '') : false;
      })
    : false;

  if (isLoading) return <div className={styles.loading}>{t.drills.loading}</div>;
  if (!drill) return <div className={styles.loading}>{t.drills.notFound}</div>;

  if (phase === 'result' && submitResult) {
    const { score, correct, total, results } = submitResult;
    const resultLabel = String(t.drills.resultCorrect)
      .replace('{correct}', String(correct))
      .replace('{total}', String(total));

    return (
      <div className={styles.page}>
        <button className={styles.backButton} onClick={() => navigate({ to: '/drills' })}>
          <ArrowLeft size={16} /> {t.drills.back}
        </button>

        <div className={styles.resultCard}>
          <div className={styles.resultScore}>
            <Trophy size={32} className={styles.trophyIcon} />
            <span className={styles.resultPercent}>{score}%</span>
            <span className={styles.resultLabel}>{resultLabel}</span>
          </div>

          <div className={styles.resultAnswers}>
            {drill.questions.map((q, idx) => {
              const res = results[q.id];
              const qText = (q.question as Record<string, unknown>).text as string;
              return (
                <div
                  key={q.id}
                  className={`${styles.resultItem} ${res?.isCorrect ? styles.correct : styles.wrong}`}
                >
                  <div className={styles.resultIcon}>
                    {res?.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className={styles.resultItemBody}>
                    <span className={styles.resultQuestion}>{idx + 1}. {qText}</span>
                    {!res?.isCorrect && (
                      <span className={styles.resultExplanation}>
                        ✓ {Array.isArray(res?.correctAnswer)
                          ? res.correctAnswer.join(', ')
                          : String(res?.correctAnswer ?? '')}
                        {q.explanation && <> — {q.explanation}</>}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.resultActions}>
            <button className={styles.retryBtn} onClick={handleRetry}>
              <RotateCcw size={14} /> {t.drills.retry}
            </button>
            <button className={styles.backBtn} onClick={() => navigate({ to: '/drills' })}>
              {t.drills.backToList}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate({ to: '/drills' })}>
        <ArrowLeft size={16} /> {t.drills.back}
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>{drill.title}</h1>
        <span className={styles.levelBadge}>{drill.level}</span>
      </div>
      <p className={styles.desc}>{drill.description}</p>

      <div className={styles.progress}>
        {drill.questions.map((q) => (
          <div
            key={q.id}
            className={`${styles.progressDot} ${answers[q.id] !== undefined ? styles.progressDotDone : ''}`}
          />
        ))}
      </div>

      <div className={styles.questions}>
        {drill.questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            answer={answers[q.id]}
            onAnswer={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            disabled={submitMutation.isPending}
          />
        ))}
      </div>

      <button
        className={styles.submitButton}
        disabled={!allAnswered || submitMutation.isPending}
        onClick={() => submitMutation.mutate(answers)}
      >
        {submitMutation.isPending ? t.drills.checking : t.drills.submit}
      </button>
    </div>
  );
}
