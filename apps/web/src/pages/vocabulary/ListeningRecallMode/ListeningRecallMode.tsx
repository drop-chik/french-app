import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { listeningApi } from '../../../features/listening/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './ListeningRecallMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

type CardState = 'idle' | 'playing' | 'answered' | 'revealed';

export function ListeningRecallMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [cardState, setCardState] = useState<CardState>('idle');
  const [results, setResults] = useState<SessionResult[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = words[index];

  // Build 4 options: 1 correct + 3 distractors from other words
  const buildOptions = useCallback(
    (word: WordData, allWords: WordData[]) => {
      const correct = word.translation;
      const pool = allWords
        .filter((w) => w.id !== word.id)
        .map((w) => w.translation)
        .filter((t) => t !== correct);

      // Shuffle pool and pick 3
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [...shuffled, correct].sort(() => Math.random() - 0.5);
      setOptions(opts);
    },
    [],
  );

  // Load TTS audio for current word
  const loadAudio = useCallback(async (word: WordData) => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setLoadingAudio(true);
    try {
      const blob = await listeningApi.generateTTS(word.french);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch {
      // TTS failed silently
    } finally {
      setLoadingAudio(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!current) return;
    setSelected(null);
    setCardState('idle');
    buildOptions(current, words);
    loadAudio(current);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play when audio is ready
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCardState('playing');
    audio.play().catch(() => null);
    audio.onended = () => setCardState('idle');
    return () => { audio.pause(); };
  }, [audioUrl]);

  const playAudio = () => {
    if (!audioUrl || loadingAudio) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCardState('playing');
    audio.play().catch(() => null);
    audio.onended = () => setCardState('idle');
  };

  const handleSelect = async (opt: string) => {
    if (cardState === 'answered' || cardState === 'revealed' || !current) return;

    setSelected(opt);
    setCardState('answered');

    const isCorrect = opt === current.translation;
    const grade = isCorrect ? 5 : 1;

    try {
      await wordsApi.recordAnswer(current.id, grade);
    } catch {
      // ignore
    }

    setResults((prev) => [...prev, { wordId: current.id, grade }]);
  };

  const handleNext = () => {
    if (index + 1 >= words.length) {
      onComplete(results);
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (!current) {
    onComplete(results);
    return null;
  }

  const isAnswered = cardState === 'answered';

  return (
    <div className={styles.page}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((index + 1) / words.length) * 100}%` }}
        />
      </div>
      <p className={styles.counter}>{index + 1} / {words.length}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Audio button */}
          <div className={styles.audioSection}>
            <button
              className={`${styles.playBtn} ${cardState === 'playing' ? styles.playBtnActive : ''}`}
              onClick={playAudio}
              disabled={loadingAudio || cardState === 'playing'}
            >
              {loadingAudio ? (
                <span className={styles.spinner} />
              ) : cardState === 'playing' ? (
                <VolumeX size={32} />
              ) : (
                <Volume2 size={32} />
              )}
            </button>
            <p className={styles.hint}>
              {loadingAudio ? t.listeningRecall.loadingAudio : t.listeningRecall.tapToListen}
            </p>
            {isAnswered && (
              <p className={styles.revealedWord}>{current.french}</p>
            )}
          </div>

          {/* Options */}
          <div className={styles.options}>
            {options.map((opt) => {
              let cls = styles.option;
              if (isAnswered) {
                if (opt === current.translation) cls += ` ${styles.optionCorrect}`;
                else if (opt === selected) cls += ` ${styles.optionWrong}`;
              } else if (opt === selected) {
                cls += ` ${styles.optionSelected}`;
              }
              return (
                <button
                  key={opt}
                  className={cls}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.feedback}
            >
              <p className={selected === current.translation ? styles.feedbackCorrect : styles.feedbackWrong}>
                {selected === current.translation ? t.listeningRecall.correct : `${t.listeningRecall.correctAnswer} ${current.translation}`}
              </p>
              <button className={styles.nextBtn} onClick={handleNext}>
                {index + 1 >= words.length ? t.listeningRecall.finish : t.listeningRecall.next}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
