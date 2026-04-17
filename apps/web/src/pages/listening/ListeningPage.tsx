import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle, Circle, Headphones, Clock } from 'lucide-react';
import { listeningApi } from '../../features/listening/api';
import { useI18n } from '../../shared/i18n';
import styles from './ListeningPage.module.css';

export function ListeningPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['listening-exercises', 'A1', lang],
    queryFn: () => listeningApi.getExercises('A1'),
  });

  const exercises = data?.exercises ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.listening.title}</h1>
        <p className={styles.subtitle}>{t.listening.subtitle}</p>
      </div>

      {isLoading && <p className={styles.loading}>{t.listening.loading}</p>}

      {!isLoading && (
        <div className={styles.list}>
          {exercises.map((ex) => (
            <button
              key={ex.id}
              className={styles.card}
              onClick={() => navigate({ to: '/listening/$id', params: { id: ex.id } })}
            >
              <div className={styles.cardIcon}>
                <Headphones size={18} />
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardTitle}>{ex.title}</span>
                <span className={styles.cardMeta}>
                  <Clock size={12} />
                  {ex.durationSec}s · {t.listening.questionsCount.replace('{n}', String(ex.questions.length))}
                </span>
              </div>
              <div className={styles.cardBadge}>{ex.level}</div>
            </button>
          ))}

          {exercises.length === 0 && !isLoading && (
            <p className={styles.empty}>{t.listening.empty}</p>
          )}
        </div>
      )}
    </div>
  );
}
