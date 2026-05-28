import { useEffect, useState } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
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

/**
 * Detect iOS Safari specifically (not Chrome-on-iOS, not in-app web views).
 * iOS Safari is the only browser that supports PWA install but does NOT
 * fire `beforeinstallprompt` — users have to use the Share menu themselves.
 * We need to show them an instruction banner because they can't discover
 * the install flow from web UI.
 *
 * Excludes:
 *  - Chrome on iOS ("CriOS" UA) — uses Safari engine but no PWA install
 *  - Firefox on iOS ("FxiOS") — same
 *  - In-app browsers (FB / Instagram / TikTok) — install doesn't work there
 */
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (!isIOS) return false;
  // Exclude non-Safari iOS browsers and in-app webviews.
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|Line\//.test(ua);
  return isSafari;
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
  // Separate iOS state — Apple doesn't fire beforeinstallprompt, so we
  // can't piggyback on `evt` to decide what to render.
  const [iosVisible, setIosVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);

    // For iOS Safari: no native event ever fires. Delay our manual banner
    // by 8 seconds so first-time visitors don't get hit with a "install
    // me" prompt before they've even seen what the app does. After that,
    // it sits there until they dismiss or install.
    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    if (isIOSSafari()) {
      iosTimer = setTimeout(() => setIosVisible(true), 8000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    setIosVisible(false);
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

  // iOS Safari path: no install event, render instructions instead. The
  // icons match Safari's UI so users can visually associate them with
  // the actual buttons on their device.
  if (iosVisible && !visible) {
    return (
      <div className={styles.banner} role="dialog" aria-label={t.pwa.iosTitle}>
        <div className={styles.iconWrap}>
          <Download size={18} />
        </div>
        <div className={styles.text}>
          <span className={styles.title}>{t.pwa.iosTitle}</span>
          <span className={styles.subtitle}>{t.pwa.iosBody}</span>
          <ol className={styles.iosSteps}>
            <li><Share size={13} /> {t.pwa.iosStep1}</li>
            <li><Plus size={13} /> {t.pwa.iosStep2}</li>
          </ol>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnClose} onClick={dismiss} aria-label={t.pwa.dismiss}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
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
