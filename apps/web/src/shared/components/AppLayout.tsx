import { useState, useEffect, type ReactNode, type ComponentType } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Moon, Sun, BookOpen, Headphones, MessageCircle, Book, LayoutGrid, UserCircle,
  Home, Dumbbell, PenLine, BookMarked, Type, Trophy, MoreHorizontal, X, Flame,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../i18n';
import { profileApi } from '../../features/profile/api';
import { achievementsApi } from '../../features/achievements/api';
import foxIcon from '../../pages/landing/fox-icon.png';
import styles from './AppLayout.module.css';

type IconType = ComponentType<{ size?: number | string; className?: string }>;
interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  badgeKey?: 'wordsDue';
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { toggle, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

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
  // Home data — gives us due-words count for the sidebar badge. TanStack Query
  // dedupes with the Dashboard's call, so we don't double-fetch.
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

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  // Single source of truth — every nav item lists its group + which surfaces
  // it appears on. The desktop sidebar shows them grouped; the mobile bottom
  // bar shows only "primary" ones, the rest live in the "More" sheet.
  const GROUPS: Array<{ key: 'learn' | 'practice' | 'reference'; label: string; items: NavItem[] }> = [
    {
      key: 'learn',
      label: t.nav.groupLearn,
      items: [
        { to: '/dashboard',  label: t.nav.dashboard,   icon: Home },
        { to: '/vocabulary', label: t.nav.words,       icon: BookOpen, badgeKey: 'wordsDue' },
        { to: '/grammar',    label: t.nav.grammar,     icon: LayoutGrid },
        { to: '/conjugation', label: t.nav.conjugation, icon: Type },
      ],
    },
    {
      key: 'practice',
      label: t.nav.groupPractice,
      items: [
        { to: '/listening',    label: t.nav.listening,     icon: Headphones },
        { to: '/reading',      label: t.nav.reading,       icon: BookMarked },
        { to: '/writing',      label: t.nav.writing,       icon: PenLine },
        { to: '/drills',       label: t.nav.drills,        icon: Dumbbell },
        { to: '/conversation', label: t.nav.conversations, icon: MessageCircle },
      ],
    },
    {
      key: 'reference',
      label: t.nav.groupReference,
      items: [
        { to: '/dictionary',   label: t.nav.dictionary,   icon: Book },
        { to: '/achievements', label: t.nav.achievements, icon: Trophy },
      ],
    },
  ];

  // Mobile primary tabs — keep at 4, the most-used.
  const PRIMARY: NavItem[] = [
    { to: '/dashboard',  label: t.nav.dashboard, icon: Home },
    { to: '/vocabulary', label: t.nav.words,     icon: BookOpen, badgeKey: 'wordsDue' },
    { to: '/grammar',    label: t.nav.grammar,   icon: LayoutGrid },
    { to: '/drills',     label: t.nav.drills,    icon: Dumbbell },
  ];
  // Everything else for the "More" sheet (everything from GROUPS minus PRIMARY).
  const primaryRoutes = new Set(PRIMARY.map((p) => p.to));
  const SECONDARY: NavItem[] = GROUPS
    .flatMap((g) => g.items)
    .filter((item) => !primaryRoutes.has(item.to))
    .concat([{ to: '/profile', label: t.nav.profile, icon: UserCircle }]);

  function getBadge(item: NavItem): number | null {
    if (item.badgeKey === 'wordsDue' && wordsDue > 0) return wordsDue;
    return null;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link to="/dashboard" className={styles.logo}>
          <img src={foxIcon} alt="FrenchUp" className={styles.logoIcon} />
          <span className={styles.logoText}>FrenchUp</span>
        </Link>

        {/* Stats card — only on desktop sidebar */}
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

        {/* Desktop nav — grouped */}
        <nav className={styles.nav}>
          {GROUPS.map((group) => (
            <div key={group.key} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {group.items.map(({ to, label, icon: Icon, ...rest }) => {
                const badge = getBadge({ to, label, icon: Icon, ...rest });
                return (
                  <Link
                    key={to}
                    to={to}
                    className={styles.navLink}
                    activeProps={{ className: styles.navLinkActive }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    {badge !== null && <span className={styles.navBadge}>{badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mobile bottom nav — 4 primary + "More" */}
        <nav className={styles.mobileNav}>
          {PRIMARY.map(({ to, label, icon: Icon, ...rest }) => {
            const badge = getBadge({ to, label, icon: Icon, ...rest });
            return (
              <Link
                key={to}
                to={to}
                className={styles.mobileNavLink}
                activeProps={{ className: styles.mobileNavLinkActive }}
              >
                <div className={styles.mobileIconWrap}>
                  <Icon size={22} />
                  {badge !== null && <span className={styles.mobileBadge}>{badge}</span>}
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`${styles.mobileNavLink} ${moreOpen ? styles.mobileNavLinkActive : ''}`}
            aria-expanded={moreOpen}
          >
            <div className={styles.mobileIconWrap}>
              <MoreHorizontal size={22} />
            </div>
            <span>{t.nav.more}</span>
          </button>
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
                : (user?.name?.[0]?.toUpperCase() ?? '?')
              }
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
        {children}
      </main>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div
          className={styles.sheetBackdrop}
          onClick={() => setMoreOpen(false)}
          role="presentation"
        >
          <div
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.moreSheetTitle}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>{t.nav.moreSheetTitle}</h2>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setMoreOpen(false)}
                aria-label={t.pwa.dismiss}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.sheetGrid}>
              {SECONDARY.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={styles.sheetItem}
                  activeProps={{ className: `${styles.sheetItem} ${styles.sheetItemActive}` }}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <div className={styles.sheetDivider} />

            <button
              type="button"
              className={styles.sheetThemeRow}
              onClick={toggle}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              <span>{t.nav.theme}</span>
              <span className={styles.sheetThemeValue}>{isDark ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
