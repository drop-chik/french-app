import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Search, X, Users as UsersIcon, BarChart3, Loader2, AlertTriangle } from 'lucide-react';
import { adminApi, type AdminUserSort } from '../../features/admin/api';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import { useAuthStore } from '../../features/auth/authStore';
import type { LanguageLevel, UserRole } from '@french-app/shared-types';
import { MetricsTab } from './MetricsTab';
import styles from './AdminPage.module.css';

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function fmtDate(s: string | null, lang: 'ru' | 'en'): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function relTime(s: string | null, ta: Translations['admin']): string {
  if (!s) return ta.relNever;
  const days = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (days <= 0) return ta.relToday;
  if (days === 1) return ta.relYesterday;
  if (days < 30) return ta.relDaysAgo.replace('{n}', String(days));
  return ta.relMonthsAgo.replace('{n}', String(Math.floor(days / 30)));
}

export function AdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'users' | 'metrics'>('users');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Shield size={22} className={styles.headerIcon} />
        <h1 className={styles.title}>{t.nav.admin}</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setTab('users')}
        >
          <UsersIcon size={15} /> {t.admin.tabUsers}
        </button>
        <button
          className={`${styles.tab} ${tab === 'metrics' ? styles.tabActive : ''}`}
          onClick={() => setTab('metrics')}
        >
          <BarChart3 size={15} /> {t.admin.tabMetrics}
        </button>
      </div>

      {tab === 'users' ? <UsersTab /> : <MetricsTab />}
    </div>
  );
}

function UsersTab() {
  const { t } = useI18n();
  const ta = t.admin;
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<AdminUserSort>('created');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, sort],
    queryFn: () => adminApi.listUsers({ ...(q ? { q } : {}), sort, limit: 100 }),
    staleTime: 30_000,
  });

  const users = data?.users ?? [];

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ta.searchPlaceholder}
          />
          {q && (
            <button className={styles.searchClear} onClick={() => setQ('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value as AdminUserSort)}
        >
          <option value="created">{ta.sortCreated}</option>
          <option value="lastActive">{ta.sortActive}</option>
          <option value="level">{ta.sortLevel}</option>
          <option value="name">{ta.sortName}</option>
        </select>
        <span className={styles.totalBadge}>{data?.total ?? 0}</span>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>
      ) : users.length === 0 ? (
        <p className={styles.empty}>{ta.nothingFound}</p>
      ) : (
        <div className={styles.userList}>
          {users.map((u) => (
            <button key={u.id} className={styles.userRow} onClick={() => setSelectedId(u.id)}>
              <Avatar url={u.avatarUrl} name={u.name} className={styles.userAvatar ?? ''} />
              <div className={styles.userMain}>
                <span className={styles.userName}>
                  {u.name}
                  {u.role === 'admin' && <span className={styles.adminChip}>ADMIN</span>}
                </span>
                <span className={styles.userEmail}>{u.email}</span>
              </div>
              <span className={styles.userLevel}>{u.level}</span>
              <div className={styles.userMeta}>
                <span className={styles.userMetaTop}>
                  {ta.wordsCount.replace('{n}', String(u.wordsMastered))}
                </span>
                <span className={styles.userMetaSub}>{relTime(u.lastActive, ta)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <UserDetailModal userId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t, lang } = useI18n();
  const ta = t.admin;
  const queryClient = useQueryClient();
  const selfId = useAuthStore((s) => s.user?.id);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getUser(userId),
  });

  const [level, setLevel] = useState<LanguageLevel | ''>('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Seed edit fields once data loads.
  if (data && level === '' && role === '') {
    setLevel(data.profile.level);
    setRole(data.profile.role);
    setName(data.profile.name);
    setEmail(data.profile.email);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      adminApi.updateUser(userId, {
        ...(level ? { level: level as LanguageLevel } : {}),
        ...(role ? { role: role as UserRole } : {}),
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      setMsg(ta.saved);
      setTimeout(() => setMsg(null), 2500);
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => adminApi.resetProgress(userId),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmReset(false);
      setMsg(ta.resetSuccess.replace('{n}', String(r.deleted)));
      setTimeout(() => setMsg(null), 3000);
    },
  });

  const stats = data?.stats;
  const activity = data?.charts?.activity ?? [];
  const maxRev = Math.max(1, ...activity.map((a) => a.reviewed));

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label={ta.closeBtn}>
          <X size={18} />
        </button>

        {isLoading || !data ? (
          <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>
        ) : (
          <>
            <div className={styles.detailHead}>
              <Avatar
                url={data.profile.avatarUrl}
                name={data.profile.name}
                className={styles.detailAvatar ?? ''}
              />
              <div>
                <h2 className={styles.detailName}>
                  {data.profile.name}
                  {data.profile.role === 'admin' && <span className={styles.adminChip}>ADMIN</span>}
                </h2>
                <p className={styles.detailEmail}>{data.profile.email}</p>
                <p className={styles.detailSub}>
                  {ta.registered}: {fmtDate(data.profile.createdAt, lang)} · {ta.activity}: {relTime(data.lastActiveAt, ta)}
                </p>
              </div>
            </div>

            {/* Read-only stats — "view as user" */}
            {stats && (
              <div className={styles.statGrid}>
                <Stat label={ta.statMastered} value={stats.words.mastered} />
                <Stat label={ta.statLearning} value={stats.words.learning} />
                <Stat label={ta.statNew} value={stats.words.new} />
                <Stat label={ta.statStreak} value={data.streak?.streak ?? 0} />
                <Stat label={ta.statGrammar} value={stats.grammar.completed} />
                <Stat label={ta.statListening} value={stats.listening.completed} />
                <Stat label={ta.statConversations} value={stats.conversations} />
                <Stat label={ta.statDue} value={stats.wordsDueToday} />
              </div>
            )}

            {/* Activity sparkline (last ~90 days) */}
            {activity.length > 0 && (
              <div className={styles.spark}>
                <span className={styles.sparkLabel}>{ta.sparkActivity90}</span>
                <div className={styles.sparkBars}>
                  {activity.slice(-60).map((a, i) => (
                    <div
                      key={i}
                      className={styles.sparkBar}
                      style={{ height: `${Math.max(6, (a.reviewed / maxRev) * 100)}%` }}
                      title={`${a.date}: ${a.reviewed}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Edit */}
            <div className={styles.editBlock}>
              <h3 className={styles.editTitle}>{ta.editTitle}</h3>
              <div className={styles.editGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{ta.fieldLevel}</span>
                  <select
                    className={styles.input}
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LanguageLevel)}
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{ta.fieldRole}</span>
                  <select
                    className={styles.input}
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{ta.fieldName}</span>
                  <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{ta.fieldEmail}</span>
                  <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>
              {msg && <p className={styles.msg}>{msg}</p>}
              <button
                className={styles.saveBtn}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? ta.saving : ta.save}
              </button>
            </div>

            {/* Danger */}
            <div className={styles.dangerBlock}>
              <div className={styles.dangerInfo}>
                <AlertTriangle size={15} className={styles.dangerIcon} />
                <span>{ta.resetSrsCaption}</span>
              </div>
              <button
                className={styles.dangerBtn}
                onClick={() => setConfirmReset(true)}
                disabled={userId === selfId}
                title={userId === selfId ? ta.resetSelfDisabled : ''}
              >
                {ta.resetBtn}
              </button>
            </div>
          </>
        )}
      </div>

      {confirmReset && (
        <ConfirmDialog
          title={ta.resetConfirmTitle}
          message={ta.resetConfirmBody}
          confirmLabel={ta.resetConfirmYes}
          cancelLabel={ta.resetConfirmNo}
          loading={resetMutation.isPending}
          onConfirm={() => resetMutation.mutate()}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

// Avatars are stored as base64 data URLs. Render the image when present,
// but fall back to the name initial if it's missing OR fails to decode
// (e.g. a legacy upload with a mismatched MIME type).
function Avatar({ url, name, className }: { url: string | null; name: string; className: string }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <div className={className}>
        <img
          src={url}
          alt=""
          className={styles.avatarImg ?? ''}
          onError={() => setBroken(true)}
          loading="lazy"
        />
      </div>
    );
  }
  return <div className={className}>{name.charAt(0).toUpperCase() || '?'}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
