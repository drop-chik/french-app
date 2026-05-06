import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { placementApi, type PlacementQuestion } from '../../features/placement/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './PlacementPage.module.css';

type Phase = 'intro' | 'test' | 'result' | 'onboarding';

const LEVEL_CONTENT: Record<string, { words: number; grammar: number; listening: number }> = {
  A1: { words: 798,  grammar: 25, listening: 13 },
  A2: { words: 928,  grammar: 16, listening: 10 },
  B1: { words: 1196, grammar: 18, listening: 12 },
  B2: { words: 593,  grammar: 0,  listening: 0  },
};

function Confetti() {
  return (
    <div className={styles.confettiWrap} aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} className={styles.confetti} style={{ '--ci': i } as React.CSSProperties} />
      ))}
    </div>
  );
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const statItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

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

  /* ── Intro ─────────────────────────────────────────────────────── */
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

  /* ── Result (screen 1) ─────────────────────────────────────────── */
  if (phase === 'result' && resultLevel) {
    const planItems = t.placement.planItems as never as Array<{ icon: string; text: string }>;
    return (
      <div className={styles.page}>
        <Confetti />
        <motion.div
          className={styles.resultCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={styles.resultLevel}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
          >
            {resultLevel}
          </motion.div>

          <motion.h2
            className={styles.resultTitle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.25 }}
          >
            {t.placement.yourLevel}
          </motion.h2>

          <motion.p
            className={styles.resultDesc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, delay: 0.35 }}
          >
            {levelDesc[resultLevel] ?? ''}
          </motion.p>

          <motion.div
            className={styles.planSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.42 }}
          >
            <p className={styles.planIntro}>{t.placement.planIntro}</p>
            <ul className={styles.planList}>
              {planItems.map((item, i) => (
                <li key={i} className={styles.planItem}>
                  <span className={styles.planIcon}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.button
            className={styles.continueBtn}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.55 }}
            onClick={() => setPhase('onboarding')}
          >
            {t.placement.goToPlan}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ── Onboarding (screen 2) ─────────────────────────────────────── */
  if (phase === 'onboarding' && resultLevel) {
    const content = LEVEL_CONTENT[resultLevel] ?? { words: 0, grammar: 0, listening: 0 };

    const statRows = [
      { icon: '📚', value: content.words,     label: t.placement.wordsLabel },
      ...(content.grammar   > 0 ? [{ icon: '📖', value: content.grammar,   label: t.placement.grammarLabel }]   : []),
      ...(content.listening > 0 ? [{ icon: '🎧', value: content.listening, label: t.placement.listeningLabel }] : []),
      { icon: '🤖', value: '∞', label: t.placement.aiLabel },
    ] as Array<{ icon: string; value: number | string; label: string }>;

    return (
      <div className={styles.page}>
        <motion.div
          className={styles.onboardingCard}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
        >
          <div className={styles.onboardingHeader}>
            <div className={styles.onboardingLevelPill}>{resultLevel}</div>
            <h2 className={styles.onboardingTitle}>{t.placement.yourPlan}</h2>
            <p className={styles.onboardingSubtitle}>
              {(t.placement.planForLevel as string).replace('{level}', resultLevel)}
            </p>
          </div>

          <motion.div className={styles.statsGrid} variants={stagger} initial="hidden" animate="show">
            {statRows.map((s, i) => (
              <motion.div key={i} className={styles.statItem} variants={statItem}>
                <span className={styles.statItemIcon}>{s.icon}</span>
                <span className={styles.statItemValue}>{String(s.value)}</span>
                <span className={styles.statItemLabel}>{s.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className={styles.firstStepBox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <p className={styles.firstStepTitle}>{t.placement.firstStep}</p>
            <p className={styles.firstStepDesc}>{t.placement.firstStepDesc}</p>
          </motion.div>

          <motion.div
            className={styles.onboardingActions}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <button
              className={styles.continueBtn}
              onClick={() => navigate({ to: '/vocabulary' })}
            >
              {t.placement.startLearning}
            </button>
            <button
              className={styles.skipBtn}
              onClick={() => navigate({ to: '/dashboard' })}
            >
              {t.placement.toDashboard}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Loading ───────────────────────────────────────────────────── */
  if (!currentQ) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>{t.placement.loading}</p>
      </div>
    );
  }

  /* ── Test ──────────────────────────────────────────────────────── */
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
