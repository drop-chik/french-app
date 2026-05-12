import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowRight, Check, X as XIcon } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { listeningApi } from '../../../features/listening/api';
import { useI18n } from '../../../shared/i18n';
import type { Translations } from '../../../shared/i18n/ru';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './SmartLearnFlow.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

// Per-word study stages — each stage is a separate "card" in the session.
// Progression rules:
//   new      → intro → mc → spelling
//   learning → mc → spelling
//   review   → spelling
//   mastered → speed (rare; smart session doesn't usually include mastered)
type Stage = 'intro' | 'mc' | 'spelling' | 'speed';

interface StudyItem {
  word: WordData;
  stage: Stage;
}

// Accent / case insensitive comparison for typing answers
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function stagesFor(word: WordData): Stage[] {
  const status = word.progress?.status ?? 'new';
  if (status === 'new') return ['intro', 'mc', 'spelling'];
  if (status === 'learning') return ['mc', 'spelling'];
  if (status === 'review') return ['spelling'];
  if (status === 'mastered') return ['speed'];
  return ['mc'];
}

// Round-robin interleave: take one stage at a time from each word's queue.
// Result: same word's stages are at least N-1 items apart (where N = words.length).
function interleave(words: WordData[]): StudyItem[] {
  const queues = words.map((w) => ({ word: w, stages: stagesFor(w) }));
  const out: StudyItem[] = [];
  let progressing = true;
  while (progressing) {
    progressing = false;
    for (const q of queues) {
      const next = q.stages.shift();
      if (next) {
        out.push({ word: q.word, stage: next });
        progressing = true;
      }
    }
  }
  return out;
}

// One audio cache per session — TTS calls are paid, dedupe across stages.
const audioCache = new Map<string, string>();
async function playAudio(text: string, audioUrl?: string | null) {
  if (audioUrl) {
    new Audio(audioUrl).play().catch(() => null);
    return;
  }
  let url = audioCache.get(text);
  if (!url) {
    try {
      const blob = await listeningApi.generateTTS(text);
      url = URL.createObjectURL(blob);
      audioCache.set(text, url);
    } catch {
      return;
    }
  }
  new Audio(url).play().catch(() => null);
}

export function SmartLearnFlow({ words, onComplete }: Props) {
  const { t } = useI18n();

  const items = useMemo(() => interleave(words), [words]);
  const [index, setIndex] = useState(0);
  // Per-word correct/wrong tally — final SRS grade is derived from the
  // share of correct stages.
  const tallyRef = useRef<Map<string, { ok: number; bad: number; total: number }>>(new Map());

  const current = items[index];

  // Auto-play TTS when a new card appears. Browsers gate autoplay behind a
  // gesture but by the time the user is in a session they've clicked through.
  // We delay 200ms so the slide-in animation doesn't fight the audio.
  useEffect(() => {
    if (!current) return;
    const w = current.word;
    const timer = setTimeout(() => { void playAudio(w.french, w.audioUrl); }, 200);
    return () => clearTimeout(timer);
  }, [current?.word.id, current?.stage]);

  const finishSession = useCallback(() => {
    // Convert per-word tally into SRS grades and report back to the parent.
    // Grade rules:
    //   - all correct → 5 (perfect recall)
    //   - majority correct → 4
    //   - half-and-half → 3
    //   - mostly wrong → 2
    //   - all wrong → 1
    const results: SessionResult[] = [];
    for (const [wordId, t] of tallyRef.current.entries()) {
      if (t.total === 0) continue;
      const ratio = t.ok / t.total;
      let grade = 3;
      if (ratio === 1) grade = 5;
      else if (ratio >= 0.6) grade = 4;
      else if (ratio >= 0.4) grade = 3;
      else if (ratio > 0) grade = 2;
      else grade = 1;
      results.push({ wordId, grade });
      // Persist the answer to the SRS engine
      wordsApi.recordAnswer(wordId, grade).catch(console.error);
    }
    onComplete(results);
  }, [onComplete]);

  const recordStageResult = useCallback((wordId: string, correct: boolean) => {
    const prev = tallyRef.current.get(wordId) ?? { ok: 0, bad: 0, total: 0 };
    tallyRef.current.set(wordId, {
      ok: prev.ok + (correct ? 1 : 0),
      bad: prev.bad + (correct ? 0 : 1),
      total: prev.total + 1,
    });
  }, []);

  const advance = useCallback(() => {
    if (index + 1 >= items.length) {
      finishSession();
      return;
    }
    setIndex((i) => i + 1);
  }, [index, items.length, finishSession]);

  if (!current) return null;

  const progress = ((index) / items.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.counter}>
        {index + 1} / {items.length}
        <span className={styles.stageBadge}>{stageLabel(current.stage, t)}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.word.id}-${current.stage}-${index}`}
          className={styles.stageWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {current.stage === 'intro' && (
            <IntroStage
              word={current.word}
              onAdvance={() => { recordStageResult(current.word.id, true); advance(); }}
            />
          )}
          {current.stage === 'mc' && (
            <MCStage
              word={current.word}
              onAdvance={(correct) => { recordStageResult(current.word.id, correct); advance(); }}
            />
          )}
          {current.stage === 'spelling' && (
            <SpellingStage
              word={current.word}
              onAdvance={(correct) => { recordStageResult(current.word.id, correct); advance(); }}
            />
          )}
          {current.stage === 'speed' && (
            <SpeedStage
              word={current.word}
              onAdvance={(correct) => { recordStageResult(current.word.id, correct); advance(); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function stageLabel(stage: Stage, t: Translations): string {
  if (stage === 'intro') return t.learn.stageIntro;
  if (stage === 'mc') return t.learn.stageRecognise;
  if (stage === 'spelling') return t.learn.stageWrite;
  return t.learn.stageQuick;
}

/* ═══════════════════════════════════════════════
   Stage components — local to this file.
═══════════════════════════════════════════════ */

function AudioBtn({ word }: { word: WordData }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={styles.audioBtn}
      onClick={async () => {
        setBusy(true);
        await playAudio(word.french, word.audioUrl);
        setBusy(false);
      }}
      disabled={busy}
      aria-label="play"
    >
      <Volume2 size={18} />
    </button>
  );
}

/* ── Intro: first encounter, both sides visible. No grading — just absorb ── */

function IntroStage({ word, onAdvance }: { word: WordData; onAdvance: () => void }) {
  const { t } = useI18n();
  return (
    <div className={`${styles.card} ${styles.cardIntro}`}>
      <div className={styles.introBadge}>{t.learn.newWord}</div>
      <AudioBtn word={word} />
      <h2 className={styles.bigFrench}>{word.french}</h2>
      {(word.partOfSpeech || word.gender) && (
        <p className={styles.posLine}>
          {word.partOfSpeech}
          {word.gender ? ` · ${word.gender === 'm' ? 'm.' : 'f.'}` : ''}
        </p>
      )}
      <p className={styles.bigTranslation}>{word.translation}</p>
      {word.exampleFr && (
        <div className={styles.exampleBlock}>
          <p className={styles.exampleFr}>«{word.exampleFr}»</p>
          {word.exampleRu && <p className={styles.exampleRu}>{word.exampleRu}</p>}
        </div>
      )}
      <button type="button" className={styles.btnPrimary} onClick={onAdvance}>
        {t.learn.gotIt} <ArrowRight size={18} />
      </button>
    </div>
  );
}

/* ── Multiple-Choice: recognition test ── */

function MCStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<string[] | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number>(-1);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { distractors } = await wordsApi.getDistractors(word.id);
        const wrong = distractors.map((d) => d.translation).filter((x) => x !== word.translation).slice(0, 3);
        const all = [...wrong, word.translation];
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j]!, all[i]!];
        }
        if (!cancelled) {
          setOptions(all);
          setCorrectIndex(all.indexOf(word.translation));
        }
      } catch {
        if (!cancelled) {
          setOptions([word.translation, '—', '—', '—']);
          setCorrectIndex(0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [word.id, word.translation]);

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === correctIndex;
    // Brief delay so user sees the result colour, then advance
    setTimeout(() => onAdvance(correct), correct ? 700 : 1500);
  };

  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{t.learn.pickTranslation}</p>
      <div className={styles.mcHeader}>
        <h2 className={styles.bigFrench}>{word.french}</h2>
        <AudioBtn word={word} />
      </div>
      {!options ? (
        <div className={styles.optionsLoading}>...</div>
      ) : (
        <div className={styles.options}>
          {options.map((opt, i) => {
            const isCorrect = i === correctIndex;
            const isPicked = selected === i;
            const cls = [styles.option];
            if (selected !== null) {
              if (isCorrect) cls.push(styles.optionCorrect);
              else if (isPicked) cls.push(styles.optionWrong);
            }
            return (
              <button
                key={opt + i}
                type="button"
                className={cls.join(' ')}
                onClick={() => choose(i)}
                disabled={selected !== null}
              >
                {opt}
                {selected !== null && isCorrect && <Check size={16} className={styles.optionIcon} />}
                {selected !== null && isPicked && !isCorrect && <XIcon size={16} className={styles.optionIcon} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Spelling: production — type the French given the translation ── */

function SpellingStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'input' | 'correct' | 'wrong'>('input');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== 'input') return;
    const correct = normalize(value) === normalize(word.french);
    setState(correct ? 'correct' : 'wrong');
    setTimeout(() => onAdvance(correct), correct ? 700 : 2200);
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <p className={styles.cardLabel}>{t.learn.typeFrench}</p>
      <p className={styles.spellingPrompt}>{word.translation}</p>
      {word.exampleRu && <p className={styles.exampleRu}>{word.exampleRu}</p>}
      <div className={styles.mcHeader}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={state !== 'input'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`${styles.spellingInput} ${state === 'correct' ? styles.spellingInputOk : ''} ${state === 'wrong' ? styles.spellingInputBad : ''}`}
          placeholder="..."
        />
        <AudioBtn word={word} />
      </div>
      {state === 'wrong' && (
        <p className={styles.spellingCorrectAnswer}>
          {t.learn.correctAnswer} <strong>{word.french}</strong>
        </p>
      )}
      {state === 'input' && (
        <button type="submit" className={styles.btnPrimary} disabled={value.trim().length === 0}>
          {t.learn.check}
        </button>
      )}
    </form>
  );
}

/* ── Speed: binary Knew / Didn't know for mastered words ── */

function SpeedStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{t.learn.quickCheck}</p>
      <div className={styles.mcHeader}>
        <h2 className={styles.bigFrench}>{word.french}</h2>
        <AudioBtn word={word} />
      </div>
      <p className={styles.bigTranslation}>{word.translation}</p>
      <div className={styles.speedActions}>
        <button type="button" className={styles.btnWrong} onClick={() => onAdvance(false)}>
          <XIcon size={16} /> {t.learn.didntKnow}
        </button>
        <button type="button" className={styles.btnOk} onClick={() => onAdvance(true)}>
          <Check size={16} /> {t.learn.knew}
        </button>
      </div>
    </div>
  );
}
