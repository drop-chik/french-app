import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookOpen, LayoutGrid, Headphones, MessageCircle, Book, ArrowRight, Dumbbell, PenLine, BookMarked, Trophy, Compass } from 'lucide-react';
import { profileApi, type LevelProgressData } from '../../features/profile/api';
import { achievementsApi } from '../../features/achievements/api';
import { AchievementBadge } from '../../features/achievements/AchievementBadge';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import type { Translations } from '../../shared/i18n/ru';
import { TodayHero, pickAction } from './TodayHero';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { t, lang } = useI18n();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['home'],
    queryFn: profileApi.getHomeData,
    staleTime: 2 * 60 * 1000,
  });

  const { data: levelsData } = useQuery({
    queryKey: ['levels-progress'],
    queryFn: profileApi.getLevelsProgress,
    staleTime: 5 * 60 * 1000,
  });

  const { data: promotionData } = useQuery({
    queryKey: ['promotion-status'],
    queryFn: profileApi.getPromotionStatus,
    staleTime: 60 * 1000,
  });

  const { data: xpData } = useQuery({
    queryKey: ['xp-summary'],
    queryFn: achievementsApi.xp,
    staleTime: 60_000,
  });

  const { data: recentAchievements } = useQuery({
    queryKey: ['achievements-recent'],
    queryFn: () => achievementsApi.recent(4),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} style={{ height: 200 }} />
        <div className={styles.skeleton} style={{ height: 120 }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>{t.common.error}</p>
          <p className={styles.errorHint}>{t.dashboard.errorHint}</p>
        </div>
      </div>
    );
  }

  const { streak, todayCompleted, levelProgress: lp, todayPlan: plan } = data;
  const name = user?.name ?? '';

  const heroAction = pickAction(plan, t.dashboard.today);

  return (
    <div className={styles.page}>
      {/* Compact header — greeting + level + streak in one line */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.greeting}>
            {t.dashboard.greeting.replace('{name}', name)}
          </h1>
          <span className={styles.levelBadge}>
            {t.dashboard.levelBadge.replace('{level}', lp.level)}
          </span>
        </div>
        {streak > 0 && (
          <div className={`${styles.streakBadge} ${todayCompleted ? styles.streakBadgeDone : ''}`}>
            {todayCompleted
              ? t.dashboard.streakDone
              : t.dashboard.streakActive.replace('{n}', String(streak))}
          </div>
        )}
      </div>

      {/* THE one job for today */}
      <TodayHero plan={plan} labels={t.dashboard.today} />

      {/* Other tasks — only the ones NOT already in the hero */}
      <OtherTasks plan={plan} heroTone={heroAction.tone} t={t} />

      {/* Level progress card */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressTitle}>
            {t.dashboard.levelProgress.replace('{level}', lp.level)}
          </span>
          <span className={styles.progressPct}>{lp.percent}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${lp.percent}%` }} />
        </div>
        <div className={styles.progressMeta}>
          <span>{t.dashboard.masteredWords.replace('{n}', String(lp.learnedWords ?? lp.masteredWords))} / {lp.totalWords}</span>
          <span>{t.dashboard.completedGrammar.replace('{n}', String(lp.completedGrammar))} / {lp.totalGrammar}</span>
          <span>{t.dashboard.completedListening.replace('{n}', String(lp.completedListening))} / {lp.totalListening}</span>
        </div>
        <span className={styles.progressSub}>
          {t.dashboard.masteredSub.replace('{n}', String(lp.masteredWords))}
        </span>
      </div>

      {/* All levels progress */}
      {levelsData && levelsData.levels.length > 0 && (
        <div className={styles.levelsCard}>
          <p className={styles.levelsTitle}>{t.dashboard.allLevelsProgress}</p>
          <div className={styles.levelsRow}>
            {levelsData.levels.map((lv) => (
              <LevelItem key={lv.level} lv={lv} />
            ))}
          </div>
        </div>
      )}

      {/* Promotion hint */}
      {promotionData?.status && promotionData.status.next && promotionData.status.ratio >= 0.4 && (
        <div className={styles.promotionHint}>
          <p className={styles.promotionHintText}>
            {(promotionData.status.eligibleForPromotion
              ? t.profile.promotionHintReady
              : t.profile.promotionHintProgress)
              .replace('{current}', promotionData.status.current)
              .replace('{next}', promotionData.status.next ?? '')
              .replace('{pct}', Math.round(promotionData.status.ratio * 100).toString())
              .replace('{mastered}', promotionData.status.masteredCount.toString())
              .replace('{total}', promotionData.status.total.toString())
              .replace('{remaining}', Math.max(0, Math.ceil(promotionData.status.total * 0.8) - promotionData.status.masteredCount).toString())}
          </p>
          <Link to="/level-test" className={styles.promotionHintBtn}>
            {t.profile.promotionHintCta.replace('{next}', promotionData.status.next ?? '')}
          </Link>
        </div>
      )}

      {/* XP + recent achievements row */}
      {(xpData || (recentAchievements && recentAchievements.items.length > 0)) && (
        <div className={styles.achievementsRow}>
          {xpData && (
            <Link to="/achievements" className={styles.xpCard}>
              <div className={styles.xpCardIcon}>
                <Trophy size={22} />
              </div>
              <div className={styles.xpCardBody}>
                <div className={styles.xpCardTopLine}>
                  <span className={styles.xpCardLevelLabel}>{t.achievements.level}</span>
                  <span className={styles.xpCardLevelValue}>{xpData.level}</span>
                </div>
                <div className={styles.xpCardBar}>
                  <div className={styles.xpCardBarFill} style={{ width: `${xpData.pctToNext}%` }} />
                </div>
                <span className={styles.xpCardRange}>{xpData.xpAtLevel} / {xpData.xpForNextLevel} XP</span>
              </div>
              <ArrowRight size={16} className={styles.xpCardArrow} />
            </Link>
          )}

          {recentAchievements && recentAchievements.items.length > 0 && (
            <div className={styles.recentCard}>
              <div className={styles.recentHeader}>
                <span className={styles.recentTitle}>{t.dashboard.recentAchievements}</span>
                <Link to="/achievements" className={styles.recentMore}>
                  {t.dashboard.viewAll} <ArrowRight size={12} />
                </Link>
              </div>
              <div className={styles.recentBadges}>
                {recentAchievements.items.map((item) => (
                  <AchievementBadge key={item.id} item={item} lang={lang} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tools (quick links) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.dashboard.tools}</h2>
        <div className={styles.quickGrid}>
          <QuickLink to="/reading"      icon={<BookMarked size={20} />}    label={t.nav.reading} />
          <QuickLink to="/writing"      icon={<PenLine size={20} />}       label={t.nav.writing} />
          <QuickLink to="/drills"       icon={<Dumbbell size={20} />}      label={t.nav.drills} />
          <QuickLink to="/conversation" icon={<MessageCircle size={20} />} label={t.nav.conversations} />
          <QuickLink to="/dictionary"   icon={<Book size={20} />}          label={t.nav.dictionary} />
          <QuickLink to="/explore"      icon={<Compass size={20} />}       label={t.explore.title} />
        </div>
      </section>
    </div>
  );
}

/**
 * Renders only the today-plan items that are NOT already surfaced by the hero
 * card. Quiet, compact, secondary. If the hero is showing the "all done"
 * fallback, this whole section is hidden so we don't re-list completed work.
 */
function OtherTasks({
  plan,
  heroTone,
  t,
}: {
  plan: { wordsDue: number; wordsNew: number; nextGrammar: { slug: string; title: string; status: string } | null; nextListening: { id: string; title: string; durationSec: number } | null };
  heroTone: 'words' | 'grammar' | 'listening' | 'done';
  t: Translations;
}) {
  if (heroTone === 'done') return null;

  const showWords = heroTone !== 'words' && (plan.wordsDue > 0 || plan.wordsNew > 0);
  const showGrammar = heroTone !== 'grammar' && plan.nextGrammar !== null;
  const showListening = heroTone !== 'listening' && plan.nextListening !== null;

  if (!showWords && !showGrammar && !showListening) return null;

  return (
    <section className={styles.otherTasks}>
      <h2 className={styles.otherTasksTitle}>{t.dashboard.otherTasks}</h2>
      <div className={styles.otherTasksRow}>
        {showWords && (
          <SecondaryTask
            icon={<BookOpen size={18} />}
            title={t.dashboard.planWords}
            sub={plan.wordsDue > 0 ? t.dashboard.planWordsDue.replace('{n}', String(plan.wordsDue)) : t.dashboard.planWordsNew.replace('{n}', String(plan.wordsNew))}
            to="/vocabulary"
          />
        )}
        {showGrammar && plan.nextGrammar && (
          <SecondaryTask
            icon={<LayoutGrid size={18} />}
            title={t.dashboard.planGrammar}
            sub={plan.nextGrammar.title}
            to="/grammar/$slug"
            params={{ slug: plan.nextGrammar.slug }}
          />
        )}
        {showListening && plan.nextListening && (
          <SecondaryTask
            icon={<Headphones size={18} />}
            title={t.dashboard.planListening}
            sub={plan.nextListening.title}
            to="/listening/$id"
            params={{ id: plan.nextListening.id }}
          />
        )}
      </div>
    </section>
  );
}

function SecondaryTask({
  icon,
  title,
  sub,
  to,
  params,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  to: string;
  params?: Record<string, string>;
}) {
  const body = (
    <>
      <span className={styles.secondaryIcon}>{icon}</span>
      <span className={styles.secondaryBody}>
        <span className={styles.secondaryTitle}>{title}</span>
        <span className={styles.secondarySub}>{sub}</span>
      </span>
      <ArrowRight size={16} className={styles.secondaryArrow} />
    </>
  );
  return params ? (
    <Link to={to} params={params} className={styles.secondaryTask}>{body}</Link>
  ) : (
    <Link to={to} className={styles.secondaryTask}>{body}</Link>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#f97316',
  B2: '#a855f7',
  C1: '#ec4899',
  C2: '#ef4444',
};

function LevelItem({ lv }: { lv: LevelProgressData }) {
  const color = LEVEL_COLORS[lv.level] ?? '#6b7280';
  return (
    <div className={styles.levelItem}>
      <div className={styles.levelHeader}>
        <span className={styles.levelLabel} style={{ color }}>{lv.level}</span>
        <span className={styles.levelPct}>{lv.percent}%</span>
      </div>
      <div className={styles.levelBar}>
        <div className={styles.levelFill} style={{ width: `${lv.percent}%`, background: color }} />
      </div>
      <span className={styles.levelMeta}>{lv.learnedWords} / {lv.totalWords}</span>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className={styles.quickLink}>
      <span className={styles.quickIcon}>{icon}</span>
      <span className={styles.quickLabel}>{label}</span>
    </Link>
  );
}

