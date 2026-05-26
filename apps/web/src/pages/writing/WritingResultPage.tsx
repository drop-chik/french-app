import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { writingApi, type WritingCorrection } from './api';
import { useI18n } from '../../shared/i18n';
import styles from './WritingResultPage.module.css';

interface Props {
  id: string;
}

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreLabel}>
        <span>{label}</span>
        <span className={styles.scoreValue}>{score}/{max}</span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${pct >= 70 ? styles.barGood : pct >= 50 ? styles.barMed : styles.barLow}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CorrectionCard({ c, labels }: { c: WritingCorrection; labels: { yourText: string; correction: string; explanation: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.correctionCard} ${styles[`sev${c.severity}`]}`}>
      <button className={styles.correctionToggle} onClick={() => setOpen((v) => !v)}>
        <span className={`${styles.severityDot} ${styles[`dot${c.severity}`]}`} />
        <span className={styles.correctionOriginal}>{c.original}</span>
        {open ? <ChevronUp size={14} className={styles.chevron} /> : <ChevronDown size={14} className={styles.chevron} />}
      </button>
      {open && (
        <div className={styles.correctionBody}>
          <div className={styles.correctionRow}>
            <span className={styles.correctionMeta}>{labels.correction}</span>
            <span className={styles.correctionText}>{c.corrected}</span>
          </div>
          <div className={styles.correctionRow}>
            <span className={styles.correctionMeta}>{labels.explanation}</span>
            <span className={styles.correctionText}>{c.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WritingResultPage({ id }: Props) {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const tw = t.writing;

  const { data, isLoading } = useQuery({
    queryKey: ['writing-submission', id],
    queryFn: () => writingApi.getSubmissionById(id),
  });

  const feedbackMutation = useMutation({
    mutationFn: () => writingApi.generateFeedback(id),
    onSuccess: () => {
      void window.location.reload();
    },
  });

  const submission = data?.submission;
  const feedback = submission?.feedback;
  const prompt = submission?.prompt;

  useEffect(() => {
    if (submission && !feedback && submission.status === 'submitted' && !feedbackMutation.isPending && !feedbackMutation.isError) {
      feedbackMutation.mutate();
    }
  }, [submission, feedback]);

  const getTitle = () => {
    if (!prompt) return '';
    return lang === 'ru' ? prompt.titleRu : prompt.titleEn;
  };

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Loader2 size={32} className={styles.spinner} />
        <p>{tw.loading}</p>
      </div>
    );
  }

  if (!submission) {
    return <div className={styles.center}>{tw.submissionNotFound}</div>;
  }

  const sortedCorrections = feedback
    ? [...feedback.corrections].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
    : [];

  const totalPct = feedback
    ? Math.round((feedback.scores.total / feedback.scores.maxTotal) * 100)
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate({ to: '/writing' })}>
          {tw.back}
        </button>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{tw.resultTitle}</h1>
          {prompt && <p className={styles.subtitle}>{getTitle()}</p>}
        </div>
        {feedback && (
          <div className={styles.totalScore}>
            <span className={`${styles.totalPct} ${totalPct >= 70 ? styles.pctGood : totalPct >= 50 ? styles.pctMed : styles.pctLow}`}>
              {totalPct}%
            </span>
            <span className={styles.totalRaw}>
              {tw.scoreTotal.replace('{score}', String(feedback.scores.total)).replace('{max}', String(feedback.scores.maxTotal))}
            </span>
          </div>
        )}
      </div>

      {!feedback && submission.status === 'submitted' && (
        <div className={styles.feedbackPrompt}>
          {feedbackMutation.isError ? (
            <div className={styles.feedbackError}>
              <AlertCircle size={20} />
              <span>{tw.errorFeedback}</span>
              <button className={styles.btnPrimary} onClick={() => feedbackMutation.mutate()}>
                {tw.retryFeedback}
              </button>
            </div>
          ) : (
            <div className={styles.feedbackLoading}>
              <Loader2 size={32} className={styles.spinner} />
              <span>{tw.loadingFeedback}</span>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div className={styles.content}>
          {/* Scores */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{tw.sectionScores}</h2>
            <div className={styles.scoresGrid}>
              <ScoreBar
                label={tw.taskCompletion}
                score={feedback.scores.taskCompletion}
                max={feedback.scores.taskMax ?? Math.round(feedback.scores.maxTotal * 0.4)}
              />
              <ScoreBar
                label={tw.coherence}
                score={feedback.scores.coherence}
                max={feedback.scores.cohMax ?? Math.round(feedback.scores.maxTotal * 0.3)}
              />
              <ScoreBar
                label={tw.vocabulary}
                score={feedback.scores.vocabulary}
                max={feedback.scores.vocMax ?? Math.round(feedback.scores.maxTotal * 0.2)}
              />
              <ScoreBar
                label={tw.grammar}
                score={feedback.scores.grammar}
                max={feedback.scores.gramMax ?? Math.round(feedback.scores.maxTotal * 0.1)}
              />
            </div>
          </section>

          {/* Overall comment */}
          {feedback.overallComment && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{tw.overallComment}</h2>
              <p className={styles.overallText}>{feedback.overallComment}</p>
            </section>
          )}

          {/* Strengths & Improvements */}
          {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
            <section className={styles.section}>
              <div className={styles.twoCol}>
                {feedback.strengths.length > 0 && (
                  <div className={styles.strengthsBox}>
                    <h3 className={styles.subTitle}>{tw.sectionStrengths}</h3>
                    <ul className={styles.bulletList}>
                      {feedback.strengths.map((s, i) => (
                        <li key={i} className={styles.bulletGood}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.improvements.length > 0 && (
                  <div className={styles.improvementsBox}>
                    <h3 className={styles.subTitle}>{tw.sectionImprovements}</h3>
                    <ul className={styles.bulletList}>
                      {feedback.improvements.map((s, i) => (
                        <li key={i} className={styles.bulletWarn}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Corrections */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {tw.sectionCorrections}
              {sortedCorrections.length > 0 && (
                <span className={styles.correctionCount}>{sortedCorrections.length}</span>
              )}
            </h2>
            {sortedCorrections.length === 0 ? (
              <p className={styles.noCorrections}>{tw.noCorrections}</p>
            ) : (
              <div className={styles.correctionsList}>
                {sortedCorrections.map((c, i) => (
                  <CorrectionCard
                    key={i}
                    c={c}
                    labels={{ yourText: tw.yourText, correction: tw.correction, explanation: tw.explanation }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Suggestions */}
          {feedback.suggestions.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{tw.sectionSuggestions}</h2>
              <div className={styles.suggestionsList}>
                {feedback.suggestions.map((s, i) => (
                  <div key={i} className={styles.suggestionCard}>
                    <span className={styles.suggestionType}>{s.type}</span>
                    <p className={styles.suggestionText}>{s.suggestion}</p>
                    <p className={styles.suggestionReason}>{s.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Metrics */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{tw.sectionMetrics}</h2>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{feedback.metrics.wordCount}</span>
                <span className={styles.metricLabel}>{tw.metricWords}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{feedback.metrics.ttr}</span>
                <span className={styles.metricLabel}>{tw.metricTTR}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{feedback.metrics.connectorCount}</span>
                <span className={styles.metricLabel}>{tw.metricConnectors}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{feedback.metrics.avgSentenceLen}</span>
                <span className={styles.metricLabel}>{tw.metricAvgSentLen}</span>
              </div>
            </div>
          </section>

          {/* Submitted text */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{tw.yourWork}</h2>
            <div className={styles.submittedText}>{submission.content}</div>
          </section>
        </div>
      )}
    </div>
  );
}
