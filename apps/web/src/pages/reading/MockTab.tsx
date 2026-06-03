import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import {
  mockApi,
  type CefrLevel,
  type MockActiveAttempt,
  type MockResult,
} from '../../features/reading/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { Pill } from '../../shared/components/ui';
import styles from './MockTab.module.css';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Mock-test tab inside /reading. Three flavours:
 *   • setup    — pick level + start (no active attempt)
 *   • active   — countdown timer + 3 texts + per-question answers
 *   • result   — composite score + per-text breakdown
 *
 * State transitions go through the server: we never trust client-side
 * timer to gate finalization. The server auto-finalizes on /active read
 * if the deadline passed offline.
 */

type View = { kind: 'setup' } | { kind: 'active'; attempt: MockActiveAttempt } | { kind: 'result'; result: MockResult };

export function MockTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const userLevel = useAuthStore((s) => s.user?.level);
  const [view, setView] = useState<View>({ kind: 'setup' });

  const activeQuery = useQuery({
    queryKey: ['mock-active'],
    queryFn: mockApi.active,
    staleTime: 0,
  });

  // Initial route: if there's an active or auto-finalized attempt, jump there.
  useEffect(() => {
    const a = activeQuery.data?.active;
    if (!a) return;
    if ('autoFinalized' in a) {
      setView({ kind: 'result', result: a.autoFinalized });
    } else {
      setView({ kind: 'active', attempt: a });
    }
  }, [activeQuery.data]);

  if (activeQuery.isLoading) {
    return <div className={styles.loading}>{t.reading.mock.loading}</div>;
  }

  if (view.kind === 'setup') {
    const defaultLevel = (LEVELS.includes(userLevel as CefrLevel) ? (userLevel as CefrLevel) : 'B1');
    return (
      <SetupView
        defaultLevel={defaultLevel}
        onStart={(attempt) => {
          setView({ kind: 'active', attempt });
          void qc.invalidateQueries({ queryKey: ['mock-active'] });
        }}
      />
    );
  }
  if (view.kind === 'active') {
    return (
      <ActiveView
        attempt={view.attempt}
        onFinalize={(result) => {
          setView({ kind: 'result', result });
          void qc.invalidateQueries({ queryKey: ['mock-active'] });
          void qc.invalidateQueries({ queryKey: ['mock-history'] });
        }}
        onCancel={() => {
          setView({ kind: 'setup' });
          void qc.invalidateQueries({ queryKey: ['mock-active'] });
        }}
      />
    );
  }
  return (
    <ResultView
      result={view.result}
      onRestart={() => setView({ kind: 'setup' })}
    />
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function SetupView({
  defaultLevel,
  onStart,
}: {
  defaultLevel: CefrLevel;
  onStart: (attempt: MockActiveAttempt) => void;
}) {
  const { t } = useI18n();
  const [level, setLevel] = useState<CefrLevel>(defaultLevel);
  const [error, setError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ['mock-history'],
    queryFn: mockApi.history,
    staleTime: 60_000,
  });

  const start = useMutation({
    mutationFn: () => mockApi.start(level),
    onSuccess: (data) => onStart(data.attempt),
    onError: (e: Error) => {
      const msg = (e.message ?? '').toUpperCase();
      if (msg.includes('NOT_ENOUGH_TEXTS')) setError(t.reading.mock.errNotEnough);
      else setError(t.reading.mock.errGeneric);
    },
  });

  return (
    <div className={styles.setup}>
      <div className={styles.setupHead}>
        <h2 className={styles.setupTitle}>{t.reading.mock.setupTitle}</h2>
        <p className={styles.setupLead}>{t.reading.mock.setupLead}</p>
      </div>

      <div className={styles.specsRow}>
        <span className={styles.spec}><Clock size={16} /> 45 {t.reading.mock.minShort}</span>
        <span className={styles.spec}>3 {t.reading.mock.textsShort}</span>
        <span className={styles.spec}>{t.reading.mock.delfStyle}</span>
      </div>

      <div className={styles.levelPicker}>
        <span className={styles.levelLabel}>{t.reading.mock.pickLevel}</span>
        <div className={styles.levelChips}>
          {LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              className={`${styles.levelChip} ${level === lv ? styles.levelChipActive : ''}`}
              onClick={() => setLevel(lv)}
            >
              <Pill tone="level" level={lv}>{lv}</Pill>
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}><AlertTriangle size={16} /> {error}</p>}

      <button
        type="button"
        className={styles.startBtn}
        onClick={() => start.mutate()}
        disabled={start.isPending}
      >
        {start.isPending ? t.reading.mock.starting : t.reading.mock.startCta}
      </button>

      {historyQuery.data && historyQuery.data.items.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>{t.reading.mock.historyTitle}</h3>
          <ul className={styles.historyList}>
            {historyQuery.data.items.map((h) => {
              const pct = h.maxScore > 0 ? Math.round((h.score / h.maxScore) * 100) : 0;
              const tone = pct >= 75 ? 'good' : pct >= 55 ? 'mid' : 'low';
              const date = new Date(h.finalizedAt).toLocaleDateString();
              return (
                <li key={h.id} className={`${styles.historyItem} ${styles[`tone_${tone}`]}`}>
                  <Pill tone="level" level={h.level}>{h.level}</Pill>
                  <span className={styles.historyScore}>{h.score} / {h.maxScore}</span>
                  <span className={styles.historyPct}>{pct}%</span>
                  <span className={styles.historyDate}>{date}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Active ────────────────────────────────────────────────────────────────────

function ActiveView({
  attempt: initial,
  onFinalize,
  onCancel,
}: {
  attempt: MockActiveAttempt;
  onFinalize: (r: MockResult) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [attempt] = useState(initial);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const a of attempt.answers) m.set(key(a.textId, a.questionId), a.answer);
    return m;
  });
  const [remaining, setRemaining] = useState(attempt.remainingSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining > 0]);

  const finalize = useMutation({
    mutationFn: () => mockApi.finalize(attempt.id),
    onSuccess: (data) => onFinalize(data.result),
  });

  // Auto-finalize on client when timer hits zero (server enforces this too).
  useEffect(() => {
    if (remaining === 0 && !finalize.isPending) {
      finalize.mutate();
    }
  }, [remaining === 0]);

  const cancelMut = useMutation({
    mutationFn: () => mockApi.cancel(attempt.id),
    onSuccess: onCancel,
  });

  const answerMut = useMutation({
    mutationFn: (payload: { textId: string; questionId: string; answer: string }) =>
      mockApi.answer(attempt.id, payload),
  });

  const handleAnswer = (textId: string, questionId: string, answer: string) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(key(textId, questionId), answer);
      return next;
    });
    answerMut.mutate({ textId, questionId, answer });
  };

  const activeText = attempt.texts[activeIdx]!;
  const answeredCount = answers.size;
  const totalQuestions = attempt.texts.reduce((s, t) => s + t.questions.length, 0);
  const danger = remaining < 300; // <5 min left

  const handleFinalize = () => {
    if (window.confirm(t.reading.mock.confirmFinalize)) finalize.mutate();
  };
  const handleCancel = () => {
    if (window.confirm(t.reading.mock.confirmCancel)) cancelMut.mutate();
  };

  return (
    <div className={styles.active}>
      <div className={styles.bar}>
        <div className={`${styles.timer} ${danger ? styles.timerDanger : ''}`}>
          <Clock size={16} /> {formatTime(remaining)}
        </div>
        <span className={styles.progress}>
          {answeredCount} / {totalQuestions} {t.reading.mock.answered}
        </span>
        <div className={styles.barActions}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
            {t.reading.mock.cancel}
          </button>
          <button type="button" className={styles.finalizeBtn} onClick={handleFinalize}>
            {t.reading.mock.finalize}
          </button>
        </div>
      </div>

      <div className={styles.textTabs}>
        {attempt.texts.map((tx, i) => {
          const answeredInText = tx.questions.filter((q) => answers.has(key(tx.id, q.id))).length;
          return (
            <button
              key={tx.id}
              type="button"
              className={`${styles.textTab} ${i === activeIdx ? styles.textTabActive : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              <span className={styles.textTabIdx}>{i + 1}</span>
              <span className={styles.textTabTitle}>{tx.title}</span>
              <span className={styles.textTabCount}>{answeredInText} / {tx.questions.length}</span>
            </button>
          );
        })}
      </div>

      <article className={styles.textPanel}>
        <header className={styles.textHead}>
          <h3 className={styles.textTitle}>{activeText.title}</h3>
          <Pill tone="level" level={activeText.level}>{activeText.level}</Pill>
        </header>
        <div className={styles.textBody}>
          {activeText.contentFr.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className={styles.questions}>
          {activeText.questions.map((q, qi) => {
            const userAns = answers.get(key(activeText.id, q.id)) ?? null;
            return (
              <fieldset key={q.id} className={styles.question}>
                <legend className={styles.qLabel}>
                  {qi + 1}. {q.question}
                </legend>
                <div className={styles.options}>
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={`${styles.option} ${userAns === opt ? styles.optionActive : ''}`}
                    >
                      <input
                        type="radio"
                        name={`${activeText.id}-${q.id}`}
                        value={opt}
                        checked={userAns === opt}
                        onChange={() => handleAnswer(activeText.id, q.id, opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </article>
    </div>
  );
}

// ── Result ────────────────────────────────────────────────────────────────────

function ResultView({ result, onRestart }: { result: MockResult; onRestart: () => void }) {
  const { t } = useI18n();
  const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  const tone = pct >= 75 ? 'good' : pct >= 55 ? 'mid' : 'low';

  return (
    <div className={styles.result}>
      <div className={`${styles.resultHero} ${styles[tone]}`}>
        <div className={styles.resultBigNum}>{result.score} / {result.maxScore}</div>
        <div className={styles.resultMeta}>
          <span className={styles.resultPct}>{pct}%</span>
          <Pill tone="level" level={result.level}>{result.level}</Pill>
        </div>
      </div>

      <div className={styles.breakdown}>
        {result.breakdown.map((b, i) => (
          <article key={b.textId} className={styles.brdCard}>
            <header className={styles.brdHead}>
              <span className={styles.brdIdx}>{t.reading.mock.text} {i + 1}</span>
              <h4 className={styles.brdTitle}>{b.title}</h4>
              <span className={styles.brdScore}>{b.correct} / {b.total}</span>
            </header>
            <ul className={styles.brdQuestions}>
              {b.questions.map((q, qi) => (
                <li key={q.id} className={styles.brdQuestion}>
                  <div className={styles.brdQHead}>
                    {q.isCorrect ? (
                      <CheckCircle2 size={14} className={styles.brdOk} />
                    ) : (
                      <XCircle size={14} className={styles.brdBad} />
                    )}
                    <span className={styles.brdQText}>{qi + 1}. {q.question}</span>
                  </div>
                  <div className={styles.brdAnswers}>
                    <span className={styles.brdYours}>
                      {t.reading.mock.yourAnswer}: <strong>{q.userAnswer ?? '—'}</strong>
                    </span>
                    {!q.isCorrect && (
                      <span className={styles.brdRight}>
                        {t.reading.mock.correctAnswer}: <strong>{q.correctAnswer}</strong>
                      </span>
                    )}
                    {q.explanation && (
                      <span className={styles.brdExplain}>{q.explanation}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <button type="button" className={styles.restartBtn} onClick={onRestart}>
        <RotateCcw size={16} /> {t.reading.mock.tryAgain}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

const key = (textId: string, qid: string) => `${textId}|${qid}`;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
