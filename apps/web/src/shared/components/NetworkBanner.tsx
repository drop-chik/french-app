import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { useToast } from './Toast';
import styles from './NetworkBanner.module.css';

/**
 * Top-of-page red banner shown while `navigator.onLine === false`. Also fires
 * an info toast when the connection comes back, so the user sees a clear
 * "you're back online" cue instead of just watching the banner disappear.
 *
 * `navigator.onLine` is best-effort — some browsers (Chrome especially)
 * report `true` even on captive-portal networks where actual HTTP fails.
 * We pair this with apiClient's timeout: if the API request times out,
 * the toast from the caller still appears regardless of onLine.
 */
export function NetworkBanner() {
  const { t } = useI18n();
  const toast = useToast();
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    function handleOffline() { setOnline(false); }
    function handleOnline() {
      setOnline(true);
      toast.success(t.errors.networkOnline, { duration: 3000 });
    }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast, t]);

  if (online) return null;

  return (
    <div className={styles.banner} role="alert">
      <WifiOff size={16} />
      <span>{t.errors.networkOffline}</span>
    </div>
  );
}
