import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight, RotateCcw, Volume2 } from 'lucide-react';
import {
  listeningMockApi as mockApi,
  type CefrLevel,
  type MockActiveAttempt,
  type MockResult,
} from '../../features/listening/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { Pill } from '../../shared/components/ui';
// Reuse the reading mock's stylesheet — same setup/active/result layout.
import styles from '../reading/MockTab.module.css';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * DELF CO mock tab inside /listening. Mirrors the reading mock: setup → active
 * (countdown + audio players + per-question MCQ) → result (composite + breakdown).
 * The server owns time enforcement and auto-finalizes on /active read if expired.
 */
type View = { kind: 'setup' } | { kind: 'active'; attempt: MockActiveAttempt } | { kind: 'result'; result: MockResult };

export function MockTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const userLevel = useAuthStore((s) => s.user?.level);
  const [view, setView] = useState<View>({ kind: 'setup' });

  const activeQuery = useQuery({ queryKey: ['lmock-active'], queryFn: mockApi.active, staleTime: 0 });

  useEffect(() => {
    const a = activeQuery.data?.active;
    if (!a) return;
    if ('autoFinalized' in a) setView({ kind: 'result', result: a.autoFinalized });
    else setView({ kind: 'active', attempt: a });
  }, [activeQuery.data]);

  if (activeQuery.isLoading) return <div className={styles.loading}>{t.listening.mock.loading}</div>;

  if (view.kind === 'setup') {
    const defaultLevel = LEVELS.includes(userLevel as CefrLevel) ? (userLevel as CefrLevel) : 'B1';
    return (
      <SetupView
        defaultLevel={defaultLevel}
        onStart={(attempt) => { setView({ kind: 'active', attempt }); void qc.invalidateQueries({ queryKey: ['lmock-active'] }); }}
      />
    );
  }
  if (view.kind === 'active') {
    return (
      <ActiveView
        attempt={view.attempt}
        onFinalize={(result) => { setView({ kind: 'result', result }); void qc.invalidateQueries({ queryKey: ['lmock-active'] }); void qc.invalidateQueries({ queryKey: ['lmock-history'] }); }}
        onCancel={() => { setView({ kind: 'setup' }); void qc.invalidateQueries({ queryKey: ['lmock-active'] }); }}
      />
    );
  }
  return <ResultView result={view.result} onRestart={() => setView({ kind: 'setup' })} />;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function SetupView({ defaultLevel, onStart }: { defaultLevel: CefrLevel; onStart: (a: MockActiveAttempt) => void }) {
  const { t } = useI18n();
  const [level, setLevel] = useState<CefrLevel>(defaultLevel);
  const [error, setError] = useState<string | null>(null);
  const historyQuery = useQuery({ queryKey: ['lmock-history'], queryFn: mockApi.history, staleTime: 60_000 });

  const start = useMutation({
    mutationFn: () => mockApi.start(level),
    onSuccess: (data) => onStart(data.attempt),
    onError: (e: Error) => {
      const msg = (e.message ?? '').toUpperCase();
      setError(msg.includes('NOT_ENOUGH') ? t.listening.mock.errNotEnough : t.listening.mock.errGeneric);
    },
  });

  return (
    <div className={styles.setup}>
      <div className={styles.setupHead}>
        <h2 className={styles.setupTitle}>{t.listening.mock.setupTitle}</h2>
        <p className={styles.setupLead}>{t.listening.mock.setupLead}</p>
      </div>

      <div className={styles.specsRow}>
        <span className={styles.spec}><Clock size={16} /> 25 {t.listening.mock.minShort}</span>
        <span className={styles.spec}>3 {t.listening.mock.recordingsShort}</span>
        <span className={styles.spec}>{t.listening.mock.delfStyle}</span>
      </div>

      <div className={styles.levelPicker}>
        <span className={styles.levelLabel}>{t.listening.mock.pickLevel}</span>
        <div className={styles.levelChips}>
          {LEVELS.map((lv) => (
            <button key={lv} type="button" className={`${styles.levelChip} ${level === lv ? styles.levelChipActive : ''}`} onClick={() => setLevel(lv)}>
              <Pill tone="level" level={lv}>{lv}</Pill>
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}><AlertTriangle size={16} /> {error}</p>}

      <button type="button" className={styles.startBtn} onClick={() => start.mutate()} disabled={start.isPending}>
        {start.isPending ? t.listening.mock.starting : t.listening.mock.startCta}
      </button>

      {historyQuery.data && historyQuery.data.history.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>{t.listening.mock.historyTitle}</h3>
          <ul className={styles.historyList}>
            {historyQuery.data.history.map((h) => {
              const pct = h.maxScore > 0 ? Math.round((h.score / h.maxScore) * 100) : 0;
              const tone = pct >= 75 ? 'good' : pct >= 55 ? 'mid' : 'low';
              return (
                <li key={h.id} className={`${styles.historyItem} ${styles[`tone_${tone}`]}`}>
                  <Pill tone="level" level={h.level}>{h.level}</Pill>
                  <span className={styles.historyScore}>{h.score} / {h.maxScore}</span>
                  <span className={styles.historyPct}>{pct}%</span>
                  <span className={styles.historyDate}>{new Date(h.finalizedAt).toLocaleDateString()}</span>
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

function ActiveView({ attempt: initial, onFinalize, onCancel }: { attempt: MockActiveAttempt; onFinalize: (r: MockResult) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [attempt] = useState(initial);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const a of attempt.answers) m.set(key(a.exerciseId, a.questionId), a.answer);
    return m;
  });
  const [remaining, setRemaining] = useState(attempt.remainingSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining > 0]);

  const finalize = useMutation({ mutationFn: () => mockApi.finalize(attempt.id), onSuccess: (data) => onFinalize(data.result) });
  useEffect(() => { if (remaining === 0 && !finalize.isPending) finalize.mutate(); }, [remaining === 0]);

  const cancelMut = useMutation({ mutationFn: () => mockApi.cancel(attempt.id), onSuccess: onCancel });
  const answerMut = useMutation({
    mutationFn: (p: { exerciseId: string; questionId: string; answer: string }) => mockApi.answer(attempt.id, p),
  });

  const handleAnswer = (exerciseId: string, questionId: string, answer: string) => {
    setAnswers((prev) => { const next = new Map(prev); next.set(key(exerciseId, questionId), answer); return next; });
    answerMut.mutate({ exerciseId, questionId, answer });
  };

  const activeEx = attempt.exercises[activeIdx]!;
  const answeredCount = answers.size;
  const totalQuestions = attempt.exercises.reduce((s, e) => s + e.questions.length, 0);
  const danger = remaining < 300;

  return (
    <div className={styles.active}>
      <div className={styles.bar}>
        <div className={`${styles.timer} ${danger ? styles.timerDanger : ''}`}><Clock size={16} /> {formatTime(remaining)}</div>
        <span className={styles.progress}>{answeredCount} / {totalQuestions} {t.listening.mock.answered}</span>
        <div className={styles.barActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => { if (window.confirm(t.listening.mock.confirmCancel)) cancelMut.mutate(); }}>{t.listening.mock.cancel}</button>
          <button type="button" className={styles.finalizeBtn} onClick={() => { if (window.confirm(t.listening.mock.confirmFinalize)) finalize.mutate(); }}>{t.listening.mock.finalize}</button>
        </div>
      </div>

      <div className={styles.textTabs}>
        {attempt.exercises.map((ex, i) => {
          const answeredInEx = ex.questions.filter((q) => answers.has(key(ex.id, q.id))).length;
          return (
            <button key={ex.id} type="button" className={`${styles.textTab} ${i === activeIdx ? styles.textTabActive : ''}`} onClick={() => setActiveIdx(i)}>
              <span className={styles.textTabIdx}>{i + 1}</span>
              <span className={styles.textTabTitle}>{ex.title}</span>
              <span className={styles.textTabCount}>{answeredInEx} / {ex.questions.length}</span>
            </button>
          );
        })}
      </div>

      <article className={styles.textPanel}>
        <header className={styles.textHead}>
          <h3 className={styles.textTitle}>{activeEx.title}</h3>
          <Pill tone="level" level={activeEx.level}>{activeEx.level}</Pill>
        </header>

        {/* Audio player — native controls; can replay within the time limit. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 16px' }}>
          <Volume2 size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
          <audio
            key={activeEx.id}
            controls
            preload="none"
            src={`/api/listening/exercises/${activeEx.id}/audio`}
            style={{ width: '100%', height: 40 }}
          />
        </div>

        <div className={styles.questions}>
          {activeEx.questions.map((q, qi) => {
            const userAns = answers.get(key(activeEx.id, q.id)) ?? null;
            return (
              <fieldset key={q.id} className={styles.question}>
                <legend className={styles.qLabel}>{qi + 1}. {q.question}</legend>
                <div className={styles.options}>
                  {q.options.map((opt) => (
                    <label key={opt} className={`${styles.option} ${userAns === opt ? styles.optionActive : ''}`}>
                      <input type="radio" name={`${activeEx.id}-${q.id}`} value={opt} checked={userAns === opt} onChange={() => handleAnswer(activeEx.id, q.id, opt)} />
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
          <article key={b.exerciseId} className={styles.brdCard}>
            <header className={styles.brdHead}>
              <span className={styles.brdIdx}>{t.listening.mock.recording} {i + 1}</span>
              <h4 className={styles.brdTitle}>{b.title}</h4>
              <span className={styles.brdScore}>{b.correct} / {b.total}</span>
            </header>
            <ul className={styles.brdQuestions}>
              {b.questions.map((q, qi) => (
                <li key={q.id} className={styles.brdQuestion}>
                  <div className={styles.brdQHead}>
                    {q.isCorrect ? <CheckCircle2 size={14} className={styles.brdOk} /> : <XCircle size={14} className={styles.brdBad} />}
                    <span className={styles.brdQText}>{qi + 1}. {q.question}</span>
                  </div>
                  <div className={styles.brdAnswers}>
                    <span className={styles.brdYours}>{t.listening.mock.yourAnswer}: <strong>{q.userAnswer ?? '—'}</strong></span>
                    {!q.isCorrect && <span className={styles.brdRight}>{t.listening.mock.correctAnswer}: <strong>{q.correctAnswer}</strong></span>}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <button type="button" className={styles.restartBtn} onClick={onRestart}>
        <RotateCcw size={16} /> {t.listening.mock.tryAgain} <ChevronRight size={16} />
      </button>
    </div>
  );
}

const key = (exerciseId: string, qid: string) => `${exerciseId}|${qid}`;
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
