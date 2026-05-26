import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Moon, Sun, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../shared/hooks/useTheme';
import { authApi } from '../../features/auth/api';
import { useI18n } from '../../shared/i18n';
import foxIcon from '../landing/fox-icon.png';
import styles from './AuthForms.module.css';

/**
 * Forgot-password entry point. User types their email, we POST it to the
 * API, and regardless of whether it matches a user the API returns 200 (to
 * avoid email enumeration). So the UI also shows the same success state
 * either way — a clear hint that "if this email is registered, a link was
 * sent" — which is both safe and honest.
 */
export function ForgotPasswordPage() {
  const { t, lang } = useI18n();
  const { toggle, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email, lang);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.home.errorDefault);
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className={styles.title}>{t.forgotPassword.title}</h1>
          {!submitted && <p className={styles.subtitle}>{t.forgotPassword.subtitle}</p>}
        </div>

        {submitted ? (
          <div className={styles.success}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h2 className={styles.successTitle}>{t.forgotPassword.successTitle}</h2>
            <p className={styles.successBody}>{t.forgotPassword.successBody}</p>
            <p className={styles.successHint}>{t.forgotPassword.successHint}</p>
            <Link to="/login" className={styles.backLink}>{t.forgotPassword.backToLogin}</Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">{t.forgotPassword.emailLabel}</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.forgotPassword.emailPlaceholder}
                required
                autoFocus
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading || !email}
            >
              {loading ? t.forgotPassword.submitting : t.forgotPassword.submit}
            </button>

            <Link to="/login" className={styles.backLink}>{t.forgotPassword.backToLogin}</Link>
          </form>
        )}
      </div>
    </div>
  );
}
