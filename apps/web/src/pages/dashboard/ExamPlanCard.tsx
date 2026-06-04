import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Target, BookOpen, GraduationCap, X } from 'lucide-react';
import { profileApi, type ExamType, type ExamPlan } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { Pill } from '../../shared/components/ui';
import styles from './ExamPlanCard.module.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const TYPES: ExamType[] = ['DELF', 'DALF', 'TCF', 'TEF'];

/**
 * Dashboard card for the user's exam-prep plan. Three states:
 *
 *  • No plan → soft CTA invite: "Сдаёшь DELF? Поставь дату".
 *  • Plan set → countdown + recommended pace + clear-button.
 *  • User opens the form → inline form with date / type / level pickers.
 *
 * The pace numbers come from the backend (server-computed against the
 * mastery target). Tone (status='plenty'|'tight'|'urgent') drives the
 * accent colour so the card warms up as the date gets closer.
 */
export function ExamPlanCard() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const userLevel = useAuthStore((s) => s.user?.level);
  const [editing, setEditing] = useState(false);

  const tn = t.examPlan as {
    inviteEyebrow: string;
    inviteTitle: string;
    inviteLead: string;
    inviteCta: string;
    activeEyebrow: string;
    daysLabel: string;
    wordsPerDay: string;
    grammarPerWeek: string;
    wordsToLearn: string;
    clear: string;
    confirmClear: string;
    formTitle: string;
    formCancel: string;
    formSave: string;
    formExamType: string;
    formExamLevel: string;
    formExamDate: string;
    formInvalidDate: string;
    formPastDate: string;
    statusPlenty: string;
    statusTight: string;
    statusUrgent: string;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['exam-plan'],
    queryFn: profileApi.getExamPlan,
    staleTime: 5 * 60 * 1000,
  });

  const clearMut = useMutation({
    mutationFn: profileApi.clearExamPlan,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['exam-plan'] }); },
  });

  if (isLoading) return null;

  const plan = data?.plan;

  if (editing) {
    return (
      <ExamPlanForm
        defaultLevel={(userLevel ?? 'B1') as (typeof LEVELS)[number]}
        existing={plan ?? null}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          void qc.invalidateQueries({ queryKey: ['exam-plan'] });
        }}
      />
    );
  }

  if (!plan) {
    return (
      <div className={styles.inviteCard}>
        <div className={styles.inviteIcon}><CalendarDays size={20} /></div>
        <div className={styles.inviteBody}>
          <span className={styles.eyebrow}>{tn.inviteEyebrow}</span>
          <h3 className={styles.inviteTitle}>{tn.inviteTitle}</h3>
          <p className={styles.inviteLead}>{tn.inviteLead}</p>
        </div>
        <button type="button" className={styles.inviteBtn} onClick={() => setEditing(true)}>
          {tn.inviteCta}
        </button>
      </div>
    );
  }

  const statusLabel =
    plan.status === 'urgent' ? tn.statusUrgent
    : plan.status === 'tight' ? tn.statusTight
    : tn.statusPlenty;

  const dateStr = new Date(plan.examDate).toLocaleDateString();

  return (
    <div className={`${styles.activeCard} ${styles[`tone_${plan.status}`]}`}>
      <header className={styles.activeHead}>
        <span className={styles.eyebrow}>{tn.activeEyebrow}</span>
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => {
            if (window.confirm(tn.confirmClear)) clearMut.mutate();
          }}
          aria-label={tn.clear}
        >
          <X size={14} />
        </button>
      </header>

      <div className={styles.daysBlock}>
        <span className={styles.daysValue}>{plan.daysRemaining}</span>
        <span className={styles.daysSuffix}>{tn.daysLabel}</span>
      </div>

      <div className={styles.examMeta}>
        <Pill tone="level" level={plan.examTargetLevel}>{plan.examType} {plan.examTargetLevel}</Pill>
        <span className={styles.examDate}>{dateStr}</span>
        <span className={styles.statusChip}>{statusLabel}</span>
      </div>

      <div className={styles.paceGrid}>
        <PaceStat icon={<BookOpen size={14} />}     value={plan.wordsToLearn}    label={tn.wordsToLearn} />
        <PaceStat icon={<Target size={14} />}        value={plan.wordsPerDay}     label={tn.wordsPerDay} />
        <PaceStat icon={<GraduationCap size={14} />} value={plan.grammarPerWeek}  label={tn.grammarPerWeek} />
      </div>
    </div>
  );
}

function PaceStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className={styles.paceItem}>
      <span className={styles.paceIcon}>{icon}</span>
      <span className={styles.paceValue}>{value.toLocaleString('ru-RU')}</span>
      <span className={styles.paceLabel}>{label}</span>
    </div>
  );
}

// ─── Inline form ──────────────────────────────────────────────────────────────

function ExamPlanForm({
  defaultLevel,
  existing,
  onClose,
  onSaved,
}: {
  defaultLevel: (typeof LEVELS)[number];
  existing: ExamPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const tn = t.examPlan;
  const [examType, setExamType] = useState<ExamType>(existing?.examType ?? 'DELF');
  const [targetLevel, setTargetLevel] = useState<(typeof LEVELS)[number]>(
    (existing?.examTargetLevel ?? defaultLevel) as (typeof LEVELS)[number],
  );
  const [dateStr, setDateStr] = useState<string>(
    existing?.examDate ? existing.examDate.slice(0, 10) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => profileApi.setExamPlan({
      examDate: new Date(dateStr).toISOString(),
      examType,
      examTargetLevel: targetLevel,
    }),
    onSuccess: onSaved,
    onError: (err: Error) => {
      const m = (err.message ?? '').toUpperCase();
      if (m.includes('PAST')) setError(tn.formPastDate);
      else setError(tn.formInvalidDate);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!dateStr) { setError(tn.formInvalidDate); return; }
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) { setError(tn.formInvalidDate); return; }
    if (d.getTime() < Date.now()) { setError(tn.formPastDate); return; }
    mut.mutate();
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <header className={styles.formHead}>
        <h3 className={styles.formTitle}>{tn.formTitle}</h3>
        <button type="button" className={styles.formClose} onClick={onClose} aria-label={tn.formCancel}>
          <X size={16} />
        </button>
      </header>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{tn.formExamType}</span>
        <div className={styles.chipRow}>
          {TYPES.map((tp) => (
            <button
              key={tp}
              type="button"
              className={`${styles.chip} ${examType === tp ? styles.chipActive : ''}`}
              onClick={() => setExamType(tp)}
            >
              {tp}
            </button>
          ))}
        </div>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{tn.formExamLevel}</span>
        <div className={styles.chipRow}>
          {LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              className={`${styles.chip} ${targetLevel === lv ? styles.chipActive : ''}`}
              onClick={() => setTargetLevel(lv)}
            >
              {lv}
            </button>
          ))}
        </div>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{tn.formExamDate}</span>
        <input
          type="date"
          className={styles.dateInput}
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
        />
      </label>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.formActions}>
        <button type="button" className={styles.btnGhost} onClick={onClose}>
          {tn.formCancel}
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={mut.isPending}>
          {tn.formSave}
        </button>
      </div>
    </form>
  );
}
