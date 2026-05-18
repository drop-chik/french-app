import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Zap, TrendingUp } from 'lucide-react';
import { adminApi } from '../../features/admin/api';
import styles from './AdminPage.module.css';

const FEATURE_LABELS: Record<string, string> = {
  vocab: 'Слова',
  grammar: 'Грамматика',
  listening: 'Аудир.',
  writing: 'Письмо',
  conversation: 'Диалоги',
  reading: 'Чтение',
  drills: 'Тренаж.',
};

function fmtWeek(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function MetricsTab() {
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

  return (
    <div className={styles.metrics}>
      {/* Top cards */}
      <div className={styles.metricCards}>
        <MetricCard icon={<Users size={16} />} label="Всего" value={data.totals.total}
          sub={`+${data.totals.new7d} за 7д · +${data.totals.new30d} за 30д`} />
        <MetricCard icon={<Zap size={16} />} label="DAU" value={data.active.dau}
          sub="активны сегодня" />
        <MetricCard icon={<Zap size={16} />} label="WAU" value={data.active.wau}
          sub="за 7 дней" />
        <MetricCard icon={<Zap size={16} />} label="MAU" value={data.active.mau}
          sub="за 30 дней" />
        <MetricCard icon={<TrendingUp size={16} />} label="Точность" value={`${data.accuracy}%`}
          sub="по платформе" />
        <MetricCard icon={<TrendingUp size={16} />} label="Бэклог" value={data.backlog.medianOverdue}
          sub={`медиана просрочки · max ${data.backlog.maxOverdue}`} />
      </div>

      {/* 30-day activity */}
      <section className={styles.metricSection}>
        <h3 className={styles.metricSectionTitle}>Активные пользователи (30 дней)</h3>
        <div className={styles.tsChart}>
          {data.timeseries.length === 0 ? (
            <span className={styles.metricEmpty}>Нет данных</span>
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
        <h3 className={styles.metricSectionTitle}>Использование функций (всего юзеров)</h3>
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
        <h3 className={styles.metricSectionTitle}>Удержание (когорты по неделе регистрации)</h3>
        {data.retention.length === 0 ? (
          <span className={styles.metricEmpty}>Нет данных</span>
        ) : (
          <table className={styles.cohortTable}>
            <thead>
              <tr>
                <th>Неделя</th><th>Размер</th><th>D1</th><th>D7</th><th>D30</th>
              </tr>
            </thead>
            <tbody>
              {data.retention.map((c) => {
                const pct = (n: number) => (c.size > 0 ? Math.round((n / c.size) * 100) : 0);
                return (
                  <tr key={c.week}>
                    <td>{fmtWeek(c.week)}</td>
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
