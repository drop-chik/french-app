import { Link, useRouterState } from '@tanstack/react-router';
import { useI18n } from '../i18n';
import { hubForPath, activeTabRoute } from '../nav/navConfig';
import styles from './HubTabs.module.css';

/**
 * Contextual sub-tab strip for the current hub. Rendered by AppLayout above
 * the page content. Only shows on a hub's root tab routes (not on detail /
 * param pages — those are focus mode). Route-based: each tab is a real Link,
 * so deep links and the back button keep working.
 */
export function HubTabs() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const hub = hubForPath(pathname);
  if (!hub?.tabs || hub.tabs.length < 2) return null;

  const active = activeTabRoute(pathname, hub);
  if (!active) return null; // detail / param route — keep it focused

  return (
    <nav className={styles.strip} aria-label={t.nav[hub.navKey]}>
      {hub.tabs.map((tab) => (
        <Link
          key={tab.key}
          to={tab.route}
          className={`${styles.tab} ${active === tab.route ? styles.tabActive : ''}`}
        >
          <tab.icon size={15} />
          <span>{t.nav[tab.navKey]}</span>
        </Link>
      ))}
    </nav>
  );
}
