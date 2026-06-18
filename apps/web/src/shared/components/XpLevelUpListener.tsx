import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './Toast';
import { useI18n } from '../i18n';
import { fireConfetti } from '../celebrate';

/**
 * Celebrates account XP level-ups (Уровень 3 → 4). XP levels come
 * frequently (level N at (N-1)²·50 XP — 50/200/450/800...), so unlike the
 * rare CEFR promotion this is a LIGHT celebration: a confetti burst + an
 * auto-dismissing toast, never a blocking modal.
 *
 * Listens for the global `xp-leveled-up` event dispatched by
 * wordsApi.recordAnswer. Mounted once in the auth layout above every page.
 */
export function XpLevelUpListener() {
  const toast = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  useEffect(() => {
    function handler(e: Event) {
      const level = (e as CustomEvent<{ level: number }>).detail?.level;
      if (!level) return;
      fireConfetti('#fbbf24'); // gold — XP / achievement colour
      toast.success(t.achievements.levelUpToast.replace('{level}', String(level)));
      // Refresh the sidebar XP badge.
      queryClient.invalidateQueries({ queryKey: ['xp-summary'] });
    }
    window.addEventListener('xp-leveled-up', handler as EventListener);
    return () => window.removeEventListener('xp-leveled-up', handler as EventListener);
  }, [toast, t, queryClient]);

  return null;
}
