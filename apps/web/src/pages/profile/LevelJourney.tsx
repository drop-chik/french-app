import { Lock, Check } from 'lucide-react';
import { LEVEL_COLORS, LEVEL_ORDER } from './profile.constants';
import styles from './LevelJourney.module.css';

interface LevelData {
  level: string;
  masteredWords: number;
  totalWords: number;
  percent: number;
}

interface LevelJourneyProps {
  levels: LevelData[];
  currentLevel: string;
  labels: {
    title: string;
    master: string;
    active: string;
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
          const mastered = data?.masteredWords ?? 0;
          const total = data?.totalWords ?? 0;
          const isCurrent = lvl === props.currentLevel;
          const isPast = i < currentIndex;
          const isLocked = i > currentIndex;

          let status: string;
          if (percent >= 100) status = props.labels.master;
          else if (isCurrent) status = props.labels.active;
          else if (isPast) status = props.labels.master;
          else if (i === currentIndex + 1) status = props.labels.next;
          else status = props.labels.locked;

          return (
            <div key={lvl} className={styles.stage}>
              <LevelNode
                level={lvl}
                percent={percent}
                isCurrent={isCurrent}
                isLocked={isLocked}
                isPast={isPast || percent >= 100}
              />
              <div className={styles.stageInfo}>
                <span className={styles.stageStatus}>{status}</span>
                {!isLocked && (
                  <span className={styles.stageNumbers}>
                    {mastered}/{total}
                  </span>
                )}
              </div>
              {i < LEVEL_ORDER.length - 1 && (
                <Connector
                  fromColor={LEVEL_COLORS[lvl]!}
                  toColor={LEVEL_COLORS[LEVEL_ORDER[i + 1]!]!}
                  filled={isPast || percent >= 100}
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
  isLocked,
  isPast,
}: {
  level: string;
  percent: number;
  isCurrent: boolean;
  isLocked: boolean;
  isPast: boolean;
}) {
  const color = LEVEL_COLORS[level] ?? '#94a3b8';
  const size = isCurrent ? 96 : 64;
  const R = size / 2 - 6;
  const C = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(1, percent / 100)) * C;

  return (
    <div
      className={`${styles.node} ${isCurrent ? styles.nodeCurrent : ''} ${isLocked ? styles.nodeLocked : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.nodeSvg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          stroke="var(--color-border)"
          strokeWidth={isCurrent ? 6 : 4}
          fill="var(--color-bg-secondary)"
        />
        {!isLocked && percent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke={color}
            strokeWidth={isCurrent ? 6 : 4}
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
      </svg>
      <div className={styles.nodeContent}>
        {isLocked ? (
          <Lock size={isCurrent ? 22 : 16} className={styles.nodeLockIcon} />
        ) : isPast && !isCurrent ? (
          <>
            <Check size={isCurrent ? 22 : 16} style={{ color }} />
            <span className={styles.nodeLabel} style={{ color }}>{level}</span>
          </>
        ) : (
          <>
            <span
              className={styles.nodeLevel}
              style={{
                color,
                fontSize: isCurrent ? '20px' : '15px',
              }}
            >
              {level}
            </span>
            {isCurrent && (
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
