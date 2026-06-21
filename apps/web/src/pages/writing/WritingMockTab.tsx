import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, RotateCcw, ChevronRight } from 'lucide-react';
import {
  writingMockApi as mockApi,
  type CefrLevel,
  type WritingMockAttempt,
  type WritingFeedback,
} from './api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { Pill } from '../../shared/components/ui';
import { RubricGrid } from './RubricGrid';
// Reuse the reading mock's setup/timer/history/result shell.
import styles from '../reading/MockTab.module.css';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type View =
  | { kind: 'setup' }
  | { kind: 'active'; attempt: WritingMockAttempt }
  | { kind: 'result'; feedback: WritingFeedback; level: CefrLevel };

export function WritingMockTab() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const userLevel = useAuthStore((s) => s.user?.level);
  const [view, setView] = useState<View>({ kind: 'setup' });

  const activeQuery = useQuery({ queryKey: ['wmock-active'], queryFn: mockApi.active, staleTime: 0 });
  useEffect(() => {
    const a = activeQuery.data?.active;
    if (a) setView({ kind: 'active', attempt: a });
  }, [activeQuery.data]);

  if (activeQuery.isLoading) return <div className={styles.loading}>{t.writing.mock.loading}</div>;

  if (view.kind === 'setup') {
    const defaultLevel = LEVELS.includes(userLevel as CefrLevel) ? (userLevel as CefrLevel) : 'B1';
    return <SetupView defaultLevel={defaultLevel} onStart={(attempt) => { setView({ kind: 'active', attempt }); void qc.invalidateQueries({ queryKey: ['wmock-active'] }); }} />;
  }
  if (view.kind === 'active') {
    return (
      <ActiveView
        attempt={view.attempt}
        onDone={(feedback) => { setView({ kind: 'result', feedback, level: view.attempt.level }); void qc.invalidateQueries({ queryKey: ['wmock-active'] }); void qc.invalidateQueries({ queryKey: ['wmock-history'] }); }}
        onCancel={() => { setView({ kind: 'setup' }); void qc.invalidateQueries({ queryKey: ['wmock-active'] }); }}
      />
    );
  }
  return <ResultView feedback={view.feedback} level={view.level} onRestart={() => setView({ kind: 'setup' })} />;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function SetupView({ defaultLevel, onStart }: { defaultLevel: CefrLevel; onStart: (a: WritingMockAttempt) => void }) {
  const { t } = useI18n();
  const [level, setLevel] = useState<CefrLevel>(defaultLevel);
  const [error, setError] = useState<string | null>(null);
  const historyQuery = useQuery({ queryKey: ['wmock-history'], queryFn: mockApi.history, staleTime: 60_000 });

  const start = useMutation({
    mutationFn: () => mockApi.start(level),
    onSuccess: (data) => onStart(data.attempt),
    onError: (e: Error) => {
      const msg = (e.message ?? '').toUpperCase();
      setError(msg.includes('NO_PROMPTS') ? t.writing.mock.errNoPrompts : t.writing.mock.errGeneric);
    },
  });

  return (
    <div className={styles.setup}>
      <div className={styles.setupHead}>
        <h2 className={styles.setupTitle}>{t.writing.mock.setupTitle}</h2>
        <p className={styles.setupLead}>{t.writing.mock.setupLead}</p>
      </div>

      <div className={styles.specsRow}>
        <span className={styles.spec}><Clock size={16} /> {t.writing.mock.timedSpec}</span>
        <span className={styles.spec}>{t.writing.mock.oneTask}</span>
        <span className={styles.spec}>{t.writing.mock.aiGraded}</span>
      </div>

      <div className={styles.levelPicker}>
        <span className={styles.levelLabel}>{t.writing.mock.pickLevel}</span>
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
        {start.isPending ? t.writing.mock.starting : t.writing.mock.startCta}
      </button>

      {historyQuery.data && historyQuery.data.history.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>{t.writing.mock.historyTitle}</h3>
          <ul className={styles.historyList}>
            {historyQuery.data.history.map((h) => {
              const pct = h.maxScore > 0 ? Math.round((h.score / h.maxScore) * 100) : 0;
              const tone = pct >= 75 ? 'good' : pct >= 55 ? 'mid' : 'low';
              return (
                <li key={h.id} className={`${styles.historyItem} ${styles[`tone_${tone}`]}`}>
                  <Pill tone="level" level={h.level}>{h.level}</Pill>
                  <span className={styles.historyScore}>{h.score} / {h.maxScore}</span>
                  <span className={styles.historyPct}>{pct}%</span>
                  <span className={styles.historyDate}>{new Date(h.submittedAt).toLocaleDateString()}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Active (timed editor) ───────────────────────────────────────────────────────

function ActiveView({ attempt, onDone, onCancel }: { attempt: WritingMockAttempt; onDone: (f: WritingFeedback) => void; onCancel: () => void }) {
  const { t, lang } = useI18n();
  const p = attempt.prompt;
  const [text, setText] = useState('');
  const [remaining, setRemaining] = useState(attempt.remainingSeconds);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining > 0]);

  const submit = useMutation({
    mutationFn: () => mockApi.submit(attempt.id, text.trim() || '—'),
    onSuccess: (data) => onDone(data.feedback),
    onError: (e: Error) => setError((e.message ?? '').includes('OUT_OF_CREDITS') ? t.writing.mock.errCredits : t.writing.mock.errGeneric),
  });
  const cancelMut = useMutation({ mutationFn: () => mockApi.cancel(attempt.id), onSuccess: onCancel });

  // Time's up → auto-submit whatever is written.
  useEffect(() => { if (remaining === 0 && !submit.isPending && !submit.isSuccess) submit.mutate(); }, [remaining === 0]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const danger = remaining < 300;
  const title = lang === 'ru' ? p.titleRu : p.titleEn;
  const promptText = lang === 'ru' ? p.promptRu : p.promptEn;
  const tips = (lang === 'ru' ? p.tipsRu : p.tipsEn) ?? [];
  const underTarget = wordCount < p.minWords;

  return (
    <div className={styles.active}>
      <div className={styles.bar}>
        <div className={`${styles.timer} ${danger ? styles.timerDanger : ''}`}><Clock size={16} /> {formatTime(remaining)}</div>
        <span className={styles.progress} style={underTarget ? { color: 'var(--color-warning)' } : {}}>
          {t.writing.mock.words.replace('{n}', String(wordCount)).replace('{min}', String(p.minWords)).replace('{max}', String(p.maxWords))}
        </span>
        <div className={styles.barActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => { if (window.confirm(t.writing.mock.confirmCancel)) cancelMut.mutate(); }}>{t.writing.mock.cancel}</button>
          <button type="button" className={styles.finalizeBtn} onClick={() => { if (window.confirm(t.writing.mock.confirmSubmit)) submit.mutate(); }} disabled={submit.isPending}>
            {submit.isPending ? t.writing.mock.scoring : t.writing.mock.submit}
          </button>
        </div>
      </div>

      <article className={styles.textPanel}>
        <header className={styles.textHead}>
          <h3 className={styles.textTitle}>{title}</h3>
          <Pill tone="level" level={p.level}>{p.level}</Pill>
        </header>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', margin: '4px 0 10px' }}>{promptText}</p>
        {tips.length > 0 && (
          <ul style={{ margin: '0 0 12px', paddingLeft: 18, color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
            {tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submit.isPending}
          placeholder={t.writing.mock.placeholder}
          maxLength={5000}
          style={{
            width: '100%', minHeight: 320, resize: 'vertical', padding: 'var(--space-3)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', color: 'var(--color-text-primary)',
            fontSize: 'var(--text-base)', lineHeight: 1.6, fontFamily: 'inherit',
          }}
        />
        {error && <p className={styles.error}><AlertTriangle size={16} /> {error}</p>}
        {submit.isPending && <p className={styles.progress} style={{ marginTop: 8 }}>{t.writing.mock.scoringHint}</p>}
      </article>
    </div>
  );
}

// ── Result ────────────────────────────────────────────────────────────────────

function ResultView({ feedback, level, onRestart }: { feedback: WritingFeedback; level: CefrLevel; onRestart: () => void }) {
  const { t } = useI18n();
  const tw = t.writing;
  const s = feedback.scores;
  const pct = s.maxTotal > 0 ? Math.round((s.total / s.maxTotal) * 100) : 0;
  const tone = pct >= 75 ? 'good' : pct >= 55 ? 'mid' : 'low';

  return (
    <div className={styles.result}>
      <div className={`${styles.resultHero} ${styles[tone]}`}>
        <div className={styles.resultBigNum}>{s.total} / {s.maxTotal}</div>
        <div className={styles.resultMeta}>
          <span className={styles.resultPct}>{pct}%</span>
          <Pill tone="level" level={level}>{level}</Pill>
        </div>
      </div>

      <RubricGrid
        scores={s}
        labels={{
          task: tw.taskCompletion, coherence: tw.coherence, vocabulary: tw.vocabulary, grammar: tw.grammar,
          sociolinguistic: tw.sociolinguistic, spelling: tw.spelling, presentation: tw.presentation, overallLabel: tw.overallLabel,
        }}
      />

      {feedback.overallComment && (
        <p style={{ margin: '14px 0', padding: 'var(--space-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', lineHeight: 1.6 }}>
          {feedback.overallComment}
        </p>
      )}

      <button type="button" className={styles.restartBtn} onClick={onRestart}>
        <RotateCcw size={16} /> {t.writing.mock.tryAgain} <ChevronRight size={16} />
      </button>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
