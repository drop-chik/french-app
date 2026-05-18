import { Link, useRouterState } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuthStore } from '../../features/auth/authStore';
import { hubForPath, activeTabRoute, isUnlocked } from '../nav/navConfig';
import styles from './HubTabs.module.css';

/**
 * Contextual sub-tab strip for the current hub. Rendered by AppLayout above
 * the page content. Only shows on a hub's root tab routes (not on detail /
 * param pages — those are focus mode). Route-based: each unlocked tab is a
 * real Link, so deep links and the back button keep working. Locked tabs
 * (progressive disclosure) are visible but not navigable — so the user can
 * see what unlocks later.
 */
export function HubTabs() {
  const { t } = useI18n();
  const level = useAuthStore((s) => s.user?.level);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const hub = hubForPath(pathname);
  if (!hub?.tabs || hub.tabs.length < 2) return null;

  const active = activeTabRoute(pathname, hub);
  if (!active) return null; // detail / param route — keep it focused

  return (
    <nav className={styles.strip} aria-label={t.nav[hub.navKey]}>
      {hub.tabs.map((tab) => {
        const unlocked = isUnlocked(tab.minLevel, level);
        const label = t.nav[tab.navKey];
        if (!unlocked) {
          return (
            <span
              key={tab.key}
              className={`${styles.tab} ${styles.tabLocked}`}
              title={t.nav.lockedAt.replace('{level}', tab.minLevel)}
              aria-disabled="true"
            >
              <tab.icon size={15} />
              <span>{label}</span>
              <Lock size={12} className={styles.lockIcon} />
            </span>
          );
        }
        return (
          <Link
            key={tab.key}
            to={tab.route}
            className={`${styles.tab} ${active === tab.route ? styles.tabActive : ''}`}
          >
            <tab.icon size={15} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
