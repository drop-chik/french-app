import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { placementApi, type PlacementQuestion } from '../../features/placement/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './PlacementPage.module.css';

type Phase = 'intro' | 'test' | 'result';

export function PlacementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { t } = useI18n();

  const [phase, setPhase] = useState<Phase>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
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
      if (user && accessToken) {
        setAuth(accessToken, { ...user, level: data.resultLevel, placementTestDone: true });
      }
      queryClient.invalidateQueries({ queryKey: ['words-session'] });
    },
  });

  function handleChoose(option: string) {
    if (chosen || !currentQ || isBlocked) return;
    setChosen(option);
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        submitMutation.mutate(newAnswers);
      } else {
        setIsBlocked(true);
        setCurrent((c) => c + 1);
        setChosen(null);
        setTimeout(() => setIsBlocked(false), 400);
      }
    }, 500);
  }

  function skipTest() {
    submitMutation.mutate({});
  }

  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;
  const levelDesc = (t.placement.levelDesc as Record<string, string>);

  if (phase === 'intro') {
    return (
      <div className={styles.page}>
        <motion.div
          className={styles.introCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.introIcon}>🎯</div>
          <h1 className={styles.introTitle}>{t.placement.title}</h1>
          <p className={styles.introText}>{t.placement.description}</p>
          <div className={styles.introFeatures}>
            <span>📝 {t.placement.questions}</span>
            <span>⏱ {t.placement.duration}</span>
            <span>🎓 {t.placement.levels}</span>
          </div>
          <button className={styles.startBtn} onClick={() => setPhase('test')}>
            {t.placement.startTest}
          </button>
          <button className={styles.skipBtn} onClick={skipTest}>
            {t.placement.skip}
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'result' && resultLevel) {
    const planItems: Array<{ icon: string; text: string }> = t.placement.planItems as never;
    return (
      <div className={styles.page}>
        <motion.div
          className={styles.resultCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.resultLevel}>{resultLevel}</div>
          <h2 className={styles.resultTitle}>{t.placement.yourLevel}</h2>
          <p className={styles.resultDesc}>{levelDesc[resultLevel] ?? ''}</p>

          <div className={styles.planSection}>
            <p className={styles.planIntro}>{t.placement.planIntro}</p>
            <ul className={styles.planList}>
              {planItems.map((item, i) => (
                <li key={i} className={styles.planItem}>
                  <span className={styles.planIcon}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            className={styles.continueBtn}
            onClick={() => navigate({ to: '/dashboard' })}
          >
            {t.placement.goToPlan}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>{t.placement.loading}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.testContainer}>
        <div className={styles.progressRow}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressText}>{current + 1}/{questions.length}</span>
        </div>

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
                    disabled={!!chosen || isBlocked}
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
