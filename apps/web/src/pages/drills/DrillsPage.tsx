import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Star, Trophy, Play } from 'lucide-react';
import { drillsApi, type DrillSet } from '../../features/drills/api';
import { useI18n } from '../../shared/i18n';
import styles from './DrillsPage.module.css';

const DIFFICULTY_STARS = (n: number) =>
  Array.from({ length: 3 }, (_, i) => (
    <Star key={i} size={12} className={i < n ? styles.starFilled : styles.starEmpty} />
  ));

function DrillCard({
  drill,
  onClick,
  notPlayedLabel,
}: {
  drill: DrillSet;
  onClick: () => void;
  notPlayedLabel: string;
}) {
  const hasPlayed = drill.totalSessions > 0;

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          <Play size={20} />
        </div>
        <div className={styles.cardMeta}>
          <span className={styles.cardLevel}>{drill.level}</span>
          <span className={styles.cardCategory}>{drill.category}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{drill.title}</h3>
        <p className={styles.cardDesc}>{drill.description}</p>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.difficulty}>
          {DIFFICULTY_STARS(drill.difficulty)}
        </div>
        {hasPlayed ? (
          <div className={styles.bestScore}>
            <Trophy size={12} />
            <span>{drill.bestScore}%</span>
          </div>
        ) : (
          <span className={styles.notPlayed}>{notPlayedLabel}</span>
        )}
      </div>
    </button>
  );
}

const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2'] as const;

export function DrillsPage() {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['drills', lang],
    queryFn: () => drillsApi.getDrills(lang),
  });

  const drills = data?.drills ?? [];
  const categories = ['all', ...Array.from(new Set(drills.map((d) => d.category)))];
  const filtered = drills.filter((d) => {
    const catOk = selectedCategory === 'all' || d.category === selectedCategory;
    const lvlOk = selectedLevel === 'all' || d.level === selectedLevel;
    return catOk && lvlOk;
  });

  const getCategoryLabel = (cat: string) =>
    (t.drills.categories as Record<string, string>)[cat] ?? cat;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.drills.title}</h1>
        <p className={styles.subtitle}>{t.drills.subtitle}</p>
      </div>

      <div className={styles.filterGroups}>
        <div className={styles.filterGroupRow}>
          <span className={styles.filterGroupLabel}>{t.drills.filterCategoryLabel}</span>
          <div className={styles.filters}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.filter} ${selectedCategory === cat ? styles.filterActive : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? t.drills.filterAll : getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroupRow}>
          <span className={styles.filterGroupLabel}>{t.drills.filterLevelLabel}</span>
          <div className={styles.filters}>
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                className={`${styles.filter} ${selectedLevel === lvl ? styles.filterActive : ''} ${lvl !== 'all' ? styles.filterLevel : ''}`}
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl === 'all' ? t.drills.filterAll : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className={styles.grid}>
          {filtered.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              notPlayedLabel={t.drills.notPlayed}
              onClick={() => navigate({ to: '/drills/$slug', params: { slug: drill.slug } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
