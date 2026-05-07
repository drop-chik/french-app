import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle, Lock, Circle, BookOpen } from 'lucide-react';
import { grammarApi, type GrammarTopic, type TopicStatus } from '../../features/grammar/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './GrammarPage.module.css';

const STATUS_ICON: Record<TopicStatus, React.ReactNode> = {
  locked: <Lock size={14} />,
  available: <Circle size={14} />,
  in_progress: <Circle size={14} />,
  completed: <CheckCircle size={14} />,
};

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

export function GrammarPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const userLevel = useAuthStore((s) => s.user?.level ?? 'A1');
  const [selectedLevel, setSelectedLevel] = useState<string>(userLevel);

  const { data, isLoading } = useQuery({
    queryKey: ['grammar-topics', selectedLevel, lang],
    queryFn: () => grammarApi.getTopics(selectedLevel),
  });

  const topics = data?.topics ?? [];

  // Group by category
  const grouped = topics.reduce<Record<string, GrammarTopic[]>>((acc, topic) => {
    (acc[topic.category] ??= []).push(topic);
    return acc;
  }, {});

  const completedCount = topics.filter((topic) => topic.status === 'completed').length;
  const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t.grammar.title}</h1>
          <div className={styles.levelTabs}>
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                className={`${styles.levelTab} ${selectedLevel === lvl ? styles.levelTabActive : ''}`}
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        {!isLoading && topics.length > 0 && (
          <div className={styles.progressBlock}>
            <div className={styles.progressMeta}>
              <span className={styles.progressText}>
                {completedCount} {t.grammar.topicsCompleted.replace('{total}', String(topics.length))}
              </span>
              <span className={styles.progressPct}>{progressPct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {isLoading && <p className={styles.loading}>{t.grammar.loading}</p>}

      {!isLoading && (
        <div className={styles.categories}>
          {Object.entries(grouped).map(([category, categoryTopics]) => (
            <div key={category} className={styles.category}>
              <div className={styles.categoryHeader}>
                <BookOpen size={16} className={styles.categoryIcon} />
                <span className={styles.categoryLabel}>
                  {t.grammar.categories[category] ?? category}
                </span>
              </div>
              <div className={styles.topicList}>
                {categoryTopics.map((topic) => {
                  const isLocked = topic.status === 'locked';
                  return (
                    <button
                      key={topic.id}
                      className={`${styles.topicCard} ${isLocked ? styles.topicLocked : ''} ${topic.status === 'completed' ? styles.topicCompleted : ''}`}
                      onClick={() => !isLocked && navigate({ to: '/grammar/$slug', params: { slug: topic.slug } })}
                      disabled={isLocked}
                    >
                      <div className={styles.topicMain}>
                        <div className={`${styles.topicStatus} ${styles[`status_${topic.status}`]}`}>
                          {STATUS_ICON[topic.status]}
                        </div>
                        <div className={styles.topicInfo}>
                          <span className={styles.topicTitle}>{topic.title}</span>
                          <span className={styles.topicFr}>{topic.titleFr}</span>
                        </div>
                      </div>
                      {topic.status !== 'locked' && topic.status !== 'available' && (
                        <div className={styles.topicMeta}>
                          {topic.score > 0 && (
                            <span className={styles.topicScore}>{topic.score}%</span>
                          )}
                          <span className={`${styles.topicStatusLabel} ${styles[`label_${topic.status}`]}`}>
                            {t.grammar.status[topic.status as TopicStatus]}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
