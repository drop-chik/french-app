import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Moon, Sun, BookOpen, Headphones, MessageCircle, Book, LayoutGrid, UserCircle, Home, Dumbbell, PenLine, BookMarked, Type, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../i18n';
import { profileApi } from '../../features/profile/api';
import foxIcon from '../../pages/landing/fox-icon.png';
import styles from './AppLayout.module.css';

export function AppLayout({ children }: { children: ReactNode }) {
  const { toggle, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { t } = useI18n();
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

  const NAV_ITEMS = [
    { to: '/dashboard',    label: t.nav.dashboard,     icon: Home,          mobileOnly: false },
    { to: '/vocabulary',   label: t.nav.words,          icon: BookOpen,      mobileOnly: false },
    { to: '/grammar',      label: t.nav.grammar,        icon: LayoutGrid,    mobileOnly: false },
    { to: '/listening',    label: t.nav.listening,      icon: Headphones,    mobileOnly: false },
    { to: '/reading',      label: t.nav.reading,        icon: BookMarked,    mobileOnly: false },
    { to: '/writing',      label: t.nav.writing,        icon: PenLine,       mobileOnly: false },
    { to: '/drills',       label: t.nav.drills,         icon: Dumbbell,      mobileOnly: false },
    { to: '/conjugation',  label: t.nav.conjugation,    icon: Type,          mobileOnly: false },
    { to: '/conversation', label: t.nav.conversations,  icon: MessageCircle, mobileOnly: false },
    { to: '/dictionary',   label: t.nav.dictionary,     icon: Book,          mobileOnly: false },
    { to: '/achievements', label: t.nav.achievements,   icon: Trophy,        mobileOnly: false },
    { to: '/profile',      label: t.nav.profile,        icon: UserCircle,    mobileOnly: true  },
  ] as const;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link to="/dashboard" className={styles.logo}>
          <img src={foxIcon} alt="FrenchUp" className={styles.logoIcon} />
          <span className={styles.logoText}>FrenchUp</span>
        </Link>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, mobileOnly }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.navLink} ${mobileOnly ? styles.navLinkMobileOnly : ''}`}
              activeProps={{ className: styles.navLinkActive }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
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
    </div>
  );
}
