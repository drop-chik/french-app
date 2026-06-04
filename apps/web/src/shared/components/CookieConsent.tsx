import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent, onConsentChange } from '../../lib/consent';
import { useI18n } from '../../shared/i18n';
import styles from './CookieConsent.module.css';

/**
 * Non-blocking cookie consent banner. Renders only when the user hasn't
 * made a choice yet (getConsent() === null). Two equally-weighted buttons
 * (Accept / Reject) to stay CNIL-friendly — no dark patterns. The X
 * dismisses without choosing, but the banner returns on next visit until
 * a real decision is made.
 *
 * Strictly necessary cookies (auth refresh token, theme, language) are
 * not gated by this. Only Sentry telemetry and PostHog analytics check
 * hasConsent() before booting.
 */
export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    const off = onConsentChange((value) => {
      if (value === 'accepted' || value === 'rejected') setVisible(false);
    });
    return off;
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-label={t.cookie.label}>
      <div className={styles.inner}>
        <div className={styles.icon}><Cookie size={20} /></div>
        <div className={styles.body}>
          <h2 className={styles.title}>{t.cookie.title}</h2>
          <p className={styles.text}>{t.cookie.text}</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => setConsent('rejected')}
          >
            {t.cookie.reject}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setConsent('accepted')}
          >
            {t.cookie.accept}
          </button>
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label={t.cookie.dismiss}
          onClick={() => setVisible(false)}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
