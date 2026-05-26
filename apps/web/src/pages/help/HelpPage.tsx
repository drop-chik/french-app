import { Link, useNavigate } from '@tanstack/react-router';
import {
  Home, BookOpen, Book, LayoutGrid, Dumbbell, Type,
  BookMarked, PenLine, Headphones, MessageCircle, Users, UserCircle, Trophy,
  Compass, PlayCircle,
} from 'lucide-react';
import { useI18n } from '../../shared/i18n';
import { useHelp } from '../../shared/help/HelpProvider';
import { tourFor } from '../../shared/help/tourConfig';
import { useAuthStore } from '../../features/auth/authStore';
import { isUnlocked, type Level } from '../../shared/nav/navConfig';
import styles from './HelpPage.module.css';

type Section = 'learn' | 'practice' | 'social' | 'ref';
type I18nKey =
  | 'dashboard' | 'vocabulary' | 'dictionary' | 'grammar' | 'drills' | 'conjugation'
  | 'reading' | 'writing' | 'listening' | 'conversation' | 'friends' | 'profile' | 'achievements';

interface CardDef {
  id: I18nKey;
  i18nKey: I18nKey;
  to: string;
  icon: typeof Home;
  minLevel?: Level;
  section: Section;
}

const CARDS: CardDef[] = [
  { id: 'dashboard',    i18nKey: 'dashboard',    to: '/dashboard',    icon: Home,         section: 'learn' },
  { id: 'vocabulary',   i18nKey: 'vocabulary',   to: '/vocabulary',   icon: BookOpen,     section: 'learn' },
  { id: 'dictionary',   i18nKey: 'dictionary',   to: '/dictionary',   icon: Book,         section: 'learn' },
  { id: 'grammar',      i18nKey: 'grammar',      to: '/grammar',      icon: LayoutGrid,   section: 'learn' },
  { id: 'drills',       i18nKey: 'drills',       to: '/drills',       icon: Dumbbell,     minLevel: 'A2', section: 'learn' },
  { id: 'conjugation',  i18nKey: 'conjugation',  to: '/conjugation',  icon: Type,         minLevel: 'A2', section: 'learn' },
  { id: 'reading',      i18nKey: 'reading',      to: '/reading',      icon: BookMarked,   minLevel: 'A2', section: 'practice' },
  { id: 'writing',      i18nKey: 'writing',      to: '/writing',      icon: PenLine,      minLevel: 'B1', section: 'practice' },
  { id: 'listening',    i18nKey: 'listening',    to: '/listening',    icon: Headphones,   minLevel: 'A2', section: 'practice' },
  { id: 'conversation', i18nKey: 'conversation', to: '/conversation', icon: MessageCircle,minLevel: 'A2', section: 'practice' },
  { id: 'friends',      i18nKey: 'friends',      to: '/friends',      icon: Users,        section: 'social' },
  { id: 'profile',      i18nKey: 'profile',      to: '/profile',      icon: UserCircle,   section: 'ref' },
  { id: 'achievements', i18nKey: 'achievements', to: '/achievements', icon: Trophy,       section: 'ref' },
];

export function HelpPage() {
  const { t } = useI18n();
  const level = useAuthStore((s) => s.user?.level);
  const { startTourForCurrentPage, tourAvailable } = useHelp();
  const navigate = useNavigate();

  const sectionLabels: Record<Section, string> = {
    learn:    t.help.sectionLearn,
    practice: t.help.sectionPractice,
    social:   t.help.sectionSocial,
    ref:      t.help.sectionRef,
  };
  const sectionsOrder: Section[] = ['learn', 'practice', 'social', 'ref'];

  function openTour(path: string) {
    // Navigate first; tour kicks in automatically on first visit (HelpProvider),
    // or we re-trigger from the destination page via the "?" menu.
    void navigate({ to: path });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIcon}><Compass size={28} /></div>
        <div>
          <h1 className={styles.title}>{t.help.title}</h1>
          <p className={styles.subtitle}>{t.help.subtitle}</p>
        </div>
      </header>

      {tourAvailable && (
        <button
          className={styles.tourCta}
          onClick={() => startTourForCurrentPage()}
        >
          <PlayCircle size={18} />
          <span>{t.help.tourOnThisPage}</span>
        </button>
      )}

      {sectionsOrder.map((sec) => {
        const items = CARDS.filter((c) => c.section === sec);
        if (items.length === 0) return null;
        return (
          <section key={sec} className={styles.section}>
            <h2 className={styles.sectionTitle}>{sectionLabels[sec]}</h2>
            <div className={styles.grid}>
              {items.map((c) => {
                const Icon = c.icon;
                const locked = c.minLevel ? !isUnlocked(c.minLevel, level) : false;
                const hasTour = !!tourFor(c.to);
                const cardData = t.help.cards[c.i18nKey];
                return (
                  <div
                    key={c.id}
                    className={`${styles.card} ${locked ? styles.cardLocked : ''}`}
                  >
                    <div className={styles.cardIcon}><Icon size={20} /></div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{cardData.title}</h3>
                      <p className={styles.cardText}>{cardData.body}</p>
                      <div className={styles.cardActions}>
                        {locked ? (
                          <span className={styles.lockedBadge}>
                            {t.nav.lockedAt.replace('{level}', c.minLevel ?? '')}
                          </span>
                        ) : (
                          <>
                            <Link to={c.to} className={styles.openLink}>
                              {t.help.cards[c.i18nKey].title} →
                            </Link>
                            {hasTour && (
                              <button
                                className={styles.tourLink}
                                onClick={() => openTour(c.to)}
                              >
                                <PlayCircle size={13} />
                                {t.help.tourButton}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
