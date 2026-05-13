// AdaptiveLearnFlow — научно обоснованный режим изучения новых слов.
//
// Опирается на пять механизмов из research-литературы по L2 vocabulary:
//   1. Spacing effect (Bjork, Cepeda) — растущие интервалы между встречами
//      одного и того же слова ВНУТРИ сессии. Старый SmartLearnFlow делал
//      простой round-robin (interleaving первого уровня) без растущих гэпов.
//   2. Pimsleur graduated interval recall (1967) — после успешной retrieval
//      следующий возврат к слову растягивается. Здесь масштаб подгоняется
//      под 5-10 мин сессию: 1 → 3 → 5 шагов.
//   3. Generation effect (Slamecka & Graf) — production > recognition. Стадии
//      идут с растущей трудностью: показать → выбрать → впечатать в контексте
//      → набрать с нуля.
//   4. Multi-format encoding (Nation) — три измерения знания слова: форма,
//      значение, использование. Каждая стадия закрывает своё.
//   5. Errorful learning + immediate feedback (Kornell & Bjork) — ошибки
//      нормальны, но обязательны fallback на предыдущий бокс и быстрая
//      пересдача.
//
// Каждое слово в сессии движется по 5 «боксам»:
//   box 0 = Intro       (видишь FR + RU + пример + аудио, БЕЗ теста)
//   box 1 = Recognise   (4-option MC: выбрать перевод)
//   box 2 = Cloze       (предложение с пропуском, впечатать слово)
//   box 3 = Spell       (только перевод, набрать слово полностью)
//   box 4 = graduated   (готово к финальному speed-mix)
//
// После успеха в box K: dueStep = currentStep + GAP[K]
// После ошибки: box K → K-1 (откат), dueStep = currentStep + 1 (быстрый retry)
//
// Когда все слова в box 4 → запускается финальный SpeedMix:
// все слова сессии в случайном порядке, аудио + перевод → знаю / не знаю.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowRight, Check, X as XIcon, Sparkles } from 'lucide-react';
import type { WordData } from '../../../features/words/api';
import { wordsApi } from '../../../features/words/api';
import { listeningApi } from '../../../features/listening/api';
import { useI18n } from '../../../shared/i18n';
import type { Translations } from '../../../shared/i18n/ru';
import type { SessionResult } from '../FlashcardMode/FlashcardMode';
import styles from './AdaptiveLearnFlow.module.css';

interface Props {
  words: WordData[];
  onComplete: (results: SessionResult[]) => void;
}

type Box = 0 | 1 | 2 | 3 | 4;
type Stage = 'intro' | 'mc' | 'cloze' | 'spell' | 'speedmix';

interface WordState {
  word: WordData;
  box: Box;
  dueStep: number;
  mistakes: number;
  encounters: number;
}

// Gaps after a successful stage. Adapted from Pimsleur (1967), scaled for
// a 5-10 min in-app session. The numbers are measured in "queue steps" —
// at ~10 sec per step they translate to roughly 10s / 30s / 50s real time.
const GAP_AFTER_BOX: Record<Box, number> = {
  0: 1, // after Intro, MC comes after 1 other word
  1: 3, // after MC ok, Cloze comes after 3 others
  2: 5, // after Cloze ok, Spell comes after 5 others
  3: 8, // after Spell ok, word is graduated; gap > total session, won't reappear
  4: 999,
};

// Starting box depends on the user's existing SRS state for the word.
// Words at "review" or "mastered" already have form-meaning links — they
// don't need Intro, can skip directly to recall stages.
function initialBox(word: WordData): Box {
  const status = word.progress?.status ?? 'new';
  if (status === 'new') return 0;
  if (status === 'learning') return 1; // skip Intro, start at MC
  if (status === 'review') return 2;   // skip MC too, start at Cloze
  if (status === 'mastered') return 3; // only Spell as quick check
  return 0;
}

function stageFor(box: Box): Stage {
  switch (box) {
    case 0: return 'intro';
    case 1: return 'mc';
    case 2: return 'cloze';
    case 3: return 'spell';
    case 4: return 'speedmix';
  }
}

// Accent / case insensitive comparison for typing answers.
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

// Find the target word's position in the example sentence. The example may
// contain an inflected form (e.g., 'quotidien' word but 'quotidienne' in
// the example) — we try the exact form first, then a prefix-match heuristic.
function findWordInExample(fr: string, example: string): { start: number; end: number } | null {
  const lcEx = example.toLowerCase();
  const lcFr = fr.toLowerCase();
  let pos = lcEx.indexOf(lcFr);
  if (pos !== -1) return { start: pos, end: pos + lcFr.length };
  // Try prefix (4+ chars) — covers most simple inflections
  if (lcFr.length >= 4) {
    const stem = lcFr.slice(0, lcFr.length - 1);
    const stemPos = lcEx.indexOf(stem);
    if (stemPos !== -1) {
      // Extend to end of the word (alnum + accented)
      let end = stemPos + stem.length;
      while (end < example.length && /[\p{L}'\-]/u.test(example[end] ?? '')) end++;
      return { start: stemPos, end };
    }
  }
  return null;
}

// One audio cache per session.
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

export function AdaptiveLearnFlow({ words, onComplete }: Props) {
  const { t } = useI18n();

  // Persistent session state — array of word boxes. We mutate via setState
  // by reconstructing; useRef tracks the latest snapshot for callbacks.
  const [states, setStates] = useState<WordState[]>(() =>
    words.map((w, i) => ({
      word: w,
      box: initialBox(w),
      dueStep: i, // initial order = textual position
      mistakes: 0,
      encounters: 0,
    })),
  );
  const [step, setStep] = useState(0);
  // After all words reach box 4, we run the final speed-mix.
  const [speedMixQueue, setSpeedMixQueue] = useState<WordData[] | null>(null);
  const [speedIndex, setSpeedIndex] = useState(0);
  // Per-word tally for final SRS grade.
  const tallyRef = useRef<Map<string, { ok: number; bad: number; total: number }>>(new Map());

  // Pick the next eligible word: the one with the lowest dueStep ≤ current
  // step, ties broken by lowest box (so Intros get priority over MCs).
  const current = useMemo(() => {
    const eligible = states
      .filter((s) => s.box < 4 && s.dueStep <= step)
      .sort((a, b) => a.dueStep - b.dueStep || a.box - b.box);
    if (eligible.length > 0) return eligible[0]!;
    // No one due yet — pick the closest one due in the future
    const all = states.filter((s) => s.box < 4).sort((a, b) => a.dueStep - b.dueStep);
    return all[0] ?? null;
  }, [states, step]);

  // Once everyone graduates to box 4, build the speed-mix queue and run it.
  const allGraduated = states.every((s) => s.box >= 4);

  useEffect(() => {
    if (allGraduated && !speedMixQueue) {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setSpeedMixQueue(shuffled);
    }
  }, [allGraduated, speedMixQueue, words]);

  // Pre-play audio when a new card appears.
  useEffect(() => {
    const w = current?.word;
    if (!w || speedMixQueue) return;
    const timer = setTimeout(() => { void playAudio(w.french, w.audioUrl); }, 200);
    return () => clearTimeout(timer);
  }, [current?.word.id, current?.box, speedMixQueue]);

  const recordStageResult = useCallback((wordId: string, correct: boolean) => {
    const prev = tallyRef.current.get(wordId) ?? { ok: 0, bad: 0, total: 0 };
    tallyRef.current.set(wordId, {
      ok: prev.ok + (correct ? 1 : 0),
      bad: prev.bad + (correct ? 0 : 1),
      total: prev.total + 1,
    });
  }, []);

  const finishSession = useCallback(() => {
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
      wordsApi.recordAnswer(wordId, grade).catch(console.error);
    }
    onComplete(results);
  }, [onComplete]);

  // Apply a stage outcome to the current word and advance the queue.
  const handleStageResult = useCallback((wordId: string, correct: boolean) => {
    recordStageResult(wordId, correct);
    setStates((prev) => prev.map((s) => {
      if (s.word.id !== wordId) return s;
      let newBox: Box = s.box;
      if (correct) {
        newBox = Math.min(4, s.box + 1) as Box;
      } else {
        newBox = Math.max(0, s.box - 1) as Box;
      }
      const gap = correct ? GAP_AFTER_BOX[newBox] : 1; // wrong → fast retry
      return {
        ...s,
        box: newBox,
        dueStep: step + 1 + gap,
        encounters: s.encounters + 1,
        mistakes: s.mistakes + (correct ? 0 : 1),
      };
    }));
    setStep((s) => s + 1);
  }, [recordStageResult, step]);

  // Speed-mix outcome
  const handleSpeedResult = useCallback((wordId: string, correct: boolean) => {
    recordStageResult(wordId, correct);
    if (speedMixQueue && speedIndex + 1 < speedMixQueue.length) {
      setSpeedIndex((i) => i + 1);
    } else {
      finishSession();
    }
  }, [recordStageResult, speedMixQueue, speedIndex, finishSession]);

  // Overall session progress
  const totalEncounters = states.reduce((sum, s) => sum + (s.box as number), 0);
  const maxEncounters = states.length * 4;
  const learnProgress = (totalEncounters / maxEncounters) * 100;

  // ── Speed-mix mode ──
  if (speedMixQueue) {
    const speedWord = speedMixQueue[speedIndex];
    if (!speedWord) {
      // Should not happen given the indexing, but safeguard.
      finishSession();
      return null;
    }
    const speedProgress = ((speedIndex + 1) / speedMixQueue.length) * 100;
    return (
      <div className={styles.container}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${speedProgress}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
        </div>
        <div className={styles.counter}>
          <Sparkles size={14} /> {t.learn.speedMixLabel}
          <span className={styles.stageBadge}>{speedIndex + 1} / {speedMixQueue.length}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`speed-${speedIndex}`}
            className={styles.stageWrap}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.18 }}
          >
            <SpeedStage word={speedWord} onAdvance={(correct) => handleSpeedResult(speedWord.id, correct)} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${learnProgress}%` }} />
      </div>
      <div className={styles.counter}>
        {t.learn.adaptiveLabel}
        <span className={styles.stageBadge}>{stageLabel(stageFor(current.box), t)}</span>
      </div>
      <BoxesProgress states={states} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.word.id}-${current.box}-${step}`}
          className={styles.stageWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {current.box === 0 && (
            <IntroStage
              word={current.word}
              onAdvance={() => handleStageResult(current.word.id, true)}
            />
          )}
          {current.box === 1 && (
            <MCStage
              word={current.word}
              onAdvance={(correct) => handleStageResult(current.word.id, correct)}
            />
          )}
          {current.box === 2 && (
            <ClozeStage
              word={current.word}
              onAdvance={(correct) => handleStageResult(current.word.id, correct)}
            />
          )}
          {current.box === 3 && (
            <SpellingStage
              word={current.word}
              onAdvance={(correct) => handleStageResult(current.word.id, correct)}
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
  if (stage === 'cloze') return t.learn.stageCloze;
  if (stage === 'spell') return t.learn.stageWrite;
  return t.learn.stageQuick;
}

/* ═══════════════════════════════════════════════
   Box progress dots — visualises each word's
   journey through the 4 boxes. Lets the user see
   that progress is real even when the same word
   keeps coming back.
═══════════════════════════════════════════════ */

function BoxesProgress({ states }: { states: WordState[] }) {
  return (
    <div className={styles.boxesRow}>
      {states.map((s) => (
        <div
          key={s.word.id}
          className={styles.boxItem}
          title={`${s.word.french} · box ${s.box}/4`}
        >
          {[0, 1, 2, 3].map((b) => (
            <span
              key={b}
              className={`${styles.boxDot} ${s.box > b ? styles.boxDotFilled : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Stage components — duplicate of SmartLearnFlow's
   stages but using our own CSS module. Kept in this
   file to avoid an import cycle with SmartLearnFlow.
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

/* ── Cloze stage (NEW): word missing from its own example sentence ── */

function ClozeStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'input' | 'correct' | 'wrong'>('input');
  const inputRef = useRef<HTMLInputElement>(null);

  // Split the example sentence into [before, blank, after]
  const parts = useMemo(() => {
    if (!word.exampleFr) return null;
    const found = findWordInExample(word.french, word.exampleFr);
    if (!found) return null;
    return {
      before: word.exampleFr.slice(0, found.start),
      target: word.exampleFr.slice(found.start, found.end),
      after: word.exampleFr.slice(found.end),
    };
  }, [word.exampleFr, word.french]);

  // No usable example → fall back to Spell-style prompt without sentence
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const expected = parts ? parts.target : word.french;
  const target = expected;
  const slots = useMemo(() => {
    return Array.from(target).map((ch, i) => {
      const u = value[i] ?? '';
      const tch = target[i] ?? '';
      let st: 'match' | 'mismatch' | 'pending' = 'pending';
      if (i < value.length) {
        st = normalize(u) === normalize(tch) ? 'match' : 'mismatch';
      }
      return { ch, state: st, isSpace: ch === ' ' || ch === '-' || ch === '\'' };
    });
  }, [value, target]);

  const fullyCorrect = value.length === target.length && slots.every((s) => s.state === 'match');
  const anyMismatch = slots.some((s) => s.state === 'mismatch');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== 'input') return;
    const correct = normalize(value) === normalize(expected);
    setState(correct ? 'correct' : 'wrong');
    setTimeout(() => onAdvance(correct), correct ? 700 : 2200);
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <p className={styles.cardLabel}>{t.learn.clozeHint}</p>

      {parts ? (
        <p className={styles.clozeSentence}>
          {parts.before}
          <span className={styles.clozeBlank}>______</span>
          {parts.after}
        </p>
      ) : (
        <p className={styles.spellingPrompt}>{word.translation}</p>
      )}
      {word.exampleRu && parts && <p className={styles.exampleRu}>{word.exampleRu}</p>}

      <div className={styles.spellingSlots} aria-hidden>
        {slots.map((s, i) => (
          <span
            key={i}
            className={[
              styles.spellingSlot,
              s.state === 'match' && styles.spellingSlotMatch,
              s.state === 'mismatch' && styles.spellingSlotMismatch,
              s.state === 'pending' && styles.spellingSlotPending,
              s.isSpace && styles.spellingSlotSep,
            ].filter(Boolean).join(' ')}
          >
            {s.state === 'pending' ? (s.isSpace ? s.ch : '_') : (value[i] ?? s.ch)}
          </span>
        ))}
      </div>

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
          maxLength={target.length + 5}
          className={`${styles.spellingInput} ${state === 'correct' ? styles.spellingInputOk : ''} ${state === 'wrong' ? styles.spellingInputBad : ''}`}
          placeholder="..."
        />
        <AudioBtn word={word} />
      </div>
      {state === 'wrong' && (
        <p className={styles.spellingCorrectAnswer}>
          {t.learn.correctAnswer} <strong>{expected}</strong>
        </p>
      )}
      {state === 'input' && (
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={value.trim().length === 0 || (anyMismatch && !fullyCorrect)}
        >
          {fullyCorrect ? '✓ ' : ''}{t.learn.check}
        </button>
      )}
    </form>
  );
}

function SpellingStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'input' | 'correct' | 'wrong'>('input');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const target = word.french;
  const slots = useMemo(() => {
    return Array.from(target).map((ch, i) => {
      const u = value[i] ?? '';
      const tch = target[i] ?? '';
      let st: 'match' | 'mismatch' | 'pending' = 'pending';
      if (i < value.length) {
        st = normalize(u) === normalize(tch) ? 'match' : 'mismatch';
      }
      return { ch, state: st, isSpace: ch === ' ' || ch === '-' || ch === '\'' };
    });
  }, [value, target]);

  const fullyCorrect = value.length === target.length && slots.every((s) => s.state === 'match');
  const anyMismatch = slots.some((s) => s.state === 'mismatch');

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

      <div className={styles.spellingSlots} aria-hidden>
        {slots.map((s, i) => (
          <span
            key={i}
            className={[
              styles.spellingSlot,
              s.state === 'match' && styles.spellingSlotMatch,
              s.state === 'mismatch' && styles.spellingSlotMismatch,
              s.state === 'pending' && styles.spellingSlotPending,
              s.isSpace && styles.spellingSlotSep,
            ].filter(Boolean).join(' ')}
          >
            {s.state === 'pending' ? (s.isSpace ? s.ch : '_') : (value[i] ?? s.ch)}
          </span>
        ))}
      </div>

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
          maxLength={target.length + 5}
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
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={value.trim().length === 0 || (anyMismatch && !fullyCorrect)}
        >
          {fullyCorrect ? '✓ ' : ''}{t.learn.check}
        </button>
      )}
    </form>
  );
}

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
