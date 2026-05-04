import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Headphones, Clock } from 'lucide-react';
import { listeningApi } from '../../features/listening/api';
import { useI18n } from '../../shared/i18n';
import styles from './ListeningPage.module.css';

const LEVELS = ['A1', 'A2', 'B1'] as const;

export function ListeningPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [selectedLevel, setSelectedLevel] = useState<'A1' | 'A2' | 'B1'>('A1');

  const { data, isLoading } = useQuery({
    queryKey: ['listening-exercises', selectedLevel, lang],
    queryFn: () => listeningApi.getExercises(selectedLevel),
  });

  const exercises = data?.exercises ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t.listening.title}</h1>
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
