import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Lock, User, Globe, LogOut, Settings, ChevronDown, Bell } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import type { UserProfile } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { achievementsApi } from '../../features/achievements/api';
import { AchievementBadge } from '../../features/achievements/AchievementBadge';
import { usePush } from '../../features/push/usePush';
import { HeroBanner } from './HeroBanner';
import { StreakCard, WeeklyGoalCard } from './StatCards';
import { LevelJourney } from './LevelJourney';
import { InsightGrid } from './InsightGrid';
import { ActivityHeatmap } from './ActivityHeatmap';
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
  const { data: streakData } = useQuery({
    queryKey: ['profile-streak'],
    queryFn: profileApi.getStreak,
  });
  const { data: levelsData } = useQuery({
    queryKey: ['profile-levels'],
    queryFn: profileApi.getLevelsProgress,
  });
  const { data: chartsData } = useQuery({
    queryKey: ['profile-charts'],
    queryFn: profileApi.getCharts,
  });

  const { data: homeData } = useQuery({
    queryKey: ['profile-home'],
    queryFn: profileApi.getHomeData,
  });
  const { data: xpData } = useQuery({
    queryKey: ['xp-summary'],
    queryFn: achievementsApi.xp,
  });
  const { data: recentAchievementsData } = useQuery({
    queryKey: ['profile-recent-achievements'],
    queryFn: () => achievementsApi.recent(6),
    staleTime: 60_000,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Session-size settings moved to /vocabulary (gear icon in header).
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
    mutationFn: (data: { name?: string; email?: string; dailyNewWordsLimit?: number; dailyDueWordsLimit?: number }) =>
      profileApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(['profile'], (old) =>
        old ? { ...old, ...updated } : old,
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

  const correctAnswers = stats?.correctAnswers ?? 0;
  const incorrectAnswers = stats?.incorrectAnswers ?? 0;
  const totalAnswers = correctAnswers + incorrectAnswers;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : null;
  const currentLevelData = levelsData?.levels.find((l) => l.level === profile.level);
  const currentLevelPercent = currentLevelData?.percent ?? 0;

  // Build last-7-days activity counts for the WeekInsight sparkline
  const weekActivity = (chartsData?.activity ?? []).slice(-7).map((d) => d.reviewed);

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

      {/* Header */}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleAvatarChange}
      />

      {/* 1. Hero banner */}
      <HeroBanner
        name={profile.name}
        level={profile.level}
        memberSince={memberSince}
        avatarSrc={avatarSrc}
        levelPercent={currentLevelPercent}
        streak={streakData?.streak ?? 0}
        wordsMastered={stats?.words.mastered ?? 0}
        accuracy={accuracy}
        grammarCompleted={stats?.grammar.completed ?? 0}
        xp={xpData ?? null}
        labels={{
          streak: t.profile.heroStreakDays,
          words: t.profile.heroWords,
          accuracy: t.profile.accuracy,
          grammar: t.profile.heroGrammar,
          memberSince: t.profile.memberSince,
          xpLevel: t.achievements.level,
        }}
        onAvatarClick={() => fileInputRef.current?.click()}
        avatarUploading={avatarMutation.isPending}
      />
      {avatarError && <p className={styles.errorBanner}>{avatarError}</p>}

      {/* 2. Streak + Weekly goal */}
      <div className={styles.twoCol}>
        <StreakCard
          streak={streakData?.streak ?? 0}
          todayCompleted={streakData?.todayCompleted ?? false}
          last7Days={streakData?.last7Days ?? []}
          labels={{
            title: t.profile.streakTitle,
            days: t.profile.streakDays,
            keepGoing: t.profile.streakKeepGoing,
            started: t.profile.streakStarted,
            start: t.profile.streakStart,
            broken: t.profile.streakBroken,
          }}
          lang={lang}
        />
        <WeeklyGoalCard
          current={stats?.weekReviews ?? 0}
          trend={stats?.weekTrend ?? null}
          labels={{
            title: t.profile.weeklyGoalTitle,
            of: t.profile.weeklyGoalOf,
            daysLeft: t.profile.weeklyGoalDaysLeft,
            lastDay: t.profile.weeklyGoalLastDay,
            done: t.profile.weeklyGoalDone,
          }}
        />
      </div>

      {/* 3. Level journey */}
      <LevelJourney
        levels={levelsData?.levels ?? []}
        currentLevel={profile.level}
        labels={{
          title: t.profile.levelJourneyTitle,
          master: t.profile.levelStatusMaster,
          active: t.profile.levelStatusActive,
          available: t.profile.levelStatusAvailable,
          next: t.profile.levelStatusNext,
          locked: t.profile.levelStatusLocked,
        }}
      />

      {/* 3.5 Recent achievements */}
      {recentAchievementsData && recentAchievementsData.items.length > 0 && (
        <section className={styles.recentAchievements}>
          <div className={styles.recentAchievementsHeader}>
            <h2 className={styles.recentAchievementsTitle}>{t.profile.recentAchievementsTitle}</h2>
            <button
              type="button"
              className={styles.recentAchievementsMore}
              onClick={() => router.navigate({ to: '/achievements' })}
            >
              {t.profile.viewAll} →
            </button>
          </div>
          <div className={styles.recentAchievementsGrid}>
            {recentAchievementsData.items.map((item) => (
              <AchievementBadge key={item.id} item={item} lang={lang} size="sm" />
            ))}
          </div>
        </section>
      )}

      {/* 4. Insight grid */}
      <InsightGrid
        wordsBreakdown={chartsData?.statusBreakdown ?? {}}
        wordsDueToday={stats?.wordsDueToday ?? 0}
        grammarCompleted={homeData?.levelProgress.completedGrammar ?? 0}
        grammarTotal={homeData?.levelProgress.totalGrammar ?? 0}
        listeningCompleted={homeData?.levelProgress.completedListening ?? 0}
        listeningTotal={homeData?.levelProgress.totalListening ?? 0}
        nextGrammar={homeData?.todayPlan.nextGrammar ?? null}
        nextListening={homeData?.todayPlan.nextListening ?? null}
        weekReviews={stats?.weekReviews ?? 0}
        weekActivity={weekActivity}
        labels={{
          wordsTitle: t.profile.insightWordsTitle,
          wordsSub: t.profile.insightWordsSub,
          wordsStatus: {
            new: t.profile.wordStatusNew,
            learning: t.profile.wordStatusLearning,
            review: t.profile.wordStatusReview,
            mastered: t.profile.wordStatusMastered,
          },
          reviewTitle: t.profile.insightReviewTitle,
          reviewSub: t.profile.insightReviewSub,
          reviewCta: t.profile.insightReviewCta,
          reviewDone: t.profile.insightReviewDone,
          continueTitle: t.profile.insightContinueTitle,
          continueGrammar: t.profile.insightContinueGrammar,
          continueListening: t.profile.insightContinueListening,
          continueReading: t.profile.insightContinueReading,
          continueReadingSub: t.profile.insightContinueReadingSub,
          continueAllDone: t.profile.insightContinueAllDone,
          weekTitle: t.profile.insightWeekTitle,
          weekSub: t.profile.insightWeekSub,
        }}
      />

      {/* 5. Activity heatmap (90 days) */}
      {chartsData && chartsData.activity.length > 0 && (
        <ActivityHeatmap
          activity={chartsData.activity}
          labels={{
            title: t.profile.activityTitle,
            less: t.profile.activityLegendLess,
            more: t.profile.activityLegendMore,
            activeDays: t.profile.activityActiveDays,
            words: t.profile.heatmapWords,
            bestDay: t.profile.activityBestDay,
            avgPerDay: t.profile.activityAvgPerDay,
            longestStreak: t.profile.activityLongestStreak,
            noData: t.profile.activityNoData,
          }}
          lang={lang}
        />
      )}

      {/* 6. Settings accordion */}
      <details className={styles.accordion}>
        <summary className={styles.accordionSummary}>
          <Settings size={18} />
          <span>{t.profile.settings}</span>
          <ChevronDown size={18} className={styles.accordionChevron} />
        </summary>
        <div className={styles.accordionContent}>

          {/* — Personal info — */}
          <div className={styles.settingsBlock}>
            <div className={styles.settingsBlockHead}>
              <div className={`${styles.settingsIconBubble} ${styles.bubbleBlue}`}>
                <User size={18} />
              </div>
              <div className={styles.settingsBlockTitleWrap}>
                <h3 className={styles.settingsBlockTitle}>{t.profile.personalInfo}</h3>
                <p className={styles.settingsBlockDesc}>{t.profile.personalInfoDesc}</p>
              </div>
            </div>
            <form
              className={styles.settingsForm}
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate({ name, email });
              }}
            >
              <div className={styles.fieldRow}>
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
              </div>
              <div className={styles.settingsFooter}>
                {profileMsg && (
                  <p className={profileMsg.type === 'ok' ? styles.success : styles.error}>
                    {profileMsg.text}
                  </p>
                )}
                <button className={styles.btnPrimary} type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? t.common.loading : t.profile.saveChanges}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.settingsDivider} />

          {/* Session size limits moved to /vocabulary (gear icon in the
              header). Kept here as legacy was confusing — both forms shared
              the same mutation and the global onSuccess fired the 'Saved'
              message under both blocks, making it look like both were saved
              when only one was. */}

          {/* — Security — */}
          <div className={styles.settingsBlock}>
            <div className={styles.settingsBlockHead}>
              <div className={`${styles.settingsIconBubble} ${styles.bubbleOrange}`}>
                <Lock size={18} />
              </div>
              <div className={styles.settingsBlockTitleWrap}>
                <h3 className={styles.settingsBlockTitle}>{t.profile.changePassword}</h3>
                <p className={styles.settingsBlockDesc}>{t.profile.changePasswordDesc}</p>
              </div>
            </div>
            <form
              className={styles.settingsForm}
              onSubmit={(e) => {
                e.preventDefault();
                updatePasswordMutation.mutate();
              }}
            >
              <div className={styles.fieldRow}>
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
              </div>
              <div className={styles.settingsFooter}>
                {pwdMsg && (
                  <p className={pwdMsg.type === 'ok' ? styles.success : styles.error}>
                    {pwdMsg.text}
                  </p>
                )}
                <button className={styles.btnPrimary} type="submit" disabled={updatePasswordMutation.isPending}>
                  {updatePasswordMutation.isPending ? t.common.loading : t.profile.updatePassword}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.settingsDivider} />

          {/* — Language — */}
          <div className={styles.settingsBlock}>
            <div className={styles.settingsBlockHead}>
              <div className={`${styles.settingsIconBubble} ${styles.bubbleGreen}`}>
                <Globe size={18} />
              </div>
              <div className={styles.settingsBlockTitleWrap}>
                <h3 className={styles.settingsBlockTitle}>{t.profile.language}</h3>
                <p className={styles.settingsBlockDesc}>{t.profile.languageDesc}</p>
              </div>
            </div>
            <div className={styles.langTiles}>
              <button
                className={`${styles.langTile} ${lang === 'ru' ? styles.langTileActive : ''}`}
                onClick={() => handleLangChange('ru')}
                type="button"
              >
                <span className={styles.langBadge}>RU</span>
                <div className={styles.langTileText}>
                  <span className={styles.langTileName}>Русский</span>
                  <span className={styles.langTileSub}>Russian</span>
                </div>
                {lang === 'ru' && <span className={styles.langCheck} />}
              </button>
              <button
                className={`${styles.langTile} ${lang === 'en' ? styles.langTileActive : ''}`}
                onClick={() => handleLangChange('en')}
                type="button"
              >
                <span className={styles.langBadge}>EN</span>
                <div className={styles.langTileText}>
                  <span className={styles.langTileName}>English</span>
                  <span className={styles.langTileSub}>English</span>
                </div>
                {lang === 'en' && <span className={styles.langCheck} />}
              </button>
            </div>
          </div>

          <div className={styles.settingsDivider} />

          {/* — Notifications — */}
          <NotificationsBlock />
        </div>
      </details>
    </div>
  );
}

function NotificationsBlock() {
  const { t } = useI18n();
  const { permission, subscribed, busy, enable, disable, test } = usePush();

  const isUnsupported = permission === 'unsupported';
  const isDenied = permission === 'denied';
  const canToggle = !isUnsupported && !isDenied && !busy;

  let hint: string | null = null;
  if (isUnsupported) hint = t.profile.notifUnsupported;
  else if (isDenied) hint = t.profile.notifDenied;

  async function handleToggle() {
    if (!canToggle) return;
    if (subscribed) await disable();
    else await enable();
  }

  return (
    <div className={styles.settingsBlock}>
      <div className={styles.settingsBlockHead}>
        <div className={`${styles.settingsIconBubble} ${styles.bubblePink}`}>
          <Bell size={18} />
        </div>
        <div className={styles.settingsBlockTitleWrap}>
          <h3 className={styles.settingsBlockTitle}>{t.profile.notifTitle}</h3>
          <p className={styles.settingsBlockDesc}>{t.profile.notifDesc}</p>
        </div>
      </div>
      <div className={styles.notifBody}>
        <div className={styles.notifRow}>
          <span className={styles.notifLabel}>
            {subscribed ? t.profile.notifEnabled : t.profile.notifDisabled}
          </span>
          {/* iOS-style toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={subscribed}
            disabled={!canToggle}
            onClick={handleToggle}
            className={`${styles.toggle} ${subscribed ? styles.toggleOn : ''}`}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
        {hint && <p className={styles.notifHint}>{hint}</p>}
        {subscribed && (
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={busy}
            onClick={async () => {
              const r = await test();
              console.log('[push] test result:', r);
            }}
          >
            {t.profile.notifTest}
          </button>
        )}
      </div>
    </div>
  );
}
