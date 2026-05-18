import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Search, X, Users as UsersIcon, BarChart3, Loader2, AlertTriangle } from 'lucide-react';
import { adminApi, type AdminUserSort } from '../../features/admin/api';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { useI18n } from '../../shared/i18n';
import { useAuthStore } from '../../features/auth/authStore';
import type { LanguageLevel, UserRole } from '@french-app/shared-types';
import { MetricsTab } from './MetricsTab';
import styles from './AdminPage.module.css';

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function relTime(s: string | null): string {
  if (!s) return 'никогда';
  const days = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 30) return `${days} дн. назад`;
  return `${Math.floor(days / 30)} мес. назад`;
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
          <UsersIcon size={15} /> Пользователи
        </button>
        <button
          className={`${styles.tab} ${tab === 'metrics' ? styles.tabActive : ''}`}
          onClick={() => setTab('metrics')}
        >
          <BarChart3 size={15} /> Метрики
        </button>
      </div>

      {tab === 'users' ? <UsersTab /> : <MetricsTab />}
    </div>
  );
}

function UsersTab() {
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
            placeholder="Поиск по имени или email…"
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
          <option value="created">Новые сначала</option>
          <option value="lastActive">По активности</option>
          <option value="level">По уровню</option>
          <option value="name">По имени</option>
        </select>
        <span className={styles.totalBadge}>{data?.total ?? 0}</span>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>
      ) : users.length === 0 ? (
        <p className={styles.empty}>Ничего не найдено</p>
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
                <span className={styles.userMetaTop}>{u.wordsMastered} слов</span>
                <span className={styles.userMetaSub}>{relTime(u.lastActive)}</span>
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
      setMsg('Сохранено');
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
      setMsg(`Сброшено ${r.deleted} записей прогресса`);
      setTimeout(() => setMsg(null), 3000);
    },
  });

  const stats = data?.stats;
  const activity = data?.charts?.activity ?? [];
  const maxRev = Math.max(1, ...activity.map((a) => a.reviewed));

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
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
                  Регистрация: {fmtDate(data.profile.createdAt)} · Активность: {relTime(data.lastActiveAt)}
                </p>
              </div>
            </div>

            {/* Read-only stats — "view as user" */}
            {stats && (
              <div className={styles.statGrid}>
                <Stat label="Освоено" value={stats.words.mastered} />
                <Stat label="Учится" value={stats.words.learning} />
                <Stat label="Новые" value={stats.words.new} />
                <Stat label="Стрик" value={data.streak?.streak ?? 0} />
                <Stat label="Грамматика" value={stats.grammar.completed} />
                <Stat label="Аудир." value={stats.listening.completed} />
                <Stat label="Диалоги" value={stats.conversations} />
                <Stat label="К повтору" value={stats.wordsDueToday} />
              </div>
            )}

            {/* Activity sparkline (last ~90 days) */}
            {activity.length > 0 && (
              <div className={styles.spark}>
                <span className={styles.sparkLabel}>Активность (90 дней)</span>
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
              <h3 className={styles.editTitle}>Редактирование</h3>
              <div className={styles.editGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Уровень</span>
                  <select
                    className={styles.input}
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LanguageLevel)}
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Роль</span>
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
                  <span className={styles.fieldLabel}>Имя</span>
                  <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Email</span>
                  <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>
              {msg && <p className={styles.msg}>{msg}</p>}
              <button
                className={styles.saveBtn}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>

            {/* Danger */}
            <div className={styles.dangerBlock}>
              <div className={styles.dangerInfo}>
                <AlertTriangle size={15} className={styles.dangerIcon} />
                <span>Сбросить весь SRS-прогресс пользователя</span>
              </div>
              <button
                className={styles.dangerBtn}
                onClick={() => setConfirmReset(true)}
                disabled={userId === selfId}
                title={userId === selfId ? 'Нельзя сбросить свой аккаунт' : ''}
              >
                Сбросить прогресс
              </button>
            </div>
          </>
        )}
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Сбросить прогресс?"
          message="Все слова пользователя вернутся в статус «новые». Действие необратимо."
          confirmLabel="Сбросить"
          cancelLabel="Отмена"
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
