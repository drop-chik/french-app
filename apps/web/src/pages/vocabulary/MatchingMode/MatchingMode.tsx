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
  // IDs of the 1–2 cards currently face-up (not yet matched)
  const [flipped, setFlipped] = useState<string[]>([]);
  // Prevent clicks while evaluating a pair
  const [locked, setLocked] = useState(false);
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [correct, setCorrect] = useState<[string, string] | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});

  const totalRounds = Math.ceil(words.length / BATCH);
  const roundWords = words.slice(roundIndex * BATCH, (roundIndex + 1) * BATCH);

  useEffect(() => {
    setCards(buildCards(roundWords));
    setMatched(new Set());
    setFlipped([]);
    setLocked(false);
    setWrong(null);
    setCorrect(null);
    setWrongCounts({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  const handleSelect = useCallback(
    (card: Card) => {
      if (locked) return;
      if (matched.has(card.wordId)) return;
      if (flipped.includes(card.id)) return; // already open

      const newFlipped = [...flipped, card.id];
      setFlipped(newFlipped);

      // First card — just reveal it, wait for second
      if (newFlipped.length < 2) return;

      // Two cards face-up — evaluate the pair
      setLocked(true);
      const [id1, id2] = newFlipped as [string, string];
      const c1 = cards.find((c) => c.id === id1)!;
      const c2 = cards.find((c) => c.id === id2)!;
      const isMatch = c1.wordId === c2.wordId && c1.type !== c2.type;

      if (isMatch) {
        setCorrect([id1, id2]);
        const newMatched = new Set([...matched, c1.wordId]);
        const hadErrors = (wrongCounts[c1.wordId] ?? 0) > 0;
        const grade = hadErrors ? 3 : 5;
        wordsApi.recordAnswer(c1.wordId, grade).catch(console.error);
        const newResults = [...results, { wordId: c1.wordId, grade }];
        setResults(newResults);
        setTimeout(() => {
          setMatched(newMatched);
          setCorrect(null);
          setFlipped([]);
          setLocked(false);
          if (newMatched.size === roundWords.length) {
            setTimeout(() => {
              if (roundIndex + 1 >= totalRounds) onComplete(newResults);
              else setRoundIndex((r) => r + 1);
            }, 400);
          }
        }, 700);
      } else {
        setWrong([id1, id2]);
        setWrongCounts((prev) => ({
          ...prev,
          [c1.wordId]: (prev[c1.wordId] ?? 0) + 1,
          [c2.wordId]: (prev[c2.wordId] ?? 0) + 1,
        }));
        // Flip both back face-down after a pause
        setTimeout(() => {
          setFlipped([]);
          setWrong(null);
          setLocked(false);
        }, 950);
      }
    },
    [locked, matched, flipped, cards, wrongCounts, results, roundWords.length, roundIndex, totalRounds, onComplete],
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
          const isFaceUp = flipped.includes(card.id) || isMatched;
          const isWrong = wrong?.includes(card.id);
          const isCorrect = correct?.includes(card.id);

          return (
            <motion.button
              key={card.id}
              className={`${styles.card}
                ${!isFaceUp ? styles.cardBack : ''}
                ${isFaceUp && !isCorrect && !isWrong
                  ? (card.type === 'french' ? styles.cardFrench : styles.cardTranslation)
                  : ''}
                ${isWrong ? styles.cardWrong : ''}
                ${isCorrect ? styles.cardCorrect : ''}
              `}
              onClick={() => handleSelect(card)}
              animate={{ opacity: isMatched ? 0 : 1, scale: isMatched ? 0.85 : 1 }}
              transition={{ duration: isMatched ? 0.35 : 0.15 }}
              whileHover={locked || isMatched ? {} : { scale: 1.04 }}
              whileTap={locked || isMatched ? {} : { scale: 0.96 }}
              style={{ pointerEvents: isMatched || locked && !isFaceUp ? 'none' : 'auto' }}
            >
              {isFaceUp
                ? <span className={styles.cardText}>{card.text}</span>
                : <span className={styles.cardBackMark}>?</span>
              }
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
