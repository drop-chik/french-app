import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { progressionApi, type LevelTestQuestion, type LevelTestResult } from '../../features/progression/api';
import { useAuthStore } from '../../features/auth/authStore';
import { trackEvent } from '../../lib/analytics';
import { useI18n } from '../../shared/i18n';
import styles from './LevelTestPage.module.css';

export function LevelTestPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);

  const startQuery = useQuery({
    queryKey: ['level-test-start'],
    queryFn: progressionApi.startLevelTest,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState<LevelTestResult | null>(null);

  const submitMutation = useMutation({
    mutationFn: progressionApi.submitLevelTest,
    onSuccess: (r) => {
      setResult(r);
      trackEvent('level_test_submit', { passed: r.passed, score: r.score, fromLevel: r.fromLevel });
      if (r.promoted && r.toLevel) updateUser({ level: r.toLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' });
    },
  });

  if (startQuery.isLoading) {
    return <div className={styles.page}><p className={styles.muted}>{t.levelTest.loading}</p></div>;
  }

  if (startQuery.isError) {
    const err = startQuery.error as Error & { details?: { message?: string } };
    const msg = err?.message ?? t.levelTest.errorDefault;
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate({ to: '/dashboard' })}>
          <ArrowLeft size={16} /> {t.levelTest.back}
        </button>
        <div className={styles.errorCard}>
          <h2 className={styles.title}>{t.levelTest.notEligibleTitle}</h2>
          <p className={styles.muted}>{msg}</p>
        </div>
      </div>
    );
  }

  const data = startQuery.data;
  if (!data) return null;
  const questions: LevelTestQuestion[] = data.questions;
  const fromLevel = data.fromLevel;

  if (result) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate({ to: '/dashboard' })}>
          <ArrowLeft size={16} /> {t.levelTest.back}
        </button>
        <div className={result.passed ? styles.passCard : styles.failCard}>
          <div className={styles.bigIcon}>
            {result.passed ? <CheckCircle2 size={64} /> : <XCircle size={64} />}
          </div>
          <h1 className={styles.title}>
            {result.passed ? t.levelTest.passTitle : t.levelTest.failTitle}
          </h1>
          <p className={styles.score}>
            {result.correct}/{result.total} ({Math.round(result.score * 100)}%)
          </p>
          {result.passed && result.toLevel && (
            <p className={styles.passBody}>
              {t.levelTest.passBody.replace('{from}', result.fromLevel).replace('{to}', result.toLevel)}
            </p>
          )}
          {!result.passed && (
            <>
              <p className={styles.failBody}>{t.levelTest.failBody}</p>
              {result.weakAreas.length > 0 && (
                <div className={styles.weakAreas}>
                  <p className={styles.weakAreasTitle}>{t.levelTest.weakAreasTitle}</p>
                  <ul className={styles.weakAreasList}>
                    {result.weakAreas.map((w, i) => (
                      <li key={i}>{w.level} {w.type} — {w.missed} {t.levelTest.missed}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <button className={styles.primaryBtn} onClick={() => navigate({ to: '/dashboard' })}>
            {t.levelTest.goToDashboard}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[position];
  if (!q) return null;
  const selected = answers[q.id];
  const isLast = position === questions.length - 1;
  const allAnswered = questions.every((qq) => answers[qq.id]);

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate({ to: '/dashboard' })}>
        <ArrowLeft size={16} /> {t.levelTest.back}
      </button>
      <div className={styles.header}>
        <p className={styles.subtitle}>{t.levelTest.headerSubtitle.replace('{level}', fromLevel)}</p>
        <h1 className={styles.title}>{t.levelTest.headerTitle}</h1>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${((position + 1) / questions.length) * 100}%` }} />
        </div>
        <p className={styles.progressText}>
          {position + 1} / {questions.length}
        </p>
      </div>

      <div className={styles.qCard}>
        <p className={styles.qLevel}>{q.level} · {q.type}</p>
        <p className={styles.qText}>{q.question}</p>
        <div className={styles.optionsList}>
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.option} ${selected === opt ? styles.optionSelected : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.navRow}>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={position === 0}
          onClick={() => setPosition((p) => p - 1)}
        >
          {t.levelTest.prev}
        </button>
        {isLast ? (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!allAnswered || submitMutation.isPending}
            onClick={() => submitMutation.mutate(answers)}
          >
            {submitMutation.isPending ? t.levelTest.submitting : t.levelTest.submit}
          </button>
        ) : (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!selected}
            onClick={() => setPosition((p) => p + 1)}
          >
            {t.levelTest.next} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
