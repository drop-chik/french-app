import { useEffect, useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../shared/hooks/useTheme';
import { authApi } from '../../features/auth/api';
import { useI18n } from '../../shared/i18n';
import foxIcon from '../landing/fox-icon.webp';
import styles from './AuthForms.module.css';

/**
 * One-shot landing for the link in the registration email. POSTs the token
 * to /auth/verify-email and renders one of three states: pending (spinner),
 * success (welcome message + sign-in CTA), or invalid (re-request CTA).
 *
 * Repeated visits succeed: backend returns `alreadyVerified: true` and we
 * show the same success message.
 */
type State = 'pending' | 'success' | 'invalid';

export function VerifyEmailPage() {
  const { t } = useI18n();
  const { toggle, isDark } = useTheme();
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token ?? '';

  const [state, setState] = useState<State>(token ? 'pending' : 'invalid');

  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail(token)
      .then(() => {
        setState('success');
        // Profile and home queries cache emailVerifiedAt — invalidate so the
        // banner + Settings → Personal info refresh on the very next render
        // without forcing the user to hard-reload.
        void queryClient.invalidateQueries({ queryKey: ['profile'] });
        void queryClient.invalidateQueries({ queryKey: ['home'] });
        // Cross-tab nudge: users typically open the email link in a fresh tab
        // while the app is still loaded in another. localStorage fires a
        // `storage` event in *other* tabs (not this one) so listeners there
        // can invalidate their own cache. The timestamp value makes each
        // write unique so it always fires even if verified twice.
        try { localStorage.setItem('frenchup:email-verified', String(Date.now())); }
        catch { /* private mode */ }
      })
      .catch(() => setState('invalid'));
  }, [token, queryClient]);

  return (
    <div className={styles.page}>
      <button className={styles.themeBtn} onClick={toggle} aria-label={t.home.toggleTheme}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/login" className={styles.logoRow}>
            <img src={foxIcon} className={styles.logo} alt="FrenchUp" />
          </Link>
          <h1 className={styles.title}>{t.verifyEmail.title}</h1>
        </div>

        {state === 'pending' && (
          <div className={styles.success}>
            <Loader2 size={36} className={styles.successIcon} />
            <p className={styles.successBody}>{t.verifyEmail.pending}</p>
          </div>
        )}

        {state === 'success' && (
          <div className={styles.success}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h2 className={styles.successTitle}>{t.verifyEmail.successTitle}</h2>
            <p className={styles.successBody}>{t.verifyEmail.successBody}</p>
            <Link to="/login" className={styles.submitLink}>{t.verifyEmail.goToLogin}</Link>
          </div>
        )}

        {state === 'invalid' && (
          <div className={styles.errorBlock}>
            <AlertCircle size={28} className={styles.errorIcon} />
            <p className={styles.errorBody}>{t.verifyEmail.invalid}</p>
            <Link to="/login" className={styles.submitLink}>{t.verifyEmail.backToLogin}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
