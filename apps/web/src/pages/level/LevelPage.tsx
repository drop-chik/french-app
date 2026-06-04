import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, BookOpen, Headphones, Dumbbell, PenLine, GraduationCap, Globe2 } from 'lucide-react';
import { Section, Action, Pill } from '../../shared/components/ui';
import { profileApi } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { LEVEL_DATA, LEVEL_ORDER, type Level } from './levelData';
import styles from './LevelPage.module.css';

/**
 * Public per-level marketing + content overview page.
 *
 * Single template, six instances — every URL `/level/A1..C2` renders
 * this with different data pulled from `levelData.ts`. SavoirX-style
 * linear narrative arc:
 *
 *    hero (outcome)
 *      → specs (numbers + duration)
 *      → "what you can do"
 *      → skills breakdown
 *      → grammar highlights
 *      → final CTA
 *
 * The page is PUBLIC: gpt-friendly SEO surface + onboarding funnel.
 * Authenticated users see a small "your progress" insert; guests get
 * the same content + "Sign up to start" CTA.
 */
export function LevelPage() {
  const { level: levelParam } = useParams({ from: '/level/$level' });
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const level = (levelParam ?? '').toUpperCase() as Level;
  const data = LEVEL_DATA[level];

  // Auth users get their progress inserted under the hero
  const { data: levelsProgress } = useQuery({
    queryKey: ['levels-progress'],
    queryFn: profileApi.getLevelsProgress,
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
  });

  if (!data) {
    return (
      <div className={styles.notFound}>
        <h1>{t.levelPage.notFound}</h1>
        <Action onClick={() => navigate({ to: '/' })}>{t.levelPage.backHome}</Action>
      </div>
    );
  }

  const isRu = lang === 'ru';
  const name = isRu ? data.nameRu : data.nameEn;
  const eyebrow = isRu ? data.eyebrowRu : data.eyebrowEn;
  const outcome = isRu ? data.outcomeRu : data.outcomeEn;
  const duration = isRu ? data.durationRu : data.durationEn;
  const canDo = isRu ? data.canDoRu : data.canDoEn;
  const grammarHl = isRu ? data.grammarHighlightsRu : data.grammarHighlightsEn;

  const myProgress = levelsProgress?.levels?.find((l) => l.level === level);
  const ratio = myProgress && myProgress.totalWords > 0
    ? Math.round((myProgress.learnedWords / myProgress.totalWords) * 100)
    : null;

  const examSpec = data.examSpec;
  const examWords    = isRu ? examSpec.wordsRu    : examSpec.wordsEn;
  const examDuration = isRu ? examSpec.durationRu : examSpec.durationEn;
  const examPoints   = isRu ? examSpec.pointsRu   : examSpec.pointsEn;
  const examFocus    = isRu ? examSpec.focusRu    : examSpec.focusEn;

  const skills = [
    { icon: <BookOpen size={20} />, label: t.levelPage.skills.vocab, count: data.content.words, suffix: t.levelPage.skills.wordsSuffix },
    { icon: <GraduationCap size={20} />, label: t.levelPage.skills.grammar, count: data.content.grammar, suffix: t.levelPage.skills.topicsSuffix },
    { icon: <Dumbbell size={20} />, label: t.levelPage.skills.drills, count: data.content.drills, suffix: t.levelPage.skills.setsSuffix },
    { icon: <Headphones size={20} />, label: t.levelPage.skills.listening, count: data.content.listening, suffix: t.levelPage.skills.exercisesSuffix },
    { icon: <Globe2 size={20} />, label: t.levelPage.skills.reading, count: data.content.reading, suffix: t.levelPage.skills.textsSuffix },
    { icon: <PenLine size={20} />, label: t.levelPage.skills.writing, count: data.content.writing, suffix: t.levelPage.skills.promptsSuffix },
  ];

  return (
    <div className={styles.page}>
      {/* HERO */}
      <Section eyebrow={eyebrow} title={outcome} as="h1">
        <div className={styles.heroMeta}>
          <Pill tone="level" level={level}>{level} · {name}</Pill>
          <span className={styles.duration}>{t.levelPage.duration}: {duration}</span>
        </div>
        {ratio !== null && (
          <div className={styles.myProgress}>
            <div className={styles.myProgressBar}>
              <div className={styles.myProgressFill} style={{ width: `${ratio}%` }} />
            </div>
            <p className={styles.myProgressText}>
              {t.levelPage.myProgress.replace('{pct}', String(ratio)).replace('{learned}', String(myProgress!.learnedWords)).replace('{total}', String(myProgress!.totalWords))}
            </p>
          </div>
        )}
        <div className={styles.heroActions}>
          <Action to={isAuth ? '/dashboard' : '/login'} size="lg">
            {isAuth ? t.levelPage.continueCta : t.levelPage.startCta} <ArrowRight size={18} />
          </Action>
        </div>
      </Section>

      {/* CAN-DO */}
      <Section eyebrow={t.levelPage.canDoEyebrow} title={t.levelPage.canDoTitle.replace('{level}', level)} variant="tinted" narrow>
        <ul className={styles.canDoList}>
          {canDo.map((item) => (
            <li key={item} className={styles.canDoItem}>
              <span className={styles.canDoMark}><Check size={14} /></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* EXAM SPEC — concrete numbers from the real DELF/DALF guides */}
      <Section
        eyebrow={t.levelPage.examEyebrow}
        title={t.levelPage.examTitle.replace('{exam}', examSpec.name)}
        lead={t.levelPage.examLead}
        narrow
      >
        <div className={styles.examGrid}>
          <div className={styles.examCard}>
            <div className={styles.examLabel}>{t.levelPage.examWords}</div>
            <div className={styles.examValue}>{examWords}</div>
          </div>
          <div className={styles.examCard}>
            <div className={styles.examLabel}>{t.levelPage.examDuration}</div>
            <div className={styles.examValue}>{examDuration}</div>
          </div>
          <div className={styles.examCard}>
            <div className={styles.examLabel}>{t.levelPage.examPoints}</div>
            <div className={styles.examValue}>{examPoints}</div>
          </div>
          <div className={styles.examCard}>
            <div className={styles.examLabel}>{t.levelPage.examFocus}</div>
            <div className={styles.examValue}>{examFocus}</div>
          </div>
        </div>
      </Section>

      {/* SKILLS BREAKDOWN */}
      <Section eyebrow={t.levelPage.skillsEyebrow} title={t.levelPage.skillsTitle} lead={t.levelPage.skillsLead}>
        <div className={styles.skillsGrid}>
          {skills.map((s) => (
            <div key={s.label} className={styles.skillCard}>
              <span className={styles.skillIcon}>{s.icon}</span>
              <div className={styles.skillCount}>{s.count.toLocaleString()}</div>
              <div className={styles.skillSuffix}>{s.suffix}</div>
              <div className={styles.skillLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* GRAMMAR HIGHLIGHTS */}
      <Section eyebrow={t.levelPage.grammarEyebrow} title={t.levelPage.grammarTitle.replace('{level}', level)} variant="tinted" narrow>
        <ul className={styles.grammarList}>
          {grammarHl.map((g) => (
            <li key={g} className={styles.grammarItem}>{g}</li>
          ))}
        </ul>
      </Section>

      {/* NEIGHBOUR NAVIGATION */}
      <Section narrow>
        <div className={styles.neighbours}>
          {LEVEL_ORDER.indexOf(level) > 0 && (
            <Action variant="ghost" to={`/level/${LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1]}`}>
              ← {t.levelPage.prevLevel}: {LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1]}
            </Action>
          )}
          <Action to={isAuth ? '/dashboard' : '/login'} size="lg">
            {isAuth ? t.levelPage.continueCta : t.levelPage.startCta} <ArrowRight size={18} />
          </Action>
          {LEVEL_ORDER.indexOf(level) < LEVEL_ORDER.length - 1 && (
            <Action variant="ghost" to={`/level/${LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1]}`}>
              {t.levelPage.nextLevel}: {LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1]} →
            </Action>
          )}
        </div>
      </Section>
    </div>
  );
}
