import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookOpen, LayoutGrid, Headphones, MessageCircle, Book, CheckCircle, ArrowRight } from 'lucide-react';
import { profileApi } from '../../features/profile/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: profileApi.getHomeData,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} style={{ height: 200 }} />
        <div className={styles.skeleton} style={{ height: 120 }} />
      </div>
    );
  }

  const { streak, todayCompleted, levelProgress: lp, todayPlan: plan } = data;
  const name = user?.name ?? '';

  return (
    <div className={styles.page}>
      {/* Header */}
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

      {/* Level progress */}
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
          <span>{t.dashboard.masteredWords.replace('{n}', String(lp.masteredWords))} / {lp.totalWords}</span>
          <span>{t.dashboard.completedGrammar.replace('{n}', String(lp.completedGrammar))} / {lp.totalGrammar}</span>
          <span>{t.dashboard.completedListening.replace('{n}', String(lp.completedListening))} / {lp.totalListening}</span>
        </div>
      </div>

      {/* Today's plan */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.dashboard.todayPlan}</h2>
        <div className={styles.planGrid}>
          {/* Words card */}
          <PlanCard
            icon={<BookOpen size={22} />}
            title={t.dashboard.planWords}
            colorClass={styles.cardWords}
          >
            {plan.wordsDue === 0 && plan.wordsNew === 0 ? (
              <p className={styles.cardDone}>{t.dashboard.planWordsAllDone}</p>
            ) : (
              <div className={styles.cardStats}>
                {plan.wordsDue > 0 && (
                  <span className={styles.cardStat}>
                    {t.dashboard.planWordsDue.replace('{n}', String(plan.wordsDue))}
                  </span>
                )}
                {plan.wordsNew > 0 && (
                  <span className={styles.cardStatSecondary}>
                    {t.dashboard.planWordsNew.replace('{n}', String(plan.wordsNew))}
                  </span>
                )}
              </div>
            )}
            <Link to="/vocabulary" className={styles.cardBtn}>
              {t.dashboard.startWords} <ArrowRight size={14} />
            </Link>
          </PlanCard>

          {/* Grammar card */}
          <PlanCard
            icon={<LayoutGrid size={22} />}
            title={t.dashboard.planGrammar}
            colorClass={styles.cardGrammar}
          >
            {plan.nextGrammar ? (
              <div className={styles.cardContent}>
                <p className={styles.cardName}>{plan.nextGrammar.title}</p>
                <span className={styles.cardTag}>
                  {(t.dashboard.planGrammarStatus as Record<string, string>)[plan.nextGrammar.status] ?? plan.nextGrammar.status}
                </span>
              </div>
            ) : (
              <p className={styles.cardDone}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                {t.dashboard.planGrammarNone}
              </p>
            )}
            {plan.nextGrammar && (
              <Link to="/grammar/$slug" params={{ slug: plan.nextGrammar.slug }} className={styles.cardBtn}>
                {t.dashboard.openTopic} <ArrowRight size={14} />
              </Link>
            )}
          </PlanCard>

          {/* Listening card */}
          <PlanCard
            icon={<Headphones size={22} />}
            title={t.dashboard.planListening}
            colorClass={styles.cardListening}
          >
            {plan.nextListening ? (
              <div className={styles.cardContent}>
                <p className={styles.cardName}>{plan.nextListening.title}</p>
                <span className={styles.cardTag}>
                  {t.dashboard.planListeningDuration.replace('{n}', String(plan.nextListening.durationSec))}
                </span>
              </div>
            ) : (
              <p className={styles.cardDone}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                {t.dashboard.planListeningNone}
              </p>
            )}
            {plan.nextListening && (
              <Link to="/listening/$id" params={{ id: plan.nextListening.id }} className={styles.cardBtn}>
                {t.dashboard.openExercise} <ArrowRight size={14} />
              </Link>
            )}
          </PlanCard>
        </div>
      </section>

      {/* Quick access */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.dashboard.quickAccess}</h2>
        <div className={styles.quickGrid}>
          <QuickLink to="/conversation" icon={<MessageCircle size={20} />} label={t.nav.conversations} />
          <QuickLink to="/dictionary" icon={<Book size={20} />} label={t.nav.dictionary} />
          <QuickLink to="/profile" icon={<BookOpen size={20} />} label={t.nav.profile} />
        </div>
      </section>
    </div>
  );
}

function PlanCard({
  icon,
  title,
  colorClass,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  colorClass: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.planCard} ${colorClass ?? ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{icon}</span>
        <span className={styles.cardTitle}>{title}</span>
      </div>
      <div className={styles.cardBody}>{children}</div>
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
