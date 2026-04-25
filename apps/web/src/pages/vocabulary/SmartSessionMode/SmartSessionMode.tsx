import { useState, useMemo } from 'react';
import type { WordData } from '../../../features/words/api';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import { FlashcardMode } from '../FlashcardMode/FlashcardMode';
import { MultipleChoiceMode } from '../MultipleChoiceMode/MultipleChoiceMode';
import { SpellingMode } from '../SpellingMode/SpellingMode';
import { SpeedRoundMode } from '../SpeedRoundMode/SpeedRoundMode';
import { useI18n } from '../../../shared/i18n';
import styles from './SmartSessionMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

type PhaseName = 'flashcard' | 'multiple-choice' | 'spelling' | 'speed-round';

interface Phase {
  mode: PhaseName;
  words: WordData[];
}

function buildPhases(words: WordData[]): Phase[] {
  const newWords = words.filter((w) => !w.progress || w.progress.status === 'new');
  const learningWords = words.filter((w) => w.progress?.status === 'learning');
  const reviewWords = words.filter((w) => w.progress?.status === 'review');
  const masteredWords = words.filter((w) => w.progress?.status === 'mastered');

  const phases: Phase[] = [];
  if (newWords.length > 0) phases.push({ mode: 'flashcard', words: newWords });
  if (learningWords.length > 0) phases.push({ mode: 'multiple-choice', words: learningWords });
  if (reviewWords.length > 0) phases.push({ mode: 'spelling', words: reviewWords });
  if (masteredWords.length > 0) phases.push({ mode: 'speed-round', words: masteredWords });

  // Если все слова новые — добавим ещё MultipleChoice для закрепления
  if (phases.length === 1 && phases[0]?.mode === 'flashcard' && newWords.length >= 2) {
    phases.push({ mode: 'multiple-choice', words: newWords });
  }

  // Fallback: если ни одна фаза не собралась — просто Flashcard со всеми
  if (phases.length === 0) {
    phases.push({ mode: 'flashcard', words });
  }

  return phases;
}

export function SmartSessionMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const phases = useMemo(() => buildPhases(words), [words]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [allResults, setAllResults] = useState<SessionResult[]>([]);

  const currentPhase = phases[phaseIndex];
  if (!currentPhase) return null;

  const totalPhases = phases.length;
  const phaseLabel = t.vocabulary.smartPhase
    ?.replace('{phase}', String(phaseIndex + 1))
    ?.replace('{total}', String(totalPhases));
  const phaseName = t.vocabulary.phaseNames?.[currentPhase.mode] ?? currentPhase.mode;

  function handlePhaseComplete(results: SessionResult[]) {
    const merged = [...allResults, ...results];
    const nextIndex = phaseIndex + 1;
    if (nextIndex >= phases.length) {
      onComplete(merged);
    } else {
      setAllResults(merged);
      setPhaseIndex(nextIndex);
    }
  }

  return (
    <div className={styles.wrapper}>
      {totalPhases > 1 && (
        <div className={styles.phaseBar}>
          <span className={styles.phaseLabel}>{phaseLabel}</span>
          <span className={styles.phaseName}>{phaseName}</span>
          <div className={styles.phaseDots}>
            {phases.map((_, i) => (
              <div
                key={i}
                className={`${styles.phaseDot} ${i < phaseIndex ? styles.phaseDotDone : ''} ${i === phaseIndex ? styles.phaseDotActive : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {currentPhase.mode === 'flashcard' && (
        <FlashcardMode words={currentPhase.words} onComplete={handlePhaseComplete} />
      )}
      {currentPhase.mode === 'multiple-choice' && (
        <MultipleChoiceMode words={currentPhase.words} onComplete={handlePhaseComplete} />
      )}
      {currentPhase.mode === 'spelling' && (
        <SpellingMode words={currentPhase.words} onComplete={handlePhaseComplete} />
      )}
      {currentPhase.mode === 'speed-round' && (
        <SpeedRoundMode words={currentPhase.words} onComplete={handlePhaseComplete} />
      )}
    </div>
  );
}
