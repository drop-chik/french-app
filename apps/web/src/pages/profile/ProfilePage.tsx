import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Camera, Lock, User, BarChart3, Globe, LogOut, Settings, ChevronDown } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import type { UserProfile } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { ProfileCharts } from './ProfileCharts';
import styles from './ProfilePage.module.css';

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#f59e0b',
  B2: '#8b5cf6',
};

export function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateUser = useAuthStore((s) => s.updateUser);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: profileApi.getStats,
  });

  const { data: streakData } = useQuery({
    queryKey: ['profile-streak'],
    queryFn: profileApi.getStreak,
  });

  const { data: levelsData } = useQuery({
    queryKey: ['profile-levels'],
    queryFn: profileApi.getLevelsProgress,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (profile && !name) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => profileApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(['profile'], (old) =>
        old ? { ...old, name: updated.name, email: updated.email } : old,
      );
      updateUser({ name: updated.name, email: updated.email });
      setProfileMsg({ type: 'ok', text: t.profile.saved });
      setTimeout(() => setProfileMsg(null), 3000);
    },
    onError: (err: Error) => {
      setProfileMsg({
        type: 'err',
        text: err.message.includes('Email') ? t.profile.errorEmailTaken : err.message,
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: () => profileApi.updatePassword(currentPwd, newPwd),
    onSuccess: () => {
      setCurrentPwd('');
      setNewPwd('');
      setPwdMsg({ type: 'ok', text: t.profile.passwordChanged });
      setTimeout(() => setPwdMsg(null), 3000);
    },
    onError: (err: Error) => {
      setPwdMsg({
        type: 'err',
        text: err.message.includes('incorrect') ? t.profile.errorWrongPassword : err.message,
      });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (dataUrl: string) => profileApi.uploadAvatar(dataUrl),
    onSuccess: (result) => {
      queryClient.setQueryData<UserProfile>(['profile'], (old) =>
        old ? { ...old, avatarUrl: result.avatarUrl } : old,
      );
      setLocalAvatar(null);
      setAvatarError(null);
    },
    onError: (err: Error) => {
      setLocalAvatar(null);
      setAvatarError(err.message || t.profile.errorAvatarUpload);
      setTimeout(() => setAvatarError(null), 5000);
    },
  });

  const langMutation = useMutation({
    mutationFn: (newLang: string) => profileApi.updateProfile({ uiLanguage: newLang }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => profileApi.logout(),
    onSettled: () => {
      useAuthStore.getState().clearAuth();
      router.navigate({ to: '/login' });
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setAvatarError(t.profile.errorAvatarLarge);
      setTimeout(() => setAvatarError(null), 5000);
      e.target.value = '';
      return;
    }
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLocalAvatar(dataUrl);
      avatarMutation.mutate(dataUrl);
    };
    reader.onerror = () => {
      setAvatarError(t.profile.errorAvatarRead);
      setTimeout(() => setAvatarError(null), 5000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleLangChange(newLang: 'ru' | 'en') {
    setLang(newLang);
    langMutation.mutate(newLang);
  }

  if (isLoading || !profile) {
    return <div className={styles.loading}>{t.common.loading}</div>;
  }

  const avatarSrc = localAvatar ?? profile.avatarUrl;
  const memberSince = new Date(profile.createdAt).toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long' },
  );

  const streak = streakData?.streak ?? 0;
  const correctAnswers = stats?.correctAnswers ?? 0;
  const incorrectAnswers = stats?.incorrectAnswers ?? 0;
  const totalAnswers = correctAnswers + incorrectAnswers;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  const currentLevelData = levelsData?.levels.find((l) => l.level === profile.level);
  const currentLevelPercent = currentLevelData?.percent ?? 0;
  const levelColor = LEVEL_COLORS[profile.level] ?? 'var(--color-brand)';

  return (
    <div className={styles.page}>
      {showLogoutDialog && (
        <ConfirmDialog
          title={t.profile.logoutConfirmTitle}
          message={t.profile.logoutConfirm}
          confirmLabel={t.profile.logoutConfirmBtn}
          cancelLabel={t.profile.cancel}
          loading={logoutMutation.isPending}
          onConfirm={() => logoutMutation.mutate()}
          onCancel={() => setShowLogoutDialog(false)}
        />
      )}

      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{t.profile.title}</h1>
        <button
          className={styles.logoutBtn}
          onClick={() => setShowLogoutDialog(true)}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={15} />
          {t.profile.logout}
        </button>
      </div>

      {/* Hero card */}
      <section className={styles.heroCard}>
        <div className={styles.heroAvatarWrap}>
          <HeroRing percent={currentLevelPercent} color={levelColor} />
          <div className={styles.heroAvatarInner}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className={styles.heroAvatarImg} />
            ) : (
              <div className={styles.heroAvatarPlaceholder}>
                {profile.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <button
            className={styles.heroAvatarEdit}
            onClick={() => fileInputRef.current?.click()}
            title={t.profile.changeAvatar}
            disabled={avatarMutation.isPending}
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroName}>{profile.name}</div>
          <div className={styles.heroMeta}>
            <span className={styles.levelBadge} style={{ background: levelColor }}>
              {profile.level}
            </span>
            <span className={styles.heroSince}>{t.profile.memberSince} {memberSince}</span>
          </div>
          {avatarError && <p className={styles.error}>{avatarError}</p>}

          <div className={styles.heroStats}>
            <HeroStat value={streak} label={t.profile.heroStreakDays} icon="🔥" />
            <HeroStat value={stats?.words.mastered ?? 0} label={t.profile.heroWords} icon="📚" />
            <HeroStat
              value={totalAnswers > 0 ? `${accuracy}%` : '—'}
              label={t.profile.accuracy}
              icon="✓"
            />
            <HeroStat value={stats?.grammar.completed ?? 0} label={t.profile.heroGrammar} icon="📝" />
          </div>
        </div>
      </section>

      {/* Level rings */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          <BarChart3 size={18} /> {t.profile.levelProgress}
        </h2>
        <div className={styles.levelRings}>
          {levelsData?.levels.map((l) => (
            <LevelRing
              key={l.level}
              level={l.level}
              percent={l.percent}
              masteredWords={l.masteredWords}
              totalWords={l.totalWords}
              isCurrent={l.level === profile.level}
            />
          ))}
        </div>
      </section>

      {/* Stats grid */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          <BarChart3 size={18} /> {t.profile.stats}
        </h2>
        <div className={styles.statsGrid}>
          <StatCard
            value={stats?.words.mastered ?? 0}
            label={t.profile.wordsMastered}
            color="green"
            trend={stats?.weekTrend ?? null}
            trendLabel={stats?.weekTrend !== null && stats?.weekTrend !== undefined
              ? stats.weekTrend >= 0
                ? String(t.profile.weekTrendUp).replace('{n}', String(Math.abs(stats.weekTrend)))
                : String(t.profile.weekTrendDown).replace('{n}', String(stats.weekTrend))
              : undefined}
          />
          <StatCard value={stats?.words.learning ?? 0} label={t.profile.wordsInProgress} color="blue" />
          <StatCard value={stats?.words.total ?? 0} label={t.profile.wordsLearned} color="purple" />
          <StatCard value={stats?.weekReviews ?? 0} label={t.profile.weekReviews} color="indigo" />
          <StatCard value={correctAnswers} label={t.profile.correctAnswers} color="teal" />
          <StatCard value={incorrectAnswers} label={t.profile.incorrectAnswers} color="orange" />
          <StatCard value={stats?.grammar.completed ?? 0} label={t.profile.grammarCompleted} color="pink" />
          <StatCard value={stats?.listening.completed ?? 0} label={t.profile.listeningCompleted} color="slate" />
        </div>
      </section>

      {/* Charts */}
      <ProfileCharts />

      {/* Settings accordion */}
      <details className={styles.accordion}>
        <summary className={styles.accordionSummary}>
          <Settings size={16} />
          {t.profile.settings}
          <ChevronDown size={16} className={styles.accordionChevron} />
        </summary>
        <div className={styles.accordionContent}>
          <div className={styles.settingsGrid}>
            {/* Personal info */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <User size={15} /> {t.profile.personalInfo}
              </h3>
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate({ name, email });
                }}
              >
                <div className={styles.field}>
                  <label className={styles.label}>{t.profile.name}</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t.profile.email}</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {profileMsg && (
                  <p className={profileMsg.type === 'ok' ? styles.success : styles.error}>
                    {profileMsg.text}
                  </p>
                )}
                <button className={styles.btn} type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? t.common.loading : t.profile.saveChanges}
                </button>
              </form>
            </div>

            {/* Password */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Lock size={15} /> {t.profile.changePassword}
              </h3>
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePasswordMutation.mutate();
                }}
              >
                <div className={styles.field}>
                  <label className={styles.label}>{t.profile.currentPassword}</label>
                  <input
                    className={styles.input}
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t.profile.newPassword}</label>
                  <input
                    className={styles.input}
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                {pwdMsg && (
                  <p className={pwdMsg.type === 'ok' ? styles.success : styles.error}>
                    {pwdMsg.text}
                  </p>
                )}
                <button className={styles.btn} type="submit" disabled={updatePasswordMutation.isPending}>
                  {updatePasswordMutation.isPending ? t.common.loading : t.profile.updatePassword}
                </button>
              </form>
            </div>

            {/* Language */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Globe size={15} /> {t.profile.language}
              </h3>
              <div className={styles.langButtons}>
                <button
                  className={`${styles.langBtn} ${lang === 'ru' ? styles.langBtnActive : ''}`}
                  onClick={() => handleLangChange('ru')}
                >
                  Русский (RU)
                </button>
                <button
                  className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
                  onClick={() => handleLangChange('en')}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

// ── Internal components ──────────────────────────────────────────────────────

function HeroRing({ percent, color }: { percent: number; color: string }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(1, percent / 100)) * C;
  return (
    <svg viewBox="0 0 100 100" className={styles.heroRingSvg}>
      <circle cx="50" cy="50" r={R} stroke="var(--color-border)" strokeWidth="7" fill="none" />
      {percent > 0 && (
        <circle
          cx="50"
          cy="50"
          r={R}
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeDasharray={`${filled.toFixed(1)} ${(C - filled).toFixed(1)}`}
          strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', transform: 'rotate(-90deg)' }}
        />
      )}
    </svg>
  );
}

function HeroStat({ value, label, icon }: { value: number | string; label: string; icon: string }) {
  return (
    <div className={styles.heroStat}>
      <span className={styles.heroStatValue}>{value}</span>
      <span className={styles.heroStatLabel}>{icon} {label}</span>
    </div>
  );
}

function LevelRing({
  level,
  percent,
  masteredWords,
  totalWords,
  isCurrent,
}: {
  level: string;
  percent: number;
  masteredWords: number;
  totalWords: number;
  isCurrent?: boolean;
}) {
  const R = 32;
  const C = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(1, percent / 100)) * C;
  const color = LEVEL_COLORS[level] ?? 'var(--color-brand)';

  return (
    <div className={`${styles.levelRing} ${isCurrent ? styles.levelRingCurrent : ''}`}>
      <svg viewBox="0 0 76 76" className={styles.levelRingSvg}>
        <circle cx="38" cy="38" r={R} stroke="var(--color-border)" strokeWidth="6" fill="none" />
        {percent > 0 && (
          <circle
            cx="38"
            cy="38"
            r={R}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${filled.toFixed(1)} ${(C - filled).toFixed(1)}`}
            strokeLinecap="round"
            style={{ transformOrigin: '38px 38px', transform: 'rotate(-90deg)' }}
          />
        )}
        <text x="38" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
          {level}
        </text>
        <text x="38" y="50" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">
          {percent}%
        </text>
      </svg>
      <p className={styles.levelRingMeta}>
        {masteredWords}/{totalWords}
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
  trend,
  trendLabel,
}: {
  value: number;
  label: string;
  color: string;
  trend?: number | null;
  trendLabel?: string | undefined;
}) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard_${color}`] ?? ''}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {trendLabel && trend !== null && trend !== undefined && (
        <span className={`${styles.statTrend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
          {trendLabel}
        </span>
      )}
    </div>
  );
}
