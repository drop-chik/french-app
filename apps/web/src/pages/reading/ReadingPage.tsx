import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Clock, CheckCircle2, ChevronRight, BookOpen, Timer } from 'lucide-react';
import { readingApi, type ReadingTextSummary } from '../../features/reading/api';
import { useI18n } from '../../shared/i18n';
import { MockTab } from './MockTab';
import styles from './ReadingPage.module.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#f97316',
  B2: '#a855f7',
  C1: '#ec4899',
  C2: '#ef4444',
};

type Tab = 'library' | 'mock';

export function ReadingPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('library');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.reading.title}</h1>
        <p className={styles.subtitle}>{t.reading.subtitle}</p>
      </div>

      <div className={styles.hubTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'library'}
          className={`${styles.hubTab} ${activeTab === 'library' ? styles.hubTabActive : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <BookOpen size={16} /> {t.reading.tabLibrary}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'mock'}
          className={`${styles.hubTab} ${activeTab === 'mock' ? styles.hubTabActive : ''}`}
          onClick={() => setActiveTab('mock')}
        >
          <Timer size={16} /> {t.reading.tabMock}
        </button>
      </div>

      {activeTab === 'library' ? <LibraryTab /> : <MockTab />}
    </div>
  );
}

function LibraryTab() {
  const { t } = useI18n();
  const [activeLevel, setActiveLevel] = useState<string>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reading-texts', activeLevel],
    queryFn: () => readingApi.getTexts(activeLevel === 'all' ? undefined : activeLevel),
    staleTime: 5 * 60 * 1000,
  });

  const texts = data?.texts ?? [];

  return (
    <>
      {/* Level filter */}
      <div className={styles.levelTabs}>
        <button
          className={`${styles.levelTab} ${activeLevel === 'all' ? styles.levelTabActive : ''}`}
          onClick={() => setActiveLevel('all')}
        >
          {t.reading.allLevels}
        </button>
        {LEVELS.map((lv) => (
          <button
            key={lv}
            className={`${styles.levelTab} ${activeLevel === lv ? styles.levelTabActive : ''}`}
            style={activeLevel === lv ? { borderColor: LEVEL_COLORS[lv], color: LEVEL_COLORS[lv] } : {}}
            onClick={() => setActiveLevel(lv)}
          >
            {lv}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.skeletons}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {isError && (
        <p className={styles.error}>{t.common.error}</p>
      )}

      {!isLoading && !isError && texts.length === 0 && (
        <p className={styles.empty}>{t.reading.empty}</p>
      )}

      {!isLoading && !isError && texts.length > 0 && (
        <div className={styles.textGrid}>
          {texts.map((text) => (
            <TextCard key={text.id} text={text} />
          ))}
        </div>
      )}
    </>
  );
}

function TextCard({ text }: { text: ReadingTextSummary }) {
  const { t } = useI18n();
  const color = LEVEL_COLORS[text.level] ?? '#6b7280';
  const topicLabel = (t.reading.topics as Record<string, string>)[text.topic] ?? text.topic;

  return (
    <Link to="/reading/$slug" params={{ slug: text.slug }} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardLevel} style={{ color, borderColor: color }}>
          {text.level}
        </span>
        {text.completed && (
          <span className={styles.cardDone}>
            <CheckCircle2 size={14} />
            {text.score !== null && text.totalQuestions !== null
              ? `${text.score}/${text.totalQuestions}`
              : '✓'}
          </span>
        )}
      </div>
      <h3 className={styles.cardTitle}>{text.title}</h3>
      <span className={styles.cardTopic}>{topicLabel}</span>
      <div className={styles.cardMeta}>
        <span className={styles.cardTime}>
          <Clock size={13} />
          {t.reading.minutes.replace('{n}', String(text.estimatedMinutes))}
        </span>
        <ChevronRight size={16} className={styles.cardArrow} />
      </div>
    </Link>
  );
}
