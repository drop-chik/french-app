import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, X } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import { authApi } from '../../features/auth/api';
import { useI18n } from '../i18n';
import { useToast } from './Toast';
import styles from './EmailVerifyBanner.module.css';

const DISMISS_KEY = 'frenchup:verify-banner-dismissed';

/**
 * Subtle yellow strip above the page when the user's email is not yet
 * verified. Two actions: "Resend link" → POST /auth/resend-verification,
 * and "✕" → dismiss (session-scoped, the banner returns next visit
 * because we don't want users to forget about it for weeks).
 *
 * Dismissal lives in sessionStorage so we never persist past a tab close —
 * the next session reminds them. If email IS verified, the banner stays
 * hidden permanently regardless of dismiss state.
 */
export function EmailVerifyBanner() {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Read profile to know verification status. Stale 5min via global default,
  // banner appears within a session.
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; }
    catch { return false; }
  });
  const [resending, setResending] = useState(false);

  // Listen for cross-tab verification — VerifyEmailPage writes a timestamp
  // to localStorage on success, which fires `storage` in every *other* tab.
  // Without this, a user verifies in tab A and tab B keeps showing the
  // 5-minute-stale "not verified" banner. Same-tab is covered by direct
  // invalidation inside VerifyEmailPage itself.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'frenchup:email-verified') {
        void queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  // Hide while profile loads (banner flashing in is worse than waiting),
  // when email is already verified, or when user dismissed this session.
  if (!profile || profile.emailVerifiedAt || dismissed) return null;

  async function handleResend() {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success(t.verifyBanner.resendSent);
    } catch {
      toast.error(t.errors.saveFailed);
    } finally {
      setResending(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
  }

  return (
    <div className={styles.banner} role="status">
      <Mail size={16} className={styles.icon} />
      <div className={styles.text}>
        <strong>{t.verifyBanner.title}</strong>
        <span>{t.verifyBanner.body}</span>
      </div>
      <button
        type="button"
        className={styles.resendBtn}
        onClick={handleResend}
        disabled={resending}
      >
        {resending ? t.verifyBanner.sending : t.verifyBanner.resend}
      </button>
      <button
        type="button"
        className={styles.dismissBtn}
        onClick={handleDismiss}
        aria-label={t.verifyBanner.dismiss}
      >
        <X size={14} />
      </button>
    </div>
  );
}
