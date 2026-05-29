import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { placementApi, type PlacementQuestion } from '../../features/placement/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './PlacementPage.module.css';

type Phase = 'intro' | 'self-select' | 'test' | 'result' | 'onboarding';
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_INDEX: Record<Level, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };
const MAX_QUESTIONS = 10;
const STREAK_TO_CHANGE = 2;

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
  const [selfReportedLevel, setSelfReportedLevel] = useState<Level>('A1');

  // Test state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level>('A1');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [currentQ, setCurrentQ] = useState<PlacementQuestion | null>(null);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [resultLevel, setResultLevel] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['placement-questions'],
    queryFn: () => placementApi.getQuestions(),
    staleTime: Infinity,
  });

  const questions = data?.questions ?? [];

  const submitMutation = useMutation({
    mutationFn: (payload: { answers: Record<string, string>; selfReportedLevel: Level }) =>
      placementApi.submit(payload.answers, payload.selfReportedLevel),
    onSuccess: (res) => {
      setResultLevel(res.resultLevel);
      setPhase('result');
      if (user && accessToken) {
        setAuth(accessToken, { ...user, level: res.resultLevel, placementTestDone: true });
      }
      queryClient.invalidateQueries({ queryKey: ['words-session'] });
    },
  });

  function pickQuestion(level: Level, asked: string[]): PlacementQuestion | null {
    const pool = questions.filter(q => q.level === level && !asked.includes(q.id));
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)] ?? null;
    const any = questions.filter(q => !asked.includes(q.id));
    return any[Math.floor(Math.random() * any.length)] ?? null;
  }

  function startTest(level: Level) {
    setSelfReportedLevel(level);
    setCurrentLevel(level);
    setAnswers({});
    setAskedIds([]);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setQuestionsAsked(0);
    setIsShowingFeedback(false);
    setChosenOption(null);
    const firstQ = pickQuestion(level, []);
    setCurrentQ(firstQ);
    setPhase('test');
  }

  function handleChoose(option: string) {
    if (isShowingFeedback || !currentQ) return;

    const isCorrect = option === currentQ.correct;
    setChosenOption(option);
    setIsShowingFeedback(true);

    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);
    const newAsked = [...askedIds, currentQ.id];
    setAskedIds(newAsked);
    const newCount = questionsAsked + 1;
    setQuestionsAsked(newCount);

    let cc = consecutiveCorrect;
    let cw = consecutiveWrong;
    let newLevel = currentLevel;

    if (isCorrect) {
      cc++;
      cw = 0;
      if (cc >= STREAK_TO_CHANGE) {
        const idx = LEVEL_INDEX[currentLevel];
        newLevel = LEVELS[Math.min(idx + 1, LEVELS.length - 1)] ?? currentLevel;
        cc = 0;
      }
    } else {
      cw++;
      cc = 0;
      if (cw >= STREAK_TO_CHANGE) {
        const idx = LEVEL_INDEX[currentLevel];
        newLevel = LEVELS[Math.max(idx - 1, 0)] ?? currentLevel;
        cw = 0;
      }
    }

    setConsecutiveCorrect(cc);
    setConsecutiveWrong(cw);

    setTimeout(() => {
      if (newCount >= MAX_QUESTIONS) {
        submitMutation.mutate({ answers: newAnswers, selfReportedLevel });
        return;
      }
      setCurrentLevel(newLevel);
      const nextQ = pickQuestion(newLevel, newAsked);
      if (!nextQ) {
        submitMutation.mutate({ answers: newAnswers, selfReportedLevel });
        return;
      }
      setCurrentQ(nextQ);
      setIsShowingFeedback(false);
      setChosenOption(null);
    }, 700);
  }

  function skipTest() {
    submitMutation.mutate({ answers: {}, selfReportedLevel: 'A1' });
  }

  const levelDesc = t.placement.levelDesc as Record<string, string>;
  const selfSelectLevels = t.placement.selfSelectLevels as Record<string, { title: string; desc: string }>;

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
          <button className={styles.startBtn} onClick={() => setPhase('self-select')}>
            {t.placement.startTest}
          </button>
          <button className={styles.skipBtn} onClick={skipTest}>
            {t.placement.skip}
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Self-select ────────────────────────────────────────────────── */
  if (phase === 'self-select') {
    return (
      <div className={styles.page}>
        <motion.div
          className={styles.selfSelectCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className={styles.selfSelectTitle}>{t.placement.selfSelectTitle}</h2>
          <p className={styles.selfSelectSubtitle}>{t.placement.selfSelectSubtitle}</p>

          <div className={styles.selfSelectGrid}>
            {LEVELS.map((level) => {
              const info = selfSelectLevels[level];
              return (
                <button
                  key={level}
                  className={styles.levelCard}
                  onClick={() => startTest(level)}
                >
                  <span className={`${styles.levelCardBadge} ${styles[`badge_${level}`]}`}>{level}</span>
                  <span className={styles.levelCardTitle}>{info?.title ?? level}</span>
                  <span className={styles.levelCardDesc}>{info?.desc ?? ''}</span>
                </button>
              );
            })}
          </div>

          <button className={styles.skipBtn} onClick={skipTest}>
            {t.placement.skip}
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Result ─────────────────────────────────────────────────────── */
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

  /* ── Onboarding ─────────────────────────────────────────────────── */
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
            <button className={styles.continueBtn} onClick={() => navigate({ to: '/vocabulary' })}>
              {t.placement.startLearning}
            </button>
            <button className={styles.skipBtn} onClick={() => navigate({ to: '/dashboard' })}>
              {t.placement.toDashboard}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── Loading / submitting ───────────────────────────────────────── */
  if (submitMutation.isPending || (phase === 'test' && !currentQ)) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>{t.placement.loading}</p>
      </div>
    );
  }

  if (!currentQ) return null;

  /* ── Test ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.testContainer}>
        <div className={styles.progressRow}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${(questionsAsked / MAX_QUESTIONS) * 100}%` }} />
          </div>
          <span className={styles.progressText}>{questionsAsked + 1}/{MAX_QUESTIONS}</span>
        </div>

        <span className={`${styles.levelBadge} ${styles[`badge_${currentLevel}`]}`}>
          {currentLevel}
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
                let cls = styles.option ?? '';
                if (isShowingFeedback) {
                  if (opt === currentQ.correct) cls += ` ${styles.optionCorrect ?? ''}`;
                  else if (opt === chosenOption) cls += ` ${styles.optionWrong ?? ''}`;
                }
                return (
                  <button
                    key={opt}
                    className={cls}
                    onClick={() => handleChoose(opt)}
                    disabled={isShowingFeedback}
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
