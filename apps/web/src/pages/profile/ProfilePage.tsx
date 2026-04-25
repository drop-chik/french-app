import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Camera, Lock, User, BarChart3, Globe, LogOut } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import type { UserProfile } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { ProfileCharts } from './ProfileCharts';
import styles from './ProfilePage.module.css';

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

  function handleLogout() {
    setShowLogoutDialog(true);
  }

  if (isLoading || !profile) {
    return <div className={styles.loading}>{t.common.loading}</div>;
  }

  const avatarSrc = localAvatar ?? profile.avatarUrl;

  const memberSince = new Date(profile.createdAt).toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long' },
  );

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
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{t.profile.title}</h1>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={15} />
          {t.profile.logout}
        </button>
      </div>

      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.column}>
          {/* Avatar */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <User size={18} /> {t.profile.avatar}
            </h2>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {profile.name[0]?.toUpperCase()}
                  </div>
                )}
                <button
                  className={styles.avatarEditBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title={t.profile.changeAvatar}
                  disabled={avatarMutation.isPending}
                >
                  <Camera size={14} />
                </button>
              </div>
              <div className={styles.avatarInfo}>
                <p className={styles.avatarName}>{profile.name}</p>
                <p className={styles.avatarMeta}>
                  {t.profile.level}: <strong>{profile.level}</strong>
                </p>
                <p className={styles.avatarMeta}>
                  {t.profile.memberSince} {memberSince}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            {avatarMutation.isPending && (
              <p className={styles.avatarStatus}>{t.profile.uploadingAvatar}</p>
            )}
            {avatarError && (
              <p className={styles.error}>{avatarError}</p>
            )}
          </section>

          {/* Personal info */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <User size={18} /> {t.profile.personalInfo}
            </h2>
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
              <button
                className={styles.btn}
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? t.common.loading : t.profile.saveChanges}
              </button>
            </form>
          </section>

          {/* Password */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <Lock size={18} /> {t.profile.changePassword}
            </h2>
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
              <button
                className={styles.btn}
                type="submit"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? t.common.loading : t.profile.updatePassword}
              </button>
            </form>
          </section>

          {/* Language */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <Globe size={18} /> {t.profile.language}
            </h2>
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
          </section>
        </div>

        {/* Right column — stats + charts */}
        <div className={styles.column}>
          {/* Number stats */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <BarChart3 size={18} /> {t.profile.stats}
            </h2>
            {stats ? (
              <div className={styles.statsGrid}>
                <StatCard value={stats.words.mastered} label={t.profile.wordsMastered} color="green" />
                <StatCard value={stats.words.learning} label={t.profile.wordsInProgress} color="blue" />
                <StatCard value={stats.words.total} label={t.profile.wordsLearned} color="purple" />
                <StatCard value={stats.correctAnswers} label={t.profile.correctAnswers} color="orange" />
                <StatCard value={stats.grammar.completed} label={t.profile.grammarCompleted} color="teal" />
                <StatCard value={stats.listening.completed} label={t.profile.listeningCompleted} color="pink" />
                <StatCard value={stats.conversations} label={t.profile.conversations} color="indigo" />
              </div>
            ) : (
              <p className={styles.loading}>{t.common.loading}</p>
            )}
          </section>

          {/* Charts */}
          <ProfileCharts />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard_${color}`]}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
