import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../features/auth/authStore';
import { trackEvent } from '../../lib/analytics';
import { useI18n } from '../i18n';
import styles from './PromotionBanner.module.css';

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export function PromotionBanner() {
  const [state, setState] = useState<{ from: Level; to: Level } | null>(null);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const { t } = useI18n();

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ to: Level }>).detail;
      const from = useAuthStore.getState().user?.level as Level | undefined;
      if (!detail?.to || !from) return;
      setState({ from, to: detail.to });
      // Update store + invalidate profile query so the rest of the UI catches up
      updateUser({ level: detail.to });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['levels-progress'] });
      trackEvent('level_promoted', { from, to: detail.to });
    }
    window.addEventListener('cefr-promoted', handler as EventListener);
    return () => window.removeEventListener('cefr-promoted', handler as EventListener);
  }, [updateUser, queryClient]);

  if (!state) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.emoji}>🎉</div>
        <h2 className={styles.title}>{t.profile.promotedToastTitle}</h2>
        <p className={styles.body}>
          {t.profile.promotedToastBody.replace('{from}', state.from).replace('{to}', state.to)}
        </p>
        <button type="button" className={styles.btn} onClick={() => setState(null)}>OK</button>
      </div>
    </div>
  );
}
