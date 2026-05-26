import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time and lifecycle errors in the child tree so a single
 * broken component doesn't unmount the whole app. Logs to console; in prod
 * we can hook this up to Sentry/etc. by editing componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the full stack visible in the console while we don't have a
    // structured reporter wired up yet.
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    // ErrorBoundary is a class component — read i18n snapshot directly via
    // Zustand's getState. It won't re-render on language toggle while the
    // error screen is up; acceptable trade-off since errors are rare.
    const t = useI18n.getState().t;

    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h1 className={styles.title}>{t.errors.boundaryTitle}</h1>
          <p className={styles.text}>{t.errors.boundaryBody}</p>
          <details className={styles.details}>
            <summary>{t.errors.boundaryDetails}</summary>
            <pre className={styles.stack}>{this.state.error.message}{'\n\n'}{this.state.error.stack}</pre>
          </details>
          <div className={styles.actions}>
            <button onClick={this.handleReset} className={styles.btnSecondary}>{t.errors.boundaryRetry}</button>
            <button onClick={this.handleReload} className={styles.btnPrimary}>{t.errors.boundaryReload}</button>
          </div>
        </div>
      </div>
    );
  }
}
