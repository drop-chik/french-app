import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wordsApi } from '../../features/words/api';
import { useI18n } from '../../shared/i18n';
import { FlashcardMode } from './FlashcardMode/FlashcardMode';
import { MultipleChoiceMode } from './MultipleChoiceMode/MultipleChoiceMode';
import { SpellingMode } from './SpellingMode/SpellingMode';
import { MatchingMode } from './MatchingMode/MatchingMode';
import { FillBlankMode } from './FillBlankMode/FillBlankMode';
import { SpeedRoundMode } from './SpeedRoundMode/SpeedRoundMode';
import { ContextBuilderMode } from './ContextBuilderMode/ContextBuilderMode';
import { ListeningRecallMode } from './ListeningRecallMode/ListeningRecallMode';
import { SessionComplete } from './SessionComplete/SessionComplete';
import type { SessionResult } from './FlashcardMode/FlashcardMode';
import styles from './VocabularyPage.module.css';

type ActiveMode =
  | 'menu'
  | 'flashcard'
  | 'multiple-choice'
  | 'spelling'
  | 'matching'
  | 'fill-blank'
  | 'speed-round'
  | 'context-builder'
  | 'listening-recall'
  | 'complete';

const MODE_IDS = [
  { id: 'flashcard', icon: '🃏', ready: true },
  { id: 'multiple-choice', icon: '✅', ready: true },
  { id: 'spelling', icon: '✏️', ready: true },
  { id: 'matching', icon: '🔗', ready: true },
  { id: 'fill-blank', icon: '📝', ready: true },
  { id: 'speed-round', icon: '⚡', ready: true },
  { id: 'context-builder', icon: '🧩', ready: true },
  { id: 'listening-recall', icon: '👂', ready: true },
] as const;

export function VocabularyPage() {
  const [activeMode, setActiveMode] = useState<ActiveMode>('menu');
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const { t, lang } = useI18n();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['words-session', lang],
    queryFn: () => wordsApi.getSession(),
    staleTime: 0,
  });

  const words = data?.words ?? [];

  function startMode(modeId: string) {
    setActiveMode(modeId as ActiveMode);
  }

  function handleComplete(results: SessionResult[]) {
    setSessionResults(results);
    setActiveMode('complete');
  }

  function handleRestart() {
    refetch();
    setActiveMode('menu');
  }

  if (activeMode === 'flashcard' && words.length > 0) {
    return <FlashcardMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'multiple-choice' && words.length > 0) {
    return <MultipleChoiceMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'spelling' && words.length > 0) {
    return <SpellingMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'matching' && words.length > 0) {
    return <MatchingMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'fill-blank' && words.length > 0) {
    return <FillBlankMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'speed-round' && words.length > 0) {
    return <SpeedRoundMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'context-builder' && words.length > 0) {
    return <ContextBuilderMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'listening-recall' && words.length > 0) {
    return <ListeningRecallMode words={words} onComplete={handleComplete} />;
  }
  if (activeMode === 'complete') {
    return (
      <SessionComplete
        results={sessionResults}
        onRestart={handleRestart}
        onBack={() => setActiveMode('menu')}
      />
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t.vocabulary.title}</h1>

      {isLoading && <p className={styles.loading}>{t.vocabulary.loading}</p>}
      {error && <p className={styles.error}>{t.vocabulary.errorLoad}</p>}

      {!isLoading && !error && (
        <p className={styles.subtitle}>
          {words.length > 0
            ? t.vocabulary.wordsToday.replace('{n}', String(words.length))
            : t.vocabulary.noWords}
        </p>
      )}

      <div className={styles.modes}>
        {MODE_IDS.map((mode) => {
          const modeT = t.vocabulary.modes[mode.id as keyof typeof t.vocabulary.modes];
          const isDisabled = !mode.ready || words.length === 0;
          return (
            <button
              key={mode.id}
              className={`${styles.modeCard} ${isDisabled ? styles.modeCardDisabled : ''}`}
              onClick={() => !isDisabled && startMode(mode.id)}
              disabled={isDisabled}
            >
              <span className={styles.modeIcon}>{mode.icon}</span>
              <span className={styles.modeName}>{modeT.name}</span>
              <span className={styles.modeDesc}>{modeT.description}</span>
              {!mode.ready && <span className={styles.soon}>{t.vocabulary.soon}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
