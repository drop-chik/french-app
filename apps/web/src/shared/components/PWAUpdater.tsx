import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { useI18n } from '../i18n';
import styles from './PWAUpdater.module.css';

/**
 * Service-worker update banner. Sits at the bottom-right of the screen
 * whenever the SW finds a new bundle waiting in the cache.
 *
 * Why this exists: vite-plugin-pwa was set to registerType='autoUpdate'
 * before, which silently activated new SWs and broke lazy chunk loads
 * mid-session (the still-running old bundle's URLs pointed at old chunk
 * hashes the new SW didn't precache → 404 → blank screen). With
 * registerType='prompt' the new SW stays in 'waiting' state, and this
 * component:
 *  1. Subscribes to onNeedRefresh via useRegisterSW
 *  2. Renders a non-blocking banner — user can ignore and keep working
 *  3. On "Reload" clicks updateServiceWorker() which sends SKIP_WAITING
 *     to the waiting SW and reloads the page, all atomically.
 *
 * Dismissal is session-scoped (sessionStorage) — close the banner, but
 * if you don't reload, it returns on the next page load so you can't
 * forget about it long-term.
 */
const DISMISS_KEY = 'frenchup:pwa-update-dismissed';

export function PWAUpdater() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; }
    catch { return false; }
  });

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      // SW registration failed — log to Sentry via the global error
      // handler. Don't toast: user can't do anything about it.
      if (error instanceof Error) {
        void import('../../lib/sentry').then((m) =>
          m.reportError(error, { kind: 'sw.register' }),
        );
      }
    },
  });

  if (!needRefresh || dismissed) return null;

  function handleReload() {
    // Pass true so the helper sends SKIP_WAITING + reloads the page.
    // We don't await — the reload will tear down this component.
    void updateServiceWorker(true);
  }

  function handleDismiss() {
    setDismissed(true);
    setNeedRefresh(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
  }

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.icon}>
        <RefreshCw size={18} />
      </div>
      <div className={styles.text}>
        <strong className={styles.title}>{t.pwa.updateTitle}</strong>
        <span className={styles.body}>{t.pwa.updateBody}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.reloadBtn}
          onClick={handleReload}
        >
          {t.pwa.updateReload}
        </button>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={handleDismiss}
          aria-label={t.pwa.updateLater}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
