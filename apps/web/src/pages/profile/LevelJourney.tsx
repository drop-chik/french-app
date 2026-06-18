import { Lock, Check } from 'lucide-react';
import { LEVEL_COLORS, LEVEL_ORDER } from './profile.constants';
import styles from './LevelJourney.module.css';

interface LevelData {
  level: string;
  masteredWords: number;
  learnedWords?: number;
  totalWords: number;
  targetWords?: number;
  percent: number;
}

interface LevelJourneyProps {
  levels: LevelData[];
  currentLevel: string;
  labels: {
    title: string;
    master: string;
    active: string;
    available: string;
    next: string;
    locked: string;
  };
}

export function LevelJourney(props: LevelJourneyProps) {
  const levelMap = new Map(props.levels.map((l) => [l.level, l]));
  const currentIndex = LEVEL_ORDER.indexOf(props.currentLevel as (typeof LEVEL_ORDER)[number]);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{props.labels.title}</h2>
      <div className={styles.journey}>
        {LEVEL_ORDER.map((lvl, i) => {
          const data = levelMap.get(lvl);
          const percent = data?.percent ?? 0;
          // Fast metric for the visible "X/Y" — falls back to mastered for
          // legacy API responses that don't yet carry learnedWords.
          // The denominator is the mastery target, not the raw DB count,
          // so the bar isn't dragged by enrichment-word inventory.
          const learned = data?.learnedWords ?? data?.masteredWords ?? 0;
          const total = data?.targetWords ?? data?.totalWords ?? 0;
          const isCurrent = lvl === props.currentLevel;

          // Status logic — previous levels are always at least "available"
          let status: string;
          let nodeState: 'mastered' | 'active' | 'available' | 'next' | 'locked';
          if (percent >= 100) {
            status = props.labels.master;
            nodeState = 'mastered';
          } else if (isCurrent) {
            status = props.labels.active;
            nodeState = 'active';
          } else if (percent > 0) {
            status = props.labels.active;
            nodeState = 'active';
          } else if (i < currentIndex) {
            // Previous level, no progress yet — accessible but not started
            status = props.labels.available;
            nodeState = 'available';
          } else if (i === currentIndex + 1) {
            status = props.labels.next;
            nodeState = 'next';
          } else {
            status = props.labels.locked;
            nodeState = 'locked';
          }

          return (
            <div key={lvl} className={styles.stage}>
              <LevelNode
                level={lvl}
                percent={percent}
                isCurrent={isCurrent}
                state={nodeState}
              />
              <div className={styles.stageInfo}>
                <span className={styles.stageStatus}>{status}</span>
                {nodeState !== 'locked' && (
                  <span className={styles.stageNumbers}>
                    {learned}/{total}
                  </span>
                )}
              </div>
              {i < LEVEL_ORDER.length - 1 && (
                <Connector
                  fromColor={LEVEL_COLORS[lvl]!}
                  toColor={LEVEL_COLORS[LEVEL_ORDER[i + 1]!]!}
                  filled={percent >= 100}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LevelNode({
  level,
  percent,
  isCurrent,
  state,
}: {
  level: string;
  percent: number;
  isCurrent: boolean;
  state: 'mastered' | 'active' | 'available' | 'next' | 'locked';
}) {
  const color = LEVEL_COLORS[level] ?? '#94a3b8';
  const size = 64;
  const strokeWidth = 4;
  const R = size / 2 - strokeWidth;
  const C = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(1, percent / 100)) * C;
  const isLocked = state === 'locked';
  const isMastered = state === 'mastered';
  const hasProgressRing = !isLocked && !isMastered && percent > 0;
  // Levels with no tracked progress (available / next) still show their
  // identity colour as a faint outline + coloured code, so the journey
  // reads as a coloured path rather than grey blanks. Only locked stays grey.
  const showFaintRing = !isLocked && !isMastered && percent === 0;

  return (
    <div
      className={`${styles.node} ${isCurrent ? styles.nodeCurrent : ''} ${isLocked ? styles.nodeLocked : ''}`}
      style={{ width: size, height: size, ...(isCurrent && ({ ['--node-color' as string]: color })) }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.nodeSvg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          fill="var(--color-bg-secondary)"
        />
        {hasProgressRing && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${filled.toFixed(1)} ${(C - filled).toFixed(1)}`}
            strokeLinecap="round"
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: 'rotate(-90deg)',
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.25,1,0.5,1)',
            }}
          />
        )}
        {isMastered && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.5"
          />
        )}
        {showFaintRing && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.32"
          />
        )}
      </svg>
      <div className={styles.nodeContent}>
        {isLocked ? (
          <Lock size={18} className={styles.nodeLockIcon} />
        ) : isMastered ? (
          <>
            <Check size={18} style={{ color, strokeWidth: 3 }} />
            <span className={styles.nodeLevelSmall} style={{ color }}>{level}</span>
          </>
        ) : (
          <>
            <span className={styles.nodeLevel} style={{ color }}>
              {level}
            </span>
            {percent > 0 && (
              <span className={styles.nodePercent}>{percent}%</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Connector({ fromColor, toColor, filled }: { fromColor: string; toColor: string; filled: boolean }) {
  return (
    <div className={styles.connectorWrap}>
      <div className={styles.connectorBg} />
      {filled && (
        <div
          className={styles.connectorFill}
          style={{ background: `linear-gradient(90deg, ${fromColor}, ${toColor})` }}
        />
      )}
    </div>
  );
}
