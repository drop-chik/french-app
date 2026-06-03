import { BookOpen, LayoutGrid, Headphones, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import styles from './TodayHero.module.css';

/**
 * One-job-per-screen hero card for the dashboard. Picks ONE concrete
 * action for today using deterministic priority (due reviews →
 * new words → next grammar → next listening → "ahead of plan"
 * fallback). Everything else on the page is secondary.
 */

export type TodayPlan = {
  wordsDue: number;
  wordsNew: number;
  nextGrammar: { slug: string; title: string; status: string } | null;
  nextListening: { id: string; title: string; durationSec: number } | null;
};

interface TodayHeroLabels {
  eyebrowToday: string;
  eyebrowDone: string;
  titleReview: string;
  titleNewWords: string;
  titleGrammar: string;
  titleListening: string;
  titleAllDone: string;
  subReview: string;
  subNewWords: string;
  subGrammar: string;
  subListening: string;
  subAllDone: string;
  ctaReview: string;
  ctaNewWords: string;
  ctaGrammar: string;
  ctaListening: string;
  ctaExplore: string;
}

interface Action {
  icon: ReactNode;
  tone: 'words' | 'grammar' | 'listening' | 'done';
  eyebrow: string;
  title: string;
  sub: string;
  ctaLabel: string;
  to: string;
  params?: Record<string, string>;
}

function pickAction(plan: TodayPlan, labels: TodayHeroLabels): Action {
  if (plan.wordsDue > 0) {
    return {
      icon: <BookOpen size={28} strokeWidth={2.2} />,
      tone: 'words',
      eyebrow: labels.eyebrowToday,
      title: labels.titleReview.replace('{n}', String(plan.wordsDue)),
      sub: labels.subReview,
      ctaLabel: labels.ctaReview,
      to: '/vocabulary',
    };
  }
  if (plan.wordsNew > 0) {
    return {
      icon: <Sparkles size={28} strokeWidth={2.2} />,
      tone: 'words',
      eyebrow: labels.eyebrowToday,
      title: labels.titleNewWords.replace('{n}', String(plan.wordsNew)),
      sub: labels.subNewWords,
      ctaLabel: labels.ctaNewWords,
      to: '/vocabulary',
    };
  }
  if (plan.nextGrammar) {
    return {
      icon: <LayoutGrid size={28} strokeWidth={2.2} />,
      tone: 'grammar',
      eyebrow: labels.eyebrowToday,
      title: labels.titleGrammar.replace('{title}', plan.nextGrammar.title),
      sub: labels.subGrammar,
      ctaLabel: labels.ctaGrammar,
      to: '/grammar/$slug',
      params: { slug: plan.nextGrammar.slug },
    };
  }
  if (plan.nextListening) {
    return {
      icon: <Headphones size={28} strokeWidth={2.2} />,
      tone: 'listening',
      eyebrow: labels.eyebrowToday,
      title: labels.titleListening.replace('{title}', plan.nextListening.title),
      sub: labels.subListening,
      ctaLabel: labels.ctaListening,
      to: '/listening/$id',
      params: { id: plan.nextListening.id },
    };
  }
  return {
    icon: <CheckCircle2 size={28} strokeWidth={2.2} />,
    tone: 'done',
    eyebrow: labels.eyebrowDone,
    title: labels.titleAllDone,
    sub: labels.subAllDone,
    ctaLabel: labels.ctaExplore,
    to: '/explore',
  };
}

interface TodayHeroProps {
  plan: TodayPlan;
  labels: TodayHeroLabels;
}

export function TodayHero({ plan, labels }: TodayHeroProps) {
  const a = pickAction(plan, labels);
  return (
    <div className={`${styles.hero} ${styles[a.tone]}`}>
      <div className={styles.iconWrap}>{a.icon}</div>
      <div className={styles.body}>
        <span className={styles.eyebrow}>{a.eyebrow}</span>
        <h2 className={styles.title}>{a.title}</h2>
        <p className={styles.sub}>{a.sub}</p>
      </div>
      {a.params ? (
        <Link to={a.to} params={a.params} className={styles.cta}>
          {a.ctaLabel}
        </Link>
      ) : (
        <Link to={a.to} className={styles.cta}>
          {a.ctaLabel}
        </Link>
      )}
    </div>
  );
}

export { pickAction };
