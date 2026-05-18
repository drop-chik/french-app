import { Link } from '@tanstack/react-router';
import { Lock, Home, UserCircle, Trophy, Users } from 'lucide-react';
import { useI18n } from '../../shared/i18n';
import { useAuthStore } from '../../features/auth/authStore';
import { HUBS, isUnlocked, type IconType, type Level } from '../../shared/nav/navConfig';
import styles from './ExplorePage.module.css';

// route → i18n description leaf under t.explore
const ROUTE_DESC: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/vocabulary': 'vocabulary',
  '/dictionary': 'dictionary',
  '/grammar': 'grammar',
  '/conjugation': 'conjugation',
  '/drills': 'drills',
  '/listening': 'listening',
  '/reading': 'reading',
  '/conversation': 'conversation',
  '/writing': 'writing',
  '/profile': 'profile',
  '/achievements': 'achievements',
  '/friends': 'friends',
};

interface Item {
  route: string;
  label: string;
  descKey: string;
  icon: IconType;
  minLevel: Level;
}

export function ExplorePage() {
  const { t } = useI18n();
  const level = useAuthStore((s) => s.user?.level);

  // Built from navConfig so the catalog never drifts from the real nav.
  const groups: { key: string; title: string; items: Item[] }[] = [];
  for (const hub of HUBS) {
    if (hub.adminOnly) continue;
    const title = t.nav[hub.navKey];
    if (hub.tabs && hub.tabs.length) {
      groups.push({
        key: hub.key,
        title,
        items: hub.tabs.map((tb) => ({
          route: tb.route,
          label: t.nav[tb.navKey],
          descKey: ROUTE_DESC[tb.route] ?? '',
          icon: tb.icon,
          minLevel: tb.minLevel,
        })),
      });
    } else if (hub.key === 'home') {
      groups.push({
        key: hub.key,
        title,
        items: [{ route: '/dashboard', label: t.nav.dashboard, descKey: 'dashboard', icon: Home, minLevel: 'A1' }],
      });
    } else if (hub.key === 'profile') {
      groups.push({
        key: hub.key,
        title,
        items: [
          { route: '/profile', label: t.nav.profile, descKey: 'profile', icon: UserCircle, minLevel: 'A1' },
          { route: '/achievements', label: t.nav.achievements, descKey: 'achievements', icon: Trophy, minLevel: 'A1' },
          { route: '/friends', label: t.nav.friends, descKey: 'friends', icon: Users, minLevel: 'A1' },
        ],
      });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.explore.title}</h1>
        <p className={styles.subtitle}>{t.explore.subtitle}</p>
      </div>

      {groups.map((g) => (
        <section key={g.key} className={styles.section}>
          <h2 className={styles.sectionTitle}>{g.title}</h2>
          <div className={styles.list}>
            {g.items.map((it) => {
              const unlocked = isUnlocked(it.minLevel, level);
              const Icon = it.icon;
              const inner = (
                <>
                  <Icon size={20} className={styles.rowIcon ?? ''} />
                  <div className={styles.rowBody}>
                    <span className={styles.rowLabel}>{it.label}</span>
                    <span className={styles.rowDesc}>{t.explore[it.descKey]}</span>
                  </div>
                  {!unlocked && (
                    <span className={styles.rowLock}>
                      <Lock size={13} />
                      {t.nav.lockedAt.replace('{level}', it.minLevel)}
                    </span>
                  )}
                </>
              );
              return unlocked ? (
                <Link key={it.route} to={it.route} className={styles.row}>
                  {inner}
                </Link>
              ) : (
                <div key={it.route} className={`${styles.row} ${styles.rowLocked}`}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
