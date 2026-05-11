import { useQuery } from '@tanstack/react-query';
import { Trophy, Lock } from 'lucide-react';
import { achievementsApi, type AchievementItem, type AchievementRarity, type AchievementCategory } from '../../features/achievements/api';
import { useI18n } from '../../shared/i18n';
import styles from './AchievementsPage.module.css';

const RARITY_TINT: Record<AchievementRarity, string> = {
  bronze:    '#a16207',
  silver:    '#94a3b8',
  gold:      '#f59e0b',
  legendary: '#8b5cf6',
};

const CATEGORY_ORDER: readonly AchievementCategory[] = [
  'words', 'streak', 'grammar', 'listening', 'reading', 'conversation', 'general',
];

const CATEGORY_LABELS_RU: Record<AchievementCategory, string> = {
  words: 'Словарь',
  streak: 'Серии',
  grammar: 'Грамматика',
  listening: 'Аудирование',
  reading: 'Чтение',
  conversation: 'Беседы',
  general: 'Прочее',
};

const CATEGORY_LABELS_EN: Record<AchievementCategory, string> = {
  words: 'Vocabulary',
  streak: 'Streaks',
  grammar: 'Grammar',
  listening: 'Listening',
  reading: 'Reading',
  conversation: 'Conversation',
  general: 'General',
};

export function AchievementsPage() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.list,
  });

  if (isLoading || !data) {
    return <div className={styles.loading}>{t.common.loading}</div>;
  }

  const labels = lang === 'ru' ? CATEGORY_LABELS_RU : CATEGORY_LABELS_EN;
  const grouped = new Map<AchievementCategory, AchievementItem[]>();
  for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
  for (const item of data.items) {
    grouped.get(item.category)?.push(item);
  }

  const totalUnlocked = data.items.filter((i) => i.unlocked).length;
  const totalCount = data.items.length;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroIconWrap}>
            <Trophy size={32} className={styles.heroIcon} />
          </div>
          <div>
            <h1 className={styles.title}>{t.achievements.title}</h1>
            <p className={styles.subtitle}>
              {String(t.achievements.unlockedOf)
                .replace('{n}', String(totalUnlocked))
                .replace('{total}', String(totalCount))}
            </p>
          </div>
        </div>

        <div className={styles.xpSummary}>
          <div className={styles.xpLevelWrap}>
            <span className={styles.xpLevelLabel}>{t.achievements.level}</span>
            <span className={styles.xpLevelValue}>{data.xp.level}</span>
          </div>
          <div className={styles.xpProgressWrap}>
            <div className={styles.xpBar}>
              <div className={styles.xpBarFill} style={{ width: `${data.xp.pctToNext}%` }} />
            </div>
            <span className={styles.xpRange}>
              {data.xp.xpAtLevel} / {data.xp.xpForNextLevel} XP
            </span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className={styles.categories}>
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (items.length === 0) return null;
          const unlockedInCat = items.filter((i) => i.unlocked).length;
          return (
            <section key={cat} className={styles.category}>
              <div className={styles.categoryHeader}>
                <h2 className={styles.categoryTitle}>{labels[cat]}</h2>
                <span className={styles.categoryCount}>
                  {unlockedInCat} / {items.length}
                </span>
              </div>
              <div className={styles.grid}>
                {items.map((item) => (
                  <BadgeCard key={item.id} item={item} lang={lang} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BadgeCard({ item, lang }: { item: AchievementItem; lang: 'ru' | 'en' }) {
  const title = lang === 'ru' ? item.titleRu : item.titleEn;
  const desc = lang === 'ru' ? item.descRu : item.descEn;
  const tint = RARITY_TINT[item.rarity];

  return (
    <div
      className={`${styles.badge} ${item.unlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
      style={
        item.unlocked
          ? ({ '--tint': tint } as React.CSSProperties)
          : undefined
      }
    >
      <div className={styles.badgeIcon}>
        {item.unlocked ? (
          <span className={styles.badgeIconEmoji}>{item.icon}</span>
        ) : (
          <Lock size={22} className={styles.badgeLockIcon} />
        )}
      </div>
      <div className={styles.badgeBody}>
        <span className={styles.badgeTitle}>{title}</span>
        <span className={styles.badgeDesc}>{desc}</span>
        <div className={styles.badgeProgress}>
          <div className={styles.badgeProgressTrack}>
            <div
              className={styles.badgeProgressFill}
              style={{ width: `${item.pct}%`, background: item.unlocked ? tint : 'var(--color-text-tertiary, var(--color-text-secondary))' }}
            />
          </div>
          <span className={styles.badgeProgressText}>
            {item.current} / {item.threshold}
          </span>
        </div>
      </div>
    </div>
  );
}
