import type { AchievementItem, AchievementRarity } from './api';
import styles from './AchievementBadge.module.css';

const RARITY_TINT: Record<AchievementRarity, string> = {
  bronze:    '#a16207',
  silver:    '#94a3b8',
  gold:      '#f59e0b',
  legendary: '#8b5cf6',
};

/**
 * Compact badge — used in the dashboard / profile widgets. Just the icon +
 * title + rarity-tinted border. For the full progress-aware card see
 * AchievementsPage.
 */
export function AchievementBadge({
  item,
  lang,
  size = 'md',
}: {
  item: AchievementItem;
  lang: 'ru' | 'en';
  size?: 'sm' | 'md';
}) {
  const title = lang === 'ru' ? item.titleRu : item.titleEn;
  const tint = RARITY_TINT[item.rarity];
  return (
    <div
      className={`${styles.badge} ${styles[`size_${size}`]}`}
      style={{ '--tint': tint } as React.CSSProperties}
      title={lang === 'ru' ? item.descRu : item.descEn}
    >
      <div className={styles.icon}>{item.icon}</div>
      <span className={styles.title}>{title}</span>
    </div>
  );
}
