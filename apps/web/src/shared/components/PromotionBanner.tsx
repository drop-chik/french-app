import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../features/auth/authStore';
import { trackEvent } from '../../lib/analytics';
import { LEVEL_COLORS } from '../levels';
import { fireConfetti } from '../celebrate';
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

  const accent = LEVEL_COLORS[state.to] ?? 'var(--color-brand)';

  return (
    <PromotionCelebration
      from={state.from}
      to={state.to}
      accent={accent}
      title={t.profile.promotedToastTitle}
      body={t.profile.promotedToastBody.replace('{from}', state.from).replace('{to}', state.to)}
      onClose={() => setState(null)}
    />
  );
}

function PromotionCelebration({
  from, to, accent, title, body, onClose,
}: {
  from: Level; to: Level; accent: string; title: string; body: string; onClose: () => void;
}) {
  // Fire confetti once when the celebration mounts.
  useEffect(() => {
    fireConfetti(accent);
  }, [accent]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.card} u-pop-in`} style={{ ['--accent' as string]: accent }}>
        <div className={styles.levelJump}>
          <span className={styles.levelFrom}>{from}</span>
          <span className={styles.levelArrow}>→</span>
          <span className={styles.levelTo} style={{ color: accent }}>{to}</span>
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        <button type="button" className={styles.btn} style={{ background: accent }} onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
