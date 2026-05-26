import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Headphones, Clock, CheckCircle2, Play, HelpCircle, TrendingUp } from 'lucide-react';
import { listeningApi, type ListeningExerciseListItem } from '../../features/listening/api';
import { useI18n } from '../../shared/i18n';
import styles from './ListeningPage.module.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type Level = typeof LEVELS[number];

// Title-driven topic emoji — covers the obvious French A1-B2 themes. Falls back
// to 🎧 for anything we haven't matched. We keep this on the client because
// adding a topic column on the backend is more changework than it's worth.
function emojiForTitle(title: string): string {
  const lower = title.toLowerCase();
  if (/(présenter|prénom|nom|moi|toi|elle\b|lui\b)/.test(lower)) return '👤';
  if (/(café|restaurant|menu|commander|manger|repas|boire|plat|food)/.test(lower)) return '🍽️';
  if (/(achat|magasin|marché|boutique|shopping|prix|payer)/.test(lower)) return '🛍️';
  if (/(maison|habiter|appartement|chambre|home)/.test(lower)) return '🏠';
  if (/(famille|parent|enfant|frère|sœur|family)/.test(lower)) return '👨‍👩‍👧';
  if (/(travail|bureau|métier|profession|emploi|work|job)/.test(lower)) return '💼';
  if (/(école|cours|étudier|classe|prof|student|school)/.test(lower)) return '🎓';
  if (/(voyage|train|avion|gare|hôtel|vacances|travel|hotel)/.test(lower)) return '✈️';
  if (/(temps|météo|pluie|soleil|neige|weather)/.test(lower)) return '⛅';
  if (/(médecin|santé|malade|pharmacie|hospital|health)/.test(lower)) return '🏥';
  if (/(loisir|sport|musique|film|cinéma|hobby|leisure)/.test(lower)) return '🎬';
  if (/(rendez-vous|invitation|fête|party|sortir)/.test(lower)) return '🎉';
  if (/(téléphone|appel|message|phone|call)/.test(lower)) return '📞';
  if (/(direction|chemin|rue|métro|bus|transport)/.test(lower)) return '🗺️';
  if (/(ville|paris|france|country|city)/.test(lower)) return '🏙️';
  return '🎧';
}

// Each CEFR level gets a colour, used for the gradient strip + chip border.
const LEVEL_COLORS: Record<Level, { from: string; to: string; tint: string }> = {
  A1: { from: '#22c55e', to: '#15803d', tint: 'rgba(34, 197, 94, 0.12)' },
  A2: { from: '#3b82f6', to: '#1d4ed8', tint: 'rgba(59, 130, 246, 0.12)' },
  B1: { from: '#f97316', to: '#c2410c', tint: 'rgba(249, 115, 22, 0.12)' },
  B2: { from: '#a855f7', to: '#7c3aed', tint: 'rgba(168, 85, 247, 0.12)' },
};

export function ListeningPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [selectedLevel, setSelectedLevel] = useState<Level>('A1');

  const { data, isLoading } = useQuery({
    queryKey: ['listening-exercises', selectedLevel, lang],
    queryFn: () => listeningApi.getExercises(selectedLevel),
  });

  const exercises: ListeningExerciseListItem[] = data?.exercises ?? [];

  // Stats for the current level
  const stats = useMemo(() => {
    const done = exercises.filter((e) => e.progress?.completed).length;
    const total = exercises.length;
    const scored = exercises.filter((e) => e.progress?.completed && (e.progress?.score ?? 0) > 0);
    const avg = scored.length > 0
      ? Math.round(scored.reduce((s, e) => s + (e.progress?.score ?? 0), 0) / scored.length)
      : 0;
    const totalSec = exercises.reduce((s, e) => s + e.durationSec, 0);
    const totalMin = Math.round(totalSec / 60);
    const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, avg, totalMin, donePct };
  }, [exercises]);

  // The first unfinished exercise becomes the "continue" hero card.
  const continueExercise = useMemo(
    () => exercises.find((e) => !e.progress?.completed) ?? null,
    [exercises],
  );

  const levelColor = LEVEL_COLORS[selectedLevel];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}><Headphones size={26} /></span>
            {t.listening.title}
          </h1>
          <p className={styles.subtitle}>{t.listening.subtitle}</p>
        </div>

        {/* Level chips — colored per level */}
        <div className={styles.levelChips} data-tour="listening-levels">
          {LEVELS.map((lvl) => {
            const isActive = selectedLevel === lvl;
            const c = LEVEL_COLORS[lvl];
            return (
              <button
                key={lvl}
                className={`${styles.levelChip} ${isActive ? styles.levelChipActive : ''}`}
                onClick={() => setSelectedLevel(lvl)}
                style={isActive
                  ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, color: 'white', borderColor: 'transparent' }
                  : { borderColor: c.from, color: c.from }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      {!isLoading && stats.total > 0 && (
        <div className={styles.statsStrip} style={{ background: levelColor.tint }}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.done} / {stats.total}</div>
            <div className={styles.statLabel}>{t.listening.statsDoneLabel}</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.avg > 0 ? `${stats.avg}%` : '—'}</div>
            <div className={styles.statLabel}>{t.listening.statsAvgLabel}</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>~{stats.totalMin}</div>
            <div className={styles.statLabel}>{t.listening.statsMinutesLabel}</div>
          </div>
          {/* Right side: progress ring */}
          <div className={styles.statsRing} aria-label={t.listening.progressLabel}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke={levelColor.from} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(stats.donePct / 100) * 150.8} 150.8`}
                transform="rotate(-90 28 28)"
              />
            </svg>
            <span className={styles.statsRingValue} style={{ color: levelColor.from }}>{stats.donePct}%</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      )}

      {/* Featured "continue" card */}
      {!isLoading && continueExercise && (
        <button
          className={styles.featured}
          onClick={() => navigate({ to: '/listening/$id', params: { id: continueExercise.id } })}
          style={{ background: `linear-gradient(135deg, ${levelColor.from}, ${levelColor.to})` }}
          data-tour="listening-continue"
        >
          <div className={styles.featuredLabel}>{t.listening.continueLabel}</div>
          <div className={styles.featuredBody}>
            <span className={styles.featuredEmoji}>{emojiForTitle(continueExercise.title)}</span>
            <div className={styles.featuredText}>
              <div className={styles.featuredHint}>{t.listening.continueHint}</div>
              <h2 className={styles.featuredTitle}>{continueExercise.title}</h2>
              <div className={styles.featuredMeta}>
                <span><Clock size={13} /> {continueExercise.durationSec}s</span>
                <span><HelpCircle size={13} /> {t.listening.questionsCount.replace('{n}', String(continueExercise.questions.length))}</span>
              </div>
            </div>
            <div className={styles.featuredPlay}>
              <Play size={28} />
            </div>
          </div>
        </button>
      )}

      {/* Cards grid */}
      {!isLoading && (
        <div className={styles.grid}>
          {exercises.map((ex) => {
            const done = ex.progress?.completed ?? false;
            const score = ex.progress?.score ?? 0;
            return (
              <button
                key={ex.id}
                className={`${styles.card} ${done ? styles.cardDone : ''}`}
                onClick={() => navigate({ to: '/listening/$id', params: { id: ex.id } })}
              >
                <div
                  className={styles.cardStrip}
                  style={{ background: `linear-gradient(90deg, ${levelColor.from}, ${levelColor.to})` }}
                />
                <div className={styles.cardEmoji}>{emojiForTitle(ex.title)}</div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{ex.title}</h3>
                  <div className={styles.cardMeta}>
                    <span><Clock size={12} /> {ex.durationSec}s</span>
                    <span><HelpCircle size={12} /> {t.listening.questionsCount.replace('{n}', String(ex.questions.length))}</span>
                  </div>
                </div>
                {done ? (
                  <div className={styles.cardDoneBadge}>
                    <CheckCircle2 size={14} />
                    <span>{score}%</span>
                  </div>
                ) : (
                  <div className={styles.cardStartBadge}>
                    <TrendingUp size={14} />
                  </div>
                )}
              </button>
            );
          })}

          {exercises.length === 0 && !isLoading && (
            <p className={styles.empty}>{t.listening.empty}</p>
          )}
        </div>
      )}
    </div>
  );
}
