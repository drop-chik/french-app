import { useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { Moon, Sun, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import { useTheme } from '../../shared/hooks/useTheme';
import { authApi } from '../../features/auth/api';
import { checkPassword } from '../../features/auth/passwordRules';
import { useI18n } from '../../shared/i18n';
import foxIcon from '../landing/fox-icon.webp';
import styles from './AuthForms.module.css';

/**
 * Lands here from the email link with `?token=...`. Confirms with a second
 * password field to catch typos. The API does the actual validation (token
 * known, unused, unexpired); we map its errors to friendly strings.
 *
 * If the token is missing entirely (user typed /reset-password manually
 * or clipboard mangling), we don't even show the form — better UX than
 * letting them fill in fields that will 400.
 */
export function ResetPasswordPage() {
  const { t } = useI18n();
  const { toggle, isDark } = useTheme();
  // Route registers a `token` search param; if absent, search is {} and we
  // fall through to the missing-token branch.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Client-side mirror of PASSWORD_RULE on the server. Catches the
    // common "8 lowercase letters" passwords before the round-trip.
    const r = checkPassword(password);
    if (!r.ok) {
      // Single string for the error banner; the live checklist below the
      // field already tells the user *which* constraints are failing.
      setError(t.resetPassword.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.resetPassword.mismatch);
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // API uses the english wording; map to the local i18n bucket.
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expired')) {
        setError(t.resetPassword.invalidToken);
      } else {
        setError(msg || t.home.errorDefault);
      }
    } finally {
      setLoading(false);
    }
  }

  // Missing token in the URL — show a dead-end with a path back. Don't
  // render the form, an empty token would always 400 anyway.
  if (!token) {
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
            <h1 className={styles.title}>{t.resetPassword.title}</h1>
          </div>
          <div className={styles.errorBlock}>
            <AlertCircle size={28} className={styles.errorIcon} />
            <p className={styles.errorBody}>{t.resetPassword.missingToken}</p>
            <Link to="/forgot-password" className={styles.submitLink}>
              {t.forgotPassword.title}
            </Link>
          </div>
        </div>
      </div>
    );
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
          <h1 className={styles.title}>{t.resetPassword.title}</h1>
          {!success && <p className={styles.subtitle}>{t.resetPassword.subtitle}</p>}
        </div>

        {success ? (
          <div className={styles.success}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h2 className={styles.successTitle}>{t.resetPassword.successTitle}</h2>
            <p className={styles.successBody}>{t.resetPassword.successBody}</p>
            <Link to="/login" className={styles.submitLink}>{t.resetPassword.goToLogin}</Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">{t.resetPassword.newPasswordLabel}</label>
              <input
                id="password"
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.resetPassword.newPasswordPlaceholder}
                required
                minLength={8}
                aria-describedby="reset-password-rules"
                autoFocus
              />
              {password.length > 0 && (() => {
                const r = checkPassword(password);
                if (r.ok) return null;
                return (
                  <ul id="reset-password-rules" className={styles.passwordRules}>
                    <li className={`${styles.passwordRule} ${r.checks.length ? styles.passwordRuleOk : styles.passwordRuleFail}`}>
                      {r.checks.length ? <Check size={12} /> : <X size={12} />}
                      <span>{t.home.passwordRuleLength}</span>
                    </li>
                    <li className={`${styles.passwordRule} ${r.checks.letter ? styles.passwordRuleOk : styles.passwordRuleFail}`}>
                      {r.checks.letter ? <Check size={12} /> : <X size={12} />}
                      <span>{t.home.passwordRuleLetter}</span>
                    </li>
                    <li className={`${styles.passwordRule} ${r.checks.digit ? styles.passwordRuleOk : styles.passwordRuleFail}`}>
                      {r.checks.digit ? <Check size={12} /> : <X size={12} />}
                      <span>{t.home.passwordRuleDigit}</span>
                    </li>
                  </ul>
                );
              })()}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm">{t.resetPassword.confirmPasswordLabel}</label>
              <input
                id="confirm"
                className={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t.resetPassword.newPasswordPlaceholder}
                required
                minLength={8}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading || !password || !confirm}
            >
              {loading ? t.resetPassword.submitting : t.resetPassword.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
