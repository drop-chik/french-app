import { type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Moon, Sun, Flame, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../i18n';
import { profileApi } from '../../features/profile/api';
import { achievementsApi } from '../../features/achievements/api';
import { HUBS, hubForPath, hubEntryRoute, hubAllLocked } from '../nav/navConfig';
import { HubTabs } from './HubTabs';
import foxIcon from '../../pages/landing/fox-icon.png';
import styles from './AppLayout.module.css';

export function AppLayout({ children }: { children: ReactNode }) {
  const { toggle, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: Infinity,
    enabled: !!user,
  });
  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: profileApi.getStreak,
    staleTime: 10 * 60 * 1000,
    enabled: !!user,
  });
  const { data: homeData } = useQuery({
    queryKey: ['home'],
    queryFn: profileApi.getHomeData,
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });
  const { data: xpData } = useQuery({
    queryKey: ['xp-summary'],
    queryFn: achievementsApi.xp,
    staleTime: 60_000,
    enabled: !!user,
  });

  const avatarUrl = profileData?.avatarUrl ?? null;
  const streak = streakData?.streak ?? 0;
  const todayCompleted = streakData?.todayCompleted ?? false;
  const wordsDue = homeData?.todayPlan.wordsDue ?? 0;
  const cefrLevel = profileData?.level ?? user?.level ?? 'A1';
  const xpLevel = xpData?.level ?? 1;
  const xpAtLevel = xpData?.xpAtLevel ?? 0;
  const xpForNext = xpData?.xpForNextLevel ?? 100;
  const xpPct = xpData?.pctToNext ?? 0;

  // 5 stable hubs for everyone; Admin appended on desktop only for admins.
  const coreHubs = HUBS.filter((h) => !h.adminOnly);
  const showAdmin = user?.role === 'admin';
  const adminHub = HUBS.find((h) => h.adminOnly);
  const activeHub = hubForPath(pathname);

  const badgeFor = (key: string): number | null =>
    key === 'words' && wordsDue > 0 ? wordsDue : null;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link to="/dashboard" className={styles.logo}>
          <img src={foxIcon} alt="FrenchUp" className={styles.logoIcon} />
          <span className={styles.logoText}>FrenchUp</span>
        </Link>

        {/* Stats card — desktop sidebar only */}
        <div className={styles.statsCard}>
          <div className={styles.statsTopRow}>
            <div className={`${styles.statsStreak} ${todayCompleted ? styles.statsStreakDone : ''}`}>
              <Flame size={14} className={styles.flameIcon} />
              <span className={styles.statsStreakNum}>{streak}</span>
            </div>
            <span className={styles.statsCefr}>{cefrLevel}</span>
          </div>
          <div className={styles.statsXpRow}>
            <span className={styles.statsXpLevel}>{t.nav.xpLevel} {xpLevel}</span>
            <span className={styles.statsXpValue}>{xpAtLevel} / {xpForNext} XP</span>
          </div>
          <div className={styles.statsBar} role="progressbar" aria-valuenow={xpPct} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.statsBarFill} style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        {/* Desktop nav — 5 flat hubs (+ Admin for admins) */}
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            {coreHubs.map((hub) => {
              const Icon = hub.icon;
              const badge = badgeFor(hub.key);
              const locked = hubAllLocked(hub, cefrLevel);
              return (
                <Link
                  key={hub.key}
                  to={hubEntryRoute(hub, cefrLevel)}
                  className={`${styles.navLink} ${activeHub?.key === hub.key ? styles.navLinkActive : ''}`}
                  data-tour={`sidebar-${hub.key}`}
                >
                  <Icon size={18} />
                  <span>{t.nav[hub.navKey]}</span>
                  {locked && <Lock size={13} className={styles.navLock} />}
                  {badge !== null && <span className={styles.navBadge}>{badge}</span>}
                </Link>
              );
            })}
            {showAdmin && adminHub && (
              <Link
                to={adminHub.defaultRoute}
                className={`${styles.navLink} ${activeHub?.key === 'admin' ? styles.navLinkActive : ''}`}
              >
                <adminHub.icon size={18} />
                <span>{t.nav[adminHub.navKey]}</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile bottom nav — exactly the 5 core hubs, no "More" sheet */}
        <nav className={styles.mobileNav}>
          {coreHubs.map((hub) => {
            const Icon = hub.icon;
            const badge = badgeFor(hub.key);
            const locked = hubAllLocked(hub, cefrLevel);
            return (
              <Link
                key={hub.key}
                to={hubEntryRoute(hub, cefrLevel)}
                className={`${styles.mobileNavLink} ${activeHub?.key === hub.key ? styles.mobileNavLinkActive : ''}`}
              >
                <div className={styles.mobileIconWrap}>
                  <Icon size={22} />
                  {locked && <Lock size={11} className={styles.mobileLock} />}
                  {badge !== null && <span className={styles.mobileBadge}>{badge}</span>}
                </div>
                <span>{t.nav[hub.navKey]}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link
            to="/profile"
            className={styles.userInfo}
            activeProps={{ className: `${styles.userInfo} ${styles.userInfoActive}` }}
            title={t.nav.profile}
          >
            <div className={styles.userAvatar}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className={styles.userAvatarImg} />
                : (user?.name?.[0]?.toUpperCase() ?? '?')}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </Link>
          <button
            className={styles.themeToggle}
            onClick={toggle}
            aria-label={t.home.toggleTheme}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <HubTabs />
        {children}
      </main>
    </div>
  );
}
