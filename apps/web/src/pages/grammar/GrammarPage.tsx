import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle, Lock, Circle, BookOpen } from 'lucide-react';
import { grammarApi, type GrammarTopic, type TopicStatus } from '../../features/grammar/api';
import { useI18n } from '../../shared/i18n';
import styles from './GrammarPage.module.css';

const STATUS_ICON: Record<TopicStatus, React.ReactNode> = {
  locked: <Lock size={14} />,
  available: <Circle size={14} />,
  in_progress: <Circle size={14} />,
  completed: <CheckCircle size={14} />,
};

export function GrammarPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['grammar-topics', 'A1', lang],
    queryFn: () => grammarApi.getTopics('A1'),
  });

  const topics = data?.topics ?? [];

  // Group by category
  const grouped = topics.reduce<Record<string, GrammarTopic[]>>((acc, topic) => {
    (acc[topic.category] ??= []).push(topic);
    return acc;
  }, {});

  const completedCount = topics.filter((topic) => topic.status === 'completed').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.grammar.title}</h1>
        <p className={styles.subtitle}>
          {isLoading
            ? t.common.loading
            : `${completedCount} ${t.grammar.topicsCompleted.replace('{total}', String(topics.length))}`}
        </p>
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
