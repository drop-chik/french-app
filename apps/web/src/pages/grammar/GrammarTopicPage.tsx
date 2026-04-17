import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Dumbbell, CheckCircle } from 'lucide-react';
import { grammarApi } from '../../features/grammar/api';
import { useI18n } from '../../shared/i18n';
import { ContentRenderer } from './components/ContentRenderer';
import { ExercisePlayer } from './components/ExercisePlayer';
import styles from './GrammarTopicPage.module.css';

type Tab = 'theory' | 'exercises' | 'result';

interface ResultState {
  score: number;
  total: number;
  percentage: number;
  isCompleted: boolean;
}

export function GrammarTopicPage({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();

  const [tab, setTab] = useState<Tab>('theory');
  const [result, setResult] = useState<ResultState | null>(null);

  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: ['grammar-topic', slug, lang],
    queryFn: () => grammarApi.getTopic(slug),
  });

  const { data: exercisesData, isLoading: exercisesLoading } = useQuery({
    queryKey: ['grammar-exercises', slug, lang],
    queryFn: () => grammarApi.getExercises(slug),
    enabled: tab === 'exercises',
  });

  const submitMutation = useMutation({
    mutationFn: ({ score, total }: { score: number; total: number }) =>
      grammarApi.submitResults(slug, score, total),
    onSuccess: (data, vars) => {
      setResult({
        score: vars.score,
        total: vars.total,
        percentage: data.percentage,
        isCompleted: data.isCompleted,
      });
      setTab('result');
      queryClient.invalidateQueries({ queryKey: ['grammar-topics'] });
      queryClient.invalidateQueries({ queryKey: ['grammar-topic', slug] });
    },
  });

  const topic = topicData?.topic;

  function handleExerciseComplete(score: number, total: number) {
    submitMutation.mutate({ score, total });
  }

  if (topicLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>{t.grammar.loading_topic}</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{t.grammar.notFound}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Back + header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate({ to: '/grammar' })}>
          <ArrowLeft size={16} />
          {t.grammar.back}
        </button>
        <div>
          <h1 className={styles.title}>{topic.title}</h1>
          <p className={styles.titleFr}>{topic.titleFr}</p>
        </div>
      </div>

      {/* Tabs */}
      {tab !== 'result' && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'theory' ? styles.tabActive : ''}`}
            onClick={() => setTab('theory')}
          >
            <BookOpen size={14} />
            {t.grammar.tabTheory}
          </button>
          <button
            className={`${styles.tab} ${tab === 'exercises' ? styles.tabActive : ''}`}
            onClick={() => setTab('exercises')}
          >
            <Dumbbell size={14} />
            {t.grammar.tabExercises}
          </button>
        </div>
      )}

      {/* Content */}
      {tab === 'theory' && (
        <div className={styles.content}>
          <ContentRenderer blocks={topic.content as never} />
          <div className={styles.theoryActions}>
            <button className={styles.startExercisesBtn} onClick={() => setTab('exercises')}>
              {t.grammar.startExercises}
            </button>
          </div>
        </div>
      )}

      {tab === 'exercises' && (
        <div className={styles.content}>
          {exercisesLoading && <p className={styles.loading}>{t.grammar.loadingExercises}</p>}
          {!exercisesLoading && exercisesData?.exercises && (
            <ExercisePlayer
              exercises={exercisesData.exercises}
              topicSlug={slug}
              onComplete={handleExerciseComplete}
            />
          )}
          {!exercisesLoading && !exercisesData?.exercises?.length && (
            <p className={styles.empty}>{t.grammar.noExercises}</p>
          )}
        </div>
      )}

      {tab === 'result' && result && (
        <div className={styles.resultScreen}>
          <div className={styles.resultIcon}>
            <CheckCircle size={48} className={result.isCompleted ? styles.resultIconSuccess : styles.resultIconWarn} />
          </div>
          <h2 className={styles.resultTitle}>
            {result.isCompleted ? t.grammar.resultCompleted : t.grammar.resultDone}
          </h2>
          <p className={styles.resultScore}>
            {t.grammar.resultScore
              .replace('{score}', String(result.score))
              .replace('{total}', String(result.total))
              .replace('{pct}', String(result.percentage))}
          </p>
          {!result.isCompleted && (
            <p className={styles.resultHint}>{t.grammar.resultHint}</p>
          )}
          <div className={styles.resultActions}>
            <button
              className={styles.retryBtn}
              onClick={() => {
                setResult(null);
                setTab('exercises');
              }}
            >
              {t.grammar.retry}
            </button>
            <button
              className={styles.backToListBtn}
              onClick={() => navigate({ to: '/grammar' })}
            >
              {t.grammar.backToList}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
