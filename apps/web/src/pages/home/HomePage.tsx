import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../shared/hooks/useTheme';
import { useAuthStore } from '../../features/auth/authStore';
import { authApi } from '../../features/auth/api';
import foxIcon from '../landing/fox-icon.png';
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
      // New users go to placement test; returning users who already did it go to vocabulary
      const needsPlacement = !result.user.placementTestDone;
      await navigate({ to: needsPlacement ? '/placement' : '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <button className={styles.themeBtn} onClick={toggle} aria-label="Сменить тему">
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <img src={foxIcon} className={styles.logo} alt="FrenchUp" />
          <h1 className={styles.title}>FrenchUp</h1>
          <p className={styles.subtitle}>Учи французский с умом</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => setMode('login')}
          >
            Войти
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">Имя</label>
              <input
                id="name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
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
            <label className={styles.label} htmlFor="password">Пароль</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              required
              minLength={8}
            />
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
                Я принимаю{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className={styles.checkboxLink}>
                  условия использования
                </a>{' '}
                и{' '}
                <a href="/privacy" target="_blank" rel="noreferrer" className={styles.checkboxLink}>
                  политику конфиденциальности
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
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}
