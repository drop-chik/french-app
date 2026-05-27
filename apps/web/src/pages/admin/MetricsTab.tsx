import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Zap, TrendingUp } from 'lucide-react';
import { adminApi } from '../../features/admin/api';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import styles from './AdminPage.module.css';

// Feature key → translation slug. We keep the mapping here so the API can
// stay using the short keys; the UI just looks up the right label per lang.
function featureLabels(ta: Translations['admin']): Record<string, string> {
  return {
    vocab: ta.featVocab,
    grammar: ta.featGrammar,
    listening: ta.featListening,
    writing: ta.featWriting,
    conversation: ta.featConversation,
    reading: ta.featReading,
    drills: ta.featDrills,
  };
}

function fmtWeek(s: string, lang: 'ru' | 'en'): string {
  const d = new Date(s);
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', {
    day: '2-digit', month: '2-digit',
  });
}

export function MetricsTab() {
  const { t, lang } = useI18n();
  const ta = t.admin;
  const { data, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.metrics,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>;
  }

  const maxTs = Math.max(1, ...data.timeseries.map((t) => t.users));
  const featEntries = Object.entries(data.featureUsage);
  const maxFeat = Math.max(1, ...featEntries.map(([, v]) => v));
  const FEATURE_LABELS = featureLabels(ta);

  return (
    <div className={styles.metrics}>
      {/* Top cards */}
      <div className={styles.metricCards}>
        <MetricCard icon={<Users size={16} />} label={ta.mTotal} value={data.totals.total}
          sub={ta.mDelta.replace('{n7}', String(data.totals.new7d)).replace('{n30}', String(data.totals.new30d))} />
        <MetricCard icon={<Zap size={16} />} label={ta.mDau} value={data.active.dau}
          sub={ta.mActiveToday} />
        <MetricCard icon={<Zap size={16} />} label={ta.mWau} value={data.active.wau}
          sub={ta.m7days} />
        <MetricCard icon={<Zap size={16} />} label={ta.mMau} value={data.active.mau}
          sub={ta.m30days} />
        <MetricCard icon={<TrendingUp size={16} />} label={ta.mAccuracy} value={`${data.accuracy}%`}
          sub={ta.mAccuracySub} />
        <MetricCard icon={<TrendingUp size={16} />} label={ta.mBacklog} value={data.backlog.medianOverdue}
          sub={ta.mBacklogSub.replace('{max}', String(data.backlog.maxOverdue))} />
      </div>

      {/* 30-day activity */}
      <section className={styles.metricSection}>
        <h3 className={styles.metricSectionTitle}>{ta.mActive30}</h3>
        <div className={styles.tsChart}>
          {data.timeseries.length === 0 ? (
            <span className={styles.metricEmpty}>{ta.mNoData}</span>
          ) : (
            data.timeseries.map((t) => (
              <div key={t.date} className={styles.tsCol} title={`${t.date}: ${t.users}`}>
                <div
                  className={styles.tsBar}
                  style={{ height: `${Math.max(6, (t.users / maxTs) * 100)}%` }}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Feature usage */}
      <section className={styles.metricSection}>
        <h3 className={styles.metricSectionTitle}>{ta.mFeatureUsage}</h3>
        <div className={styles.featList}>
          {featEntries.map(([key, val]) => (
            <div key={key} className={styles.featRow}>
              <span className={styles.featLabel}>{FEATURE_LABELS[key] ?? key}</span>
              <div className={styles.featTrack}>
                <div className={styles.featFill} style={{ width: `${(val / maxFeat) * 100}%` }} />
              </div>
              <span className={styles.featVal}>{val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Retention cohorts */}
      <section className={styles.metricSection}>
        <h3 className={styles.metricSectionTitle}>{ta.mRetention}</h3>
        {data.retention.length === 0 ? (
          <span className={styles.metricEmpty}>{ta.mNoData}</span>
        ) : (
          <table className={styles.cohortTable}>
            <thead>
              <tr>
                <th>{ta.mWeek}</th><th>{ta.mCohortSize}</th><th>D1</th><th>D7</th><th>D30</th>
              </tr>
            </thead>
            <tbody>
              {data.retention.map((c) => {
                const pct = (n: number) => (c.size > 0 ? Math.round((n / c.size) * 100) : 0);
                return (
                  <tr key={c.week}>
                    <td>{fmtWeek(c.week, lang)}</td>
                    <td>{c.size}</td>
                    <td><RetCell pct={pct(c.d1)} /></td>
                    <td><RetCell pct={pct(c.d7)} /></td>
                    <td><RetCell pct={pct(c.d30)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: {
  icon: ReactNode; label: string; value: number | string; sub: string;
}) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricCardHead}>
        <span className={styles.metricCardIcon}>{icon}</span>
        <span className={styles.metricCardLabel}>{label}</span>
      </div>
      <span className={styles.metricCardValue}>{value}</span>
      <span className={styles.metricCardSub}>{sub}</span>
    </div>
  );
}

function RetCell({ pct }: { pct: number }) {
  // Green-tinted by magnitude — quick visual scan of cohort health.
  const bg = pct === 0
    ? 'transparent'
    : `color-mix(in srgb, #22c55e ${Math.min(pct, 100) * 0.5}%, transparent)`;
  return (
    <span className={styles.retCell} style={{ background: bg }}>
      {pct}%
    </span>
  );
}
