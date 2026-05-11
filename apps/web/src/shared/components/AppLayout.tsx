import { useState, useEffect, type ReactNode, type ComponentType } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Moon, Sun, BookOpen, Headphones, MessageCircle, Book, LayoutGrid, UserCircle,
  Home, Dumbbell, PenLine, BookMarked, Type, Trophy, MoreHorizontal, X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../i18n';
import { profileApi } from '../../features/profile/api';
import foxIcon from '../../pages/landing/fox-icon.png';
import styles from './AppLayout.module.css';

type IconType = ComponentType<{ size?: number | string; className?: string }>;
interface NavItem {
  to: string;
  label: string;
  icon: IconType;
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
  const avatarUrl = profileData?.avatarUrl ?? null;
  const streak = streakData?.streak ?? 0;
  const todayCompleted = streakData?.todayCompleted ?? false;

  // Close the bottom sheet on any route change.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Lock body scroll when the sheet is open (mobile).
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  // Desktop sidebar shows everything. Mobile bottom-bar shows only PRIMARY items;
  // the rest live in the "More" sheet. We keep a single source of truth: every
  // item lists which surface it belongs to.
  const PRIMARY: NavItem[] = [
    { to: '/dashboard',  label: t.nav.dashboard, icon: Home },
    { to: '/vocabulary', label: t.nav.words,     icon: BookOpen },
    { to: '/grammar',    label: t.nav.grammar,   icon: LayoutGrid },
    { to: '/drills',     label: t.nav.drills,    icon: Dumbbell },
  ];
  const SECONDARY: NavItem[] = [
    { to: '/listening',    label: t.nav.listening,     icon: Headphones },
    { to: '/reading',      label: t.nav.reading,       icon: BookMarked },
    { to: '/writing',      label: t.nav.writing,       icon: PenLine },
    { to: '/conjugation',  label: t.nav.conjugation,   icon: Type },
    { to: '/conversation', label: t.nav.conversations, icon: MessageCircle },
    { to: '/dictionary',   label: t.nav.dictionary,    icon: Book },
    { to: '/achievements', label: t.nav.achievements,  icon: Trophy },
    { to: '/profile',      label: t.nav.profile,       icon: UserCircle },
  ];
  const DESKTOP_NAV = [...PRIMARY, ...SECONDARY];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link to="/dashboard" className={styles.logo}>
          <img src={foxIcon} alt="FrenchUp" className={styles.logoIcon} />
          <span className={styles.logoText}>FrenchUp</span>
        </Link>

        {/* Desktop nav — every item */}
        <nav className={styles.nav}>
          {DESKTOP_NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={styles.navLink}
              activeProps={{ className: styles.navLinkActive }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile bottom nav — 4 primary + "More" */}
        <nav className={styles.mobileNav}>
          {PRIMARY.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={styles.mobileNavLink}
              activeProps={{ className: styles.mobileNavLinkActive }}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`${styles.mobileNavLink} ${styles.moreButton} ${moreOpen ? styles.mobileNavLinkActive : ''}`}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={22} />
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
              <div className={styles.userMeta}>
                <span className={styles.userLevel}>{profileData?.level ?? user?.level}</span>
                {streak > 0 && (
                  <span className={`${styles.streakMini} ${todayCompleted ? styles.streakMiniDone : ''}`}>
                    🔥 {streak}
                  </span>
                )}
              </div>
            </div>
            <UserCircle size={16} className={styles.profileIcon} />
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

      {/* Mobile "More" sheet — only renders when open. Backdrop closes it. */}
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
