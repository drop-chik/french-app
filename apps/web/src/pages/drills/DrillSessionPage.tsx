import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Trophy, Sparkles, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { drillsApi, type DrillQuestion, type SubmitResult, type GrammarLink } from '../../features/drills/api';
import { useI18n } from '../../shared/i18n';
import styles from './DrillSessionPage.module.css';

interface Props { slug: string }
type Phase = 'playing' | 'result';

function GrammarLinkCard({ link }: { link: GrammarLink }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  if (link.status === 'completed') {
    return (
      <div className={styles.grammarCompleted}>
        <CheckCircle size={14} className={styles.grammarCompletedIcon} />
        <span>{t.drills.grammarLinkCompleted}: <strong>{link.title}</strong></span>
      </div>
    );
  }

  const isInProgress = link.status === 'in_progress';
  return (
    <div className={`${styles.grammarCard} ${isInProgress ? styles.grammarCardProgress : ''}`}>
      <BookOpen size={16} className={styles.grammarCardIcon} />
      <div className={styles.grammarCardBody}>
        <span className={styles.grammarCardLabel}>
          {isInProgress ? t.drills.grammarLinkInProgress : t.drills.grammarLinkNotStarted}
        </span>
        <span className={styles.grammarCardTitle}>{link.title}</span>
      </div>
      <button
        className={styles.grammarCardBtn}
        onClick={() => navigate({ to: '/grammar/$slug', params: { slug: link.slug } })}
      >
        {isInProgress ? t.drills.grammarLinkContinueBtn : t.drills.grammarLinkBtn}
      </button>
    </div>
  );
}

function checkAnswersLocally(
  questions: DrillQuestion[],
  answers: Record<string, unknown>,
): SubmitResult {
  let correct = 0;
  const results: Record<string, { isCorrect: boolean; correctAnswer: unknown }> = {};

  for (const q of questions) {
    const userAnswer = answers[q.id];
    const ans = q.answer as Record<string, unknown>;
    let isCorrect = false;

    if (q.type === 'multiple_choice') {
      isCorrect =
        String(userAnswer).trim().toLowerCase() === String(ans['correct']).trim().toLowerCase();
      results[q.id] = { isCorrect, correctAnswer: ans['correct'] };
    } else {
      const values = ans['values'] as string[];
      const userValues = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      isCorrect = values.every(
        (v, i) =>
          String(userValues[i] ?? '')
            .trim()
            .toLowerCase() === v.trim().toLowerCase(),
      );
      results[q.id] = { isCorrect, correctAnswer: values };
    }
    if (isCorrect) correct++;
  }

  const total = questions.length;
  return { score: Math.round((correct / total) * 100), correct, total, results };
}

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
  const text = q['text'] as string;

  if (question.type === 'multiple_choice') {
    const options = q['options'] as string[];
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

  const blanks = (q['blanks'] as number) ?? 1;
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
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const drill = data?.drill;

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<Phase>('playing');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [isInfinite, setIsInfinite] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<DrillQuestion[] | null>(null);

  const questions = activeQuestions ?? drill?.questions ?? [];

  const submitMutation = useMutation({
    mutationFn: (ans: Record<string, unknown>) => drillsApi.submit(slug, ans),
    onSuccess: (result) => {
      setSubmitResult(result);
      setPhase('result');
      queryClient.invalidateQueries({ queryKey: ['drills'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => drillsApi.generateInfinite(slug),
    onSuccess: (data) => {
      setActiveQuestions(data.questions);
      setAnswers({});
      setPhase('playing');
      setSubmitResult(null);
      setIsInfinite(true);
    },
  });

  const handleSubmit = () => {
    if (isInfinite) {
      const result = checkAnswersLocally(questions, answers);
      setSubmitResult(result);
      setPhase('result');
    } else {
      submitMutation.mutate(answers);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setPhase('playing');
    setSubmitResult(null);
    if (!isInfinite) {
      queryClient.invalidateQueries({ queryKey: ['drill-session', slug] });
    }
  };

  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => {
      const a = answers[q.id];
      if (q.type === 'multiple_choice') return !!a;
      const blanks = ((q.question as Record<string, unknown>)['blanks'] as number) ?? 1;
      return Array.isArray(a) ? a.length === blanks && a.every((v) => v.trim() !== '') : false;
    });

  if (isLoading) return <div className={styles.loading}>{t.drills.loading}</div>;
  if (!drill) return <div className={styles.loading}>{t.drills.notFound}</div>;

  /* ── Result ─────────────────────────────────────────────────── */
  if (phase === 'result' && submitResult) {
    const { score, correct, total, results } = submitResult;
    const isPerfect = score === 100;
    const resultLabel = String(t.drills.resultCorrect)
      .replace('{correct}', String(correct))
      .replace('{total}', String(total));

    return (
      <div className={styles.page}>
        <button className={styles.backButton} onClick={() => navigate({ to: '/drills' })}>
          <ArrowLeft size={16} /> {t.drills.back}
        </button>

        <motion.div
          className={styles.resultCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isInfinite && (
            <div className={styles.infiniteBadge}>
              <Zap size={12} /> {t.drills.infiniteBadge}
            </div>
          )}

          <div className={styles.resultScore}>
            <Trophy size={32} className={styles.trophyIcon} />
            <span className={styles.resultPercent}>{score}%</span>
            <span className={styles.resultLabel}>{resultLabel}</span>
          </div>

          {isPerfect && (
            <motion.div
              className={styles.infiniteUnlocked}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
            >
              <p className={styles.infiniteUnlockedText}>{t.drills.infiniteUnlocked}</p>
              <button
                className={styles.infiniteBtn}
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <Sparkles size={16} />
                {generateMutation.isPending
                  ? t.drills.generating
                  : isInfinite
                    ? t.drills.infiniteAgain
                    : t.drills.infiniteBtn}
              </button>
            </motion.div>
          )}

          <div className={styles.resultAnswers}>
            {questions.map((q, idx) => {
              const res = results[q.id];
              const qText = (q.question as Record<string, unknown>)['text'] as string;
              return (
                <div
                  key={q.id}
                  className={`${styles.resultItem} ${res?.isCorrect ? styles.correct : styles.wrong}`}
                >
                  <div className={styles.resultIcon}>
                    {res?.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className={styles.resultItemBody}>
                    <span className={styles.resultQuestion}>
                      {idx + 1}. {qText}
                    </span>
                    {!res?.isCorrect && (
                      <span className={styles.resultExplanation}>
                        ✓{' '}
                        {Array.isArray(res?.correctAnswer)
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
        </motion.div>
      </div>
    );
  }

  /* ── Playing ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate({ to: '/drills' })}>
        <ArrowLeft size={16} /> {t.drills.back}
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>{drill.title}</h1>
        <div className={styles.headerMeta}>
          <span className={styles.levelBadge}>{drill.level}</span>
          {isInfinite && (
            <span className={styles.infiniteBadge}>
              <Zap size={12} /> {t.drills.infiniteBadge}
            </span>
          )}
        </div>
      </div>
      <p className={styles.desc}>{drill.description}</p>

      {drill.grammarLink && !isInfinite && (
        <GrammarLinkCard link={drill.grammarLink} />
      )}

      <div className={styles.progress}>
        {questions.map((q) => (
          <div
            key={q.id}
            className={`${styles.progressDot} ${answers[q.id] !== undefined ? styles.progressDotDone : ''}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isInfinite ? 'infinite' : 'normal'}
          className={styles.questions}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              answer={answers[q.id]}
              onAnswer={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              disabled={submitMutation.isPending}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <button
        className={styles.submitButton}
        disabled={!allAnswered || submitMutation.isPending}
        onClick={handleSubmit}
      >
        {submitMutation.isPending ? t.drills.checking : t.drills.submit}
      </button>
    </div>
  );
}
