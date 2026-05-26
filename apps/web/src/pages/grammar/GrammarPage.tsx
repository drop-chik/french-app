import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Check, Lock, Play, ChevronRight, Sparkles } from 'lucide-react';
import { grammarApi, type GrammarTopic, type TopicStatus } from '../../features/grammar/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './GrammarPage.module.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type Level = typeof LEVELS[number];

// CEFR level colors — reused from listening page for visual consistency
const LEVEL_COLORS: Record<Level, { from: string; to: string; tint: string }> = {
  A1: { from: '#22c55e', to: '#15803d', tint: 'rgba(34, 197, 94, 0.1)' },
  A2: { from: '#3b82f6', to: '#1d4ed8', tint: 'rgba(59, 130, 246, 0.1)' },
  B1: { from: '#f97316', to: '#c2410c', tint: 'rgba(249, 115, 22, 0.1)' },
  B2: { from: '#a855f7', to: '#7c3aed', tint: 'rgba(168, 85, 247, 0.1)' },
};

// One emoji per grammar category — used in the category banner badge
function emojiForCategory(category: string): string {
  const c = category.toLowerCase();
  if (c === 'verbs' || c === 'verbs_basic') return '⚡';
  if (c === 'articles')   return '🧷';
  if (c === 'nouns')      return '📦';
  if (c === 'adjectives') return '🎨';
  if (c === 'pronouns' || c === 'pronoms') return '👤';
  if (c === 'prepositions') return '🔗';
  if (c === 'adverbs')    return '🌀';
  if (c === 'temps')      return '⏱️';
  if (c === 'syntaxe')    return '📐';
  if (c === 'vocabulary') return '💬';
  return '📚';
}

interface PathItem {
  kind: 'category' | 'topic';
  category?: string;
  topic?: GrammarTopic;
  index?: number; // ordinal within the level (1..N) — for the node badge
}

export function GrammarPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const userLevel = useAuthStore((s) => s.user?.level ?? 'A1');
  const [selectedLevel, setSelectedLevel] = useState<Level>((LEVELS as readonly string[]).includes(userLevel) ? userLevel as Level : 'A1');

  const { data, isLoading } = useQuery({
    queryKey: ['grammar-topics', selectedLevel, lang],
    queryFn: () => grammarApi.getTopics(selectedLevel),
  });

  const topics = data?.topics ?? [];

  // Flat sequence interleaved with category banners. Categories appear when
  // the previous topic's category differs from the current one — keeps the
  // single snaking path visually grouped without forking it.
  const pathItems = useMemo<PathItem[]>(() => {
    const items: PathItem[] = [];
    let lastCategory: string | null = null;
    topics.forEach((topic, i) => {
      if (topic.category !== lastCategory) {
        items.push({ kind: 'category', category: topic.category });
        lastCategory = topic.category;
      }
      items.push({ kind: 'topic', topic, index: i + 1 });
    });
    return items;
  }, [topics]);

  const completedCount = topics.filter((topic) => topic.status === 'completed').length;
  const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  const levelColor = LEVEL_COLORS[selectedLevel];

  // The first topic that's "available" or "in_progress" — gets the
  // "current" pulse + the floating "Now" label
  const currentIdx = topics.findIndex((tp) => tp.status === 'available' || tp.status === 'in_progress');

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <span
              className={styles.titleIcon}
              style={{ background: `linear-gradient(135deg, ${levelColor.from}, ${levelColor.to})` }}
            >
              <Sparkles size={22} />
            </span>
            {t.grammar.title}
          </h1>
          <p className={styles.subtitle}>{t.grammar.subtitle}</p>
        </div>

        {/* Level chips */}
        <div className={styles.levelChips} data-tour="grammar-levels">
          {LEVELS.map((lvl) => {
            const isActive = selectedLevel === lvl;
            const c = LEVEL_COLORS[lvl];
            return (
              <button
                key={lvl}
                className={`${styles.levelChip} ${isActive ? styles.levelChipActive : ''}`}
                onClick={() => setSelectedLevel(lvl)}
                style={isActive
                  ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, color: 'white', borderColor: 'transparent' }
                  : { borderColor: c.from, color: c.from }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress stat strip */}
      {!isLoading && topics.length > 0 && (
        <div className={styles.statsStrip} style={{ background: levelColor.tint }}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{completedCount} / {topics.length}</div>
            <div className={styles.statLabel}>
              {t.grammar.topicsCompleted.replace('{total}', String(topics.length)).replace(/^из /, '').replace(/^of /, '')}
            </div>
          </div>
          <div className={styles.statsRing}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke={levelColor.from} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(progressPct / 100) * 150.8} 150.8`}
                transform="rotate(-90 28 28)"
              />
            </svg>
            <span className={styles.statsRingValue} style={{ color: levelColor.from }}>{progressPct}%</span>
          </div>
        </div>
      )}

      {isLoading && <p className={styles.loading}>{t.grammar.loading}</p>}

      {/* ── ROADMAP PATH ── */}
      {!isLoading && topics.length > 0 && (
        <div className={styles.path} style={{ ['--level-from' as string]: levelColor.from, ['--level-to' as string]: levelColor.to }}>
          {/* Center vertical trail (decorative) */}
          <div className={styles.pathLine} aria-hidden />

          {pathItems.map((item, i) => {
            if (item.kind === 'category') {
              return (
                <div key={`cat-${i}`} className={styles.categoryBanner}>
                  <span className={styles.categoryEmoji}>{emojiForCategory(item.category ?? '')}</span>
                  <span className={styles.categoryLabel}>
                    {t.grammar.categories[item.category ?? ''] ?? item.category}
                  </span>
                </div>
              );
            }

            const topic = item.topic!;
            const idx = item.index!;
            const topicIdx = idx - 1;
            const side: 'left' | 'right' = topicIdx % 2 === 0 ? 'right' : 'left';
            const isLocked = topic.status === 'locked';
            const isCurrent = topicIdx === currentIdx;

            return (
              <div
                key={topic.id}
                className={`${styles.nodeRow} ${styles[`nodeSide_${side}`]}`}
              >
                {/* Node badge attached to the path */}
                <button
                  className={`${styles.node} ${styles[`nodeStatus_${topic.status}`]} ${isCurrent ? styles.nodeCurrent : ''}`}
                  onClick={() => !isLocked && navigate({ to: '/grammar/$slug', params: { slug: topic.slug } })}
                  disabled={isLocked}
                  aria-label={topic.title}
                >
                  <span className={styles.nodeNumber}>{idx}</span>
                  <span className={styles.nodeIcon}>
                    {topic.status === 'completed' && <Check size={16} />}
                    {topic.status === 'in_progress' && <Play size={14} />}
                    {topic.status === 'locked' && <Lock size={14} />}
                  </span>

                  {isCurrent && (
                    <span className={styles.currentBadge}>{t.grammar.currentLabel}</span>
                  )}
                </button>

                {/* Card body — title + meta */}
                <button
                  className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}
                  onClick={() => !isLocked && navigate({ to: '/grammar/$slug', params: { slug: topic.slug } })}
                  disabled={isLocked}
                >
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{topic.title}</h3>
                    <p className={styles.cardSub}>{topic.titleFr}</p>
                    {topic.status === 'completed' && topic.score > 0 && (
                      <span className={styles.cardScore}>★ {topic.score}%</span>
                    )}
                    {topic.status === 'in_progress' && (
                      <span className={styles.cardInProgress}>{t.grammar.status.in_progress}</span>
                    )}
                    {isLocked && (
                      <span className={styles.cardLockHint}>{t.grammar.lockedHint}</span>
                    )}
                  </div>
                  {!isLocked && <ChevronRight size={18} className={styles.cardArrow} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
