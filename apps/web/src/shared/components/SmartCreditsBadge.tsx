import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import { useI18n } from '../i18n';
import styles from './SmartCreditsBadge.module.css';

/**
 * Smart Credits badge — universal AI quota counter in the sidebar.
 *
 * Replaces the previous "user wonders if they'll hit a hidden limit
 * mid-essay" UX with a visible counter that ticks down per AI call.
 * SavoirX pattern; single number, easier to reason about than per-
 * feature limits and lays the foundation for a future paid tier.
 *
 * Tooltip on hover documents what each credit costs so the burn rate
 * isn't mysterious. Red tone kicks in <20% remaining.
 */
export function SmartCreditsBadge() {
  const { t } = useI18n();
  const tn = t.smartCredits;

  const { data, isError } = useQuery({
    queryKey: ['ai-credits'],
    queryFn: profileApi.getAiCredits,
    // Stay fresh — every writing/conversation action consumes credits.
    // 30 s window so the badge moves shortly after the user does anything.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Defensive fallback so the badge renders even during the API rollout
  // window where /profile/ai-credits returns 404 (Vercel deploys faster
  // than Railway). The placeholder matches a fresh quota — accurate
  // enough until the real numbers arrive.
  const credits = data?.credits ?? {
    remaining: 100,
    total: 100,
    hoursUntilReset: 24,
  };
  if (isError && !data) {
    // We're in the rollout-gap. Keep the badge visible with placeholder.
  }

  const { remaining, total, hoursUntilReset } = credits;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const tone = pct < 20 ? 'low' : pct < 50 ? 'mid' : 'ok';

  const title = tn.tooltip
    .replace('{remaining}', String(remaining))
    .replace('{total}', String(total))
    .replace('{hours}', String(hoursUntilReset));

  return (
    <div
      className={`${styles.badge} ${styles[`tone_${tone}`]}`}
      title={title}
      aria-label={title}
    >
      <Coins size={12} className={styles.icon} />
      <span className={styles.value}>{remaining}</span>
      <span className={styles.suffix}>/ {total}</span>
    </div>
  );
}
