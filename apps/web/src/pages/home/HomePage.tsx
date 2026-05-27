import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { Moon, Sun, Check, X } from 'lucide-react';
import { useTheme } from '../../shared/hooks/useTheme';
import { useAuthStore } from '../../features/auth/authStore';
import { authApi } from '../../features/auth/api';
import { checkPassword } from '../../features/auth/passwordRules';
import { useI18n } from '../../shared/i18n';
import foxIcon from '../landing/fox-icon.webp';
import styles from './HomePage.module.css';

type Mode = 'login' | 'register';

export function HomePage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { toggle, isDark } = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await authApi.login({ email, password });
      } else {
        result = await authApi.register({ email, password, name });
      }
      setAuth(result.accessToken, result.user);
      const needsPlacement = !result.user.placementTestDone;
      await navigate({ to: needsPlacement ? '/placement' : '/dashboard' });
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
          <img src={foxIcon} className={styles.logo} alt="FrenchUp" />
          <h1 className={styles.title}>FrenchUp</h1>
          <p className={styles.subtitle}>{t.home.subtitle}</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => setMode('login')}
          >
            {t.home.tabLogin}
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => setMode('register')}
          >
            {t.home.tabRegister}
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">{t.profile.name}</label>
              <input
                id="name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.home.namePlaceholder}
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@mail.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">{t.home.passwordLabel}</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.home.passwordPlaceholder}
              required
              minLength={8}
              aria-describedby={mode === 'register' ? 'password-rules' : undefined}
            />
            {mode === 'register' && password.length > 0 && (() => {
              // Hide the checklist once all three constraints pass — at that
              // point we don't need to remind the user. Show it while typing
              // so they get instant feedback rather than a 400 after submit.
              const r = checkPassword(password);
              if (r.ok) return null;
              return (
                <ul id="password-rules" className={styles.passwordRules}>
                  <PwdRule ok={r.checks.length} text={t.home.passwordRuleLength} />
                  <PwdRule ok={r.checks.letter} text={t.home.passwordRuleLetter} />
                  <PwdRule ok={r.checks.digit}  text={t.home.passwordRuleDigit} />
                </ul>
              );
            })()}
          </div>

          {mode === 'register' && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span>
                {t.home.agreePrefix}{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className={styles.checkboxLink}>
                  {t.home.agreeTerms}
                </a>{' '}
                {t.home.agreeAnd}{' '}
                <a href="/privacy" target="_blank" rel="noreferrer" className={styles.checkboxLink}>
                  {t.home.agreePrivacy}
                </a>
              </span>
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={loading || (mode === 'register' && !agreed)}
          >
            {loading ? t.common.loading : mode === 'login' ? t.home.login : t.home.register}
          </button>

          {mode === 'login' && (
            <Link to="/forgot-password" className={styles.forgotLink}>
              {t.home.forgotPassword}
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}

function PwdRule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`${styles.passwordRule} ${ok ? styles.passwordRuleOk : styles.passwordRuleFail}`}>
      {ok ? <Check size={12} /> : <X size={12} />}
      <span>{text}</span>
    </li>
  );
}
