import { Camera } from 'lucide-react';
import { useCountUp } from './useCountUp';
import { LEVEL_GRADIENTS } from './profile.constants';
import styles from './HeroBanner.module.css';

interface XpSummary {
  level: number;
  xpAtLevel: number;
  xpForNextLevel: number;
  pctToNext: number;
}

interface HeroBannerProps {
  name: string;
  tag: string;
  level: string;
  memberSince: string;
  avatarSrc: string | null;
  levelPercent: number;
  streak: number;
  wordsMastered: number;
  accuracy: number | null;
  grammarCompleted: number;
  xp: XpSummary | null;
  labels: {
    streak: string;
    words: string;
    accuracy: string;
    grammar: string;
    memberSince: string;
    xpLevel: string;
  };
  onAvatarClick: () => void;
  avatarUploading: boolean;
}

export function HeroBanner(props: HeroBannerProps) {
  const gradient = LEVEL_GRADIENTS[props.level] ?? LEVEL_GRADIENTS.A1!;

  const streakAnim = useCountUp(props.streak);
  const wordsAnim = useCountUp(props.wordsMastered);
  const accAnim = useCountUp(props.accuracy ?? 0);
  const gramAnim = useCountUp(props.grammarCompleted);

  return (
    <section className={styles.hero} style={{ backgroundImage: gradient }}>
      <svg className={styles.pattern} aria-hidden="true">
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.16)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>

      <div className={styles.heroBody}>
        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <ProgressRing percent={props.levelPercent} />
          <div className={styles.avatarInner}>
            {props.avatarSrc ? (
              <img src={props.avatarSrc} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {props.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <button
            className={styles.avatarEdit}
            onClick={props.onAvatarClick}
            disabled={props.avatarUploading}
            title="Change avatar"
          >
            <Camera size={13} />
          </button>
        </div>

        {/* Identity */}
        <div className={styles.identity}>
          <h1 className={styles.name}>{props.name}</h1>
          <span className={styles.tagHandle}>@{props.tag}</span>
          <div className={styles.identityMeta}>
            <span className={styles.levelBadge}>{props.level}</span>
            <span className={styles.memberSince}>
              {props.labels.memberSince} {props.memberSince}
            </span>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Metrics — 2×2 grid on the right */}
        <div className={styles.metrics}>
          <Metric icon="🔥" value={streakAnim} label={props.labels.streak} />
          <Metric icon="📚" value={wordsAnim} label={props.labels.words} />
          <Metric
            icon="✓"
            value={props.accuracy === null ? '—' : `${accAnim}%`}
            label={props.labels.accuracy}
          />
          <Metric icon="📝" value={gramAnim} label={props.labels.grammar} />
        </div>
      </div>

      {/* XP bar — full-width strip at the bottom of the banner */}
      {props.xp && (
        <div className={styles.xpStrip}>
          <div className={styles.xpLevelChip}>
            <span className={styles.xpLevelChipLabel}>{props.labels.xpLevel}</span>
            <span className={styles.xpLevelChipValue}>{props.xp.level}</span>
          </div>
          <div className={styles.xpBarWrap}>
            <div className={styles.xpBar}>
              <div className={styles.xpBarFill} style={{ width: `${props.xp.pctToNext}%` }} />
            </div>
            <span className={styles.xpBarText}>
              {props.xp.xpAtLevel} / {props.xp.xpForNextLevel} XP
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(1, percent / 100)) * C;
  return (
    <svg viewBox="0 0 120 120" className={styles.ring}>
      <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.25)" strokeWidth="6" fill="none" />
      {percent > 0 && (
        <circle
          cx="60"
          cy="60"
          r={R}
          stroke="white"
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${filled.toFixed(1)} ${(C - filled).toFixed(1)}`}
          strokeLinecap="round"
          style={{ transformOrigin: '60px 60px', transform: 'rotate(-90deg)' }}
        />
      )}
    </svg>
  );
}

function Metric({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricTop}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={styles.metricValue}>{value}</span>
      </div>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}
