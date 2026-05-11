import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useI18n } from '../i18n';
import styles from './InstallPrompt.module.css';

/**
 * "Add to Home Screen" banner.
 *
 * Listens for the browser's beforeinstallprompt event (fired only on engaged
 * sessions in supported browsers — Chromium/Edge/Samsung). When fired we show
 * a dismissible bar. Triggering `prompt()` requires a user gesture, so we
 * only call it from the install button click.
 *
 * Behaviour notes:
 * - "Dismiss" persists for 14 days (localStorage) — don't annoy people.
 * - We don't show the banner once the user has installed the app
 *   (display-mode: standalone | minimal-ui).
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'frenchup-pwa-dismiss-until';
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    return until > Date.now();
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const { t } = useI18n();
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch { /* ignore quota / disabled storage */ }
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
    } else {
      dismiss();
    }
  }

  if (!visible || !evt) return null;

  return (
    <div className={styles.banner} role="dialog" aria-label={t.pwa.title}>
      <div className={styles.iconWrap}>
        <Download size={18} />
      </div>
      <div className={styles.text}>
        <span className={styles.title}>{t.pwa.title}</span>
        <span className={styles.subtitle}>{t.pwa.subtitle}</span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.btnInstall} onClick={install}>
          {t.pwa.install}
        </button>
        <button type="button" className={styles.btnClose} onClick={dismiss} aria-label={t.pwa.dismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
