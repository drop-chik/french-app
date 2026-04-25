import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { useI18n } from '../../../shared/i18n';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './MatchingMode.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

interface Card {
  id: string;
  wordId: string;
  text: string;
  type: 'french' | 'translation';
}

const BATCH = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildCards(words: WordData[]): Card[] {
  const cards: Card[] = [];
  for (const w of words) {
    cards.push({ id: `fr-${w.id}`, wordId: w.id, text: w.french, type: 'french' });
    cards.push({ id: `tr-${w.id}`, wordId: w.id, text: w.translation, type: 'translation' });
  }
  return shuffle(cards);
}

export function MatchingMode({ words, onComplete }: Props) {
  const { t } = useI18n();
  const [roundIndex, setRoundIndex] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Card | null>(null);
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [correct, setCorrect] = useState<[string, string] | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  // Track wrong attempts per wordId to give honest SRS grade
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});

  const totalRounds = Math.ceil(words.length / BATCH);
  const roundWords = words.slice(roundIndex * BATCH, (roundIndex + 1) * BATCH);

  useEffect(() => {
    setCards(buildCards(roundWords));
    setMatched(new Set());
    setSelected(null);
    setWrong(null);
    setCorrect(null);
    setWrongCounts({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  const handleSelect = useCallback(
    (card: Card) => {
      if (matched.has(card.wordId)) return;
      if (wrong || correct) return;
      if (selected?.id === card.id) { setSelected(null); return; }
      if (!selected) { setSelected(card); return; }

      const isMatch = selected.wordId === card.wordId && selected.type !== card.type;
      if (isMatch) {
        setCorrect([selected.id, card.id]);
        const newMatched = new Set([...matched, card.wordId]);
        // Grade 5 if matched without any prior mistakes, grade 3 if had mistakes
        const hadErrors = (wrongCounts[card.wordId] ?? 0) > 0;
        const grade = hadErrors ? 3 : 5;
        wordsApi.recordAnswer(card.wordId, grade).catch(console.error);
        const newResults = [...results, { wordId: card.wordId, grade }];
        setResults(newResults);
        setTimeout(() => {
          setMatched(newMatched);
          setCorrect(null);
          setSelected(null);
          if (newMatched.size === roundWords.length) {
            setTimeout(() => {
              if (roundIndex + 1 >= totalRounds) onComplete(newResults);
              else setRoundIndex((r) => r + 1);
            }, 400);
          }
        }, 600);
      } else {
        // Wrong match — only visual feedback, no SRS recording
        setWrong([selected.id, card.id]);
        setWrongCounts((prev) => ({
          ...prev,
          [selected.wordId]: (prev[selected.wordId] ?? 0) + 1,
          [card.wordId]: (prev[card.wordId] ?? 0) + 1,
        }));
        setTimeout(() => { setWrong(null); setSelected(null); }, 800);
      }
    },
    [matched, selected, wrong, correct, results, wrongCounts, roundWords.length, roundIndex, totalRounds, onComplete],
  );

  const progress = ((roundIndex * BATCH + matched.size) / words.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.header}>
        <span className={styles.counter}>{t.matching.round} {roundIndex + 1} / {totalRounds}</span>
        <span className={styles.hint}>{t.matching.hint}</span>
      </div>

      <div className={styles.grid}>
        {cards.map((card) => {
          const isMatched = matched.has(card.wordId);
          const isSelected = selected?.id === card.id;
          const isWrong = wrong?.includes(card.id);
          const isCorrect = correct?.includes(card.id);
          if (isMatched) {
            return <div key={card.id} className={styles.cardPlaceholder} />;
          }
          return (
            <motion.button
              key={card.id}
              className={`${styles.card}
                ${isSelected ? styles.cardSelected : ''}
                ${isWrong ? styles.cardWrong : ''}
                ${isCorrect ? styles.cardCorrect : ''}
                ${card.type === 'french' ? styles.cardFrench : styles.cardTranslation}
              `}
              onClick={() => handleSelect(card)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {card.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
