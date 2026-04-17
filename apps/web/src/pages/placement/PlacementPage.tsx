import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { placementApi, type PlacementQuestion } from '../../features/placement/api';
import { useAuthStore } from '../../features/auth/authStore';
import styles from './PlacementPage.module.css';

const LEVEL_DESC: Record<string, string> = {
  A1: 'Начальный уровень. Мы начнём с самых основ.',
  A2: 'Базовый уровень. Ты знаешь основы, двигаемся дальше.',
  B1: 'Средний уровень. Хороший фундамент — идём углубляться.',
  B2: 'Выше среднего. Ты владеешь языком уверенно.',
};

type Phase = 'intro' | 'test' | 'result';

export function PlacementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [phase, setPhase] = useState<Phase>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [resultLevel, setResultLevel] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['placement-questions'],
    queryFn: () => placementApi.getQuestions(),
    enabled: phase !== 'intro',
  });

  const questions = data?.questions ?? [];
  const currentQ: PlacementQuestion | undefined = questions[current];

  const submitMutation = useMutation({
    mutationFn: (ans: Record<string, string>) => placementApi.submit(ans),
    onSuccess: (data) => {
      setResultLevel(data.resultLevel);
      setPhase('result');
      // Update user in store
      if (user && accessToken) {
        setAuth(accessToken, { ...user, level: data.resultLevel, placementTestDone: true });
      }
      queryClient.invalidateQueries({ queryKey: ['words-session'] });
    },
  });

  function handleChoose(option: string) {
    if (chosen || !currentQ) return;
    setChosen(option);
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        submitMutation.mutate(newAnswers);
      } else {
        setCurrent((c) => c + 1);
        setChosen(null);
      }
    }, 500);
  }

  function skipTest() {
    submitMutation.mutate({});
  }

  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className={styles.page}>
        <motion.div
          className={styles.introCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.introIcon}>🎯</div>
          <h1 className={styles.introTitle}>Определим твой уровень</h1>
          <p className={styles.introText}>
            Ответь на несколько вопросов, чтобы мы подобрали подходящий
            контент. Это займёт около 5 минут.
          </p>
          <div className={styles.introFeatures}>
            <span>📝 {'{30}'} вопросов</span>
            <span>⏱ ~5 минут</span>
            <span>🎓 Уровни A1–B2</span>
          </div>
          <button
            className={styles.startBtn}
            onClick={() => setPhase('test')}
          >
            Начать тест
          </button>
          <button className={styles.skipBtn} onClick={skipTest}>
            Пропустить (начать с A1)
          </button>
        </motion.div>
      </div>
    );
  }

  // Result screen
  if (phase === 'result' && resultLevel) {
    return (
      <div className={styles.page}>
        <motion.div
          className={styles.resultCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.resultLevel}>{resultLevel}</div>
          <h2 className={styles.resultTitle}>Твой уровень</h2>
          <p className={styles.resultDesc}>{LEVEL_DESC[resultLevel]}</p>
          <button
            className={styles.continueBtn}
            onClick={() => navigate({ to: '/vocabulary' })}
          >
            Начать обучение →
          </button>
        </motion.div>
      </div>
    );
  }

  // Test screen
  if (!currentQ) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Загрузка вопросов...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.testContainer}>
        {/* Progress */}
        <div className={styles.progressRow}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressText}>{current + 1}/{questions.length}</span>
        </div>

        {/* Level badge */}
        <span className={`${styles.levelBadge} ${styles[`badge_${currentQ.level}`]}`}>
          {currentQ.level}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <p className={styles.question}>{currentQ.question}</p>

            <div className={styles.options}>
              {currentQ.options.map((opt) => {
                const isChosen = chosen === opt;
                return (
                  <button
                    key={opt}
                    className={`${styles.option} ${isChosen ? styles.optionChosen : ''}`}
                    onClick={() => handleChoose(opt)}
                    disabled={!!chosen}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
