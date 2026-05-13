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
import { Volume2, ArrowRight, Check, X as XIcon } from 'lucide-react';
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

type Stage =
  | 'intro'
  | 'mc'         // FR → choose RU (receptive recognition)
  | 'reverse'    // RU → choose FR (productive recognition)
  | 'listening'  // audio → type FR (auditory recall)
  | 'scramble'   // letters shuffled → arrange (form practice)
  | 'cloze'      // sentence with gap → type FR (productive in context)
  | 'spell';     // RU only → type FR from scratch (productive cold)

// Variety pool for the wild-card slot 3. Each word in a session gets one of
// these chosen at session start — different words get different variety
// stages so the user encounters all three within a single session.
const VARIETY_POOL: Stage[] = ['reverse', 'listening', 'scramble'];

function pickVariety(): Stage {
  return VARIETY_POOL[Math.floor(Math.random() * VARIETY_POOL.length)]!;
}

// Build the stage sequence for a word given its current SRS status.
// 'new' words travel the full 5-stage funnel; partially-known words skip
// earlier stages. The variety slot is randomised per word.
function stagesForStatus(status: string): Stage[] {
  if (status === 'new')      return ['intro', 'mc', pickVariety(), 'cloze', 'spell'];
  if (status === 'learning') return ['mc', pickVariety(), 'cloze', 'spell'];
  if (status === 'review')   return ['cloze', 'spell'];
  if (status === 'mastered') return ['spell'];
  return ['intro', 'mc', pickVariety(), 'cloze', 'spell'];
}

const STAGE_RANK: Record<Stage, number> = {
  intro: 0,
  mc: 1,
  reverse: 2,
  listening: 2,
  scramble: 2,
  cloze: 3,
  spell: 4,
};

interface ScheduleItem {
  wordId: string;
  stage: Stage;
  // Logical round in the wave; later collapsed into a sequential index.
  round: number;
}

// Build a "wave" / diagonal schedule. For word i (0-indexed in batch order)
// and stage position k (0..len-1) in its remaining stages, place the card
// at round `i + k * 2`. Result with 5-stage flow:
//
//   word A: rounds 0, 2, 4, 6, 8   → Intro, MC, Variety, Cloze, Spell
//   word B: rounds 1, 3, 5, 7, 9
//   word C: rounds 2, 4, 6, 8, 10
//   ...
//
// Within a round, higher-stage items go first. Per-word gaps between
// same-word stages stay at 2 → 4 → 6 → 8 cards (strictly growing —
// Pimsleur intervals).
function buildSchedule(words: WordData[]): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!;
    const status = w.progress?.status ?? 'new';
    const stages = stagesForStatus(status);
    for (let k = 0; k < stages.length; k++) {
      items.push({ wordId: w.id, stage: stages[k]!, round: i + k * 2 });
    }
  }
  // Sort: earlier round first; within same round, higher stage first
  // (so words deeper in their journey advance before fresh ones).
  items.sort((a, b) =>
    a.round - b.round || STAGE_RANK[b.stage] - STAGE_RANK[a.stage],
  );
  return items;
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

  // Precomputed schedule — wave/diagonal interleaving. See buildSchedule.
  // Cast to mutable copy so we can splice in retry items after wrong answers.
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => buildSchedule(words));
  const [index, setIndex] = useState(0);

  // Per-word state: how far each word has progressed in its stage sequence.
  // Used for the dot-progress UI and for early termination of further stages
  // if the user dismisses or completes a word early.
  const [completedStages, setCompletedStages] = useState<Map<string, Set<Stage>>>(() => new Map());

  // Per-word tally for final SRS grade.
  const tallyRef = useRef<Map<string, { ok: number; bad: number; total: number }>>(new Map());

  const wordById = useMemo(() => {
    const m = new Map<string, WordData>();
    for (const w of words) m.set(w.id, w);
    return m;
  }, [words]);

  const current = schedule[index] ?? null;
  const currentWord = current ? wordById.get(current.wordId) ?? null : null;
  const mainDone = !current;

  // Pre-play audio when a new card appears.
  useEffect(() => {
    if (!currentWord) return;
    const timer = setTimeout(() => { void playAudio(currentWord.french, currentWord.audioUrl); }, 200);
    return () => clearTimeout(timer);
  }, [currentWord?.id, current?.stage]);

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
    for (const [wordId, ta] of tallyRef.current.entries()) {
      if (ta.total === 0) continue;
      const ratio = ta.ok / ta.total;
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

  // Advance to next schedule item. Insert a retry copy ~2 items later for
  // wrong answers (errorful learning with immediate-ish recovery, Kornell-
  // Bjork 2008: the recovery shouldn't be immediate or the user just memorises
  // the latest hint — needs a tiny gap to force real retrieval).
  const handleStageResult = useCallback((wordId: string, stage: Stage, correct: boolean) => {
    recordStageResult(wordId, correct);
    setCompletedStages((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(wordId) ?? []);
      if (correct) set.add(stage);
      next.set(wordId, set);
      return next;
    });
    if (!correct && stage !== 'intro') {
      setSchedule((prev) => {
        const next = [...prev];
        const insertAt = Math.min(index + 2, next.length);
        next.splice(insertAt, 0, { wordId, stage, round: -1 });
        return next;
      });
    }
    setIndex((i) => i + 1);
  }, [index, recordStageResult]);

  // Once the schedule is exhausted, finish immediately. No tail SpeedMix:
  // a self-reported "knew / didn't know" right after the user just typed the
  // word from scratch (Spell) is theatre — Bjork's research actually warns
  // against easy retrieval right after hard retrieval (it weakens the trace).
  // Fluency practice over already-mastered words deserves its own mode, not
  // a tail on the learning session.
  useEffect(() => {
    if (mainDone) finishSession();
  }, [mainDone, finishSession]);

  // Overall session progress — share of stages completed so far.
  const totalDone = useMemo(() => {
    let n = 0;
    for (const set of completedStages.values()) n += set.size;
    return n;
  }, [completedStages]);
  const totalStages = schedule.length;
  const learnProgress = totalStages > 0 ? (totalDone / totalStages) * 100 : 0;

  if (!current || !currentWord) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${learnProgress}%` }} />
      </div>
      <div className={styles.counter}>
        {t.learn.adaptiveLabel}
        <span className={styles.stageBadge}>{stageLabel(current.stage, t)}</span>
      </div>
      <BoxesProgress words={words} completedStages={completedStages} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentWord.id}-${current.stage}-${index}`}
          className={styles.stageWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {current.stage === 'intro' && (
            <IntroStage
              word={currentWord}
              onAdvance={() => handleStageResult(currentWord.id, 'intro', true)}
            />
          )}
          {current.stage === 'mc' && (
            <MCStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'mc', correct)}
            />
          )}
          {current.stage === 'reverse' && (
            <ReverseMCStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'reverse', correct)}
            />
          )}
          {current.stage === 'listening' && (
            <ListeningStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'listening', correct)}
            />
          )}
          {current.stage === 'scramble' && (
            <ScrambleStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'scramble', correct)}
            />
          )}
          {current.stage === 'cloze' && (
            <ClozeStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'cloze', correct)}
            />
          )}
          {current.stage === 'spell' && (
            <SpellingStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'spell', correct)}
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
  if (stage === 'reverse') return t.learn.stageReverse;
  if (stage === 'listening') return t.learn.stageListening;
  if (stage === 'scramble') return t.learn.stageScramble;
  if (stage === 'cloze') return t.learn.stageCloze;
  return t.learn.stageWrite;
}

// Map any concrete stage to its slot in the per-word progression. Slots 0-4
// in display order: Intro / Recognise / Variety / Cloze / Spell.
function stageSlot(stage: Stage): number {
  if (stage === 'intro') return 0;
  if (stage === 'mc') return 1;
  if (stage === 'reverse' || stage === 'listening' || stage === 'scramble') return 2;
  if (stage === 'cloze') return 3;
  return 4;
}

/* ═══════════════════════════════════════════════
   Box progress dots — visualises each word's
   journey through the 4 boxes. Lets the user see
   that progress is real even when the same word
   keeps coming back.
═══════════════════════════════════════════════ */

function BoxesProgress({
  words,
  completedStages,
}: {
  words: WordData[];
  completedStages: Map<string, Set<Stage>>;
}) {
  // 5 dots per word — one for each slot in the journey
  // (Intro / Recognise / Variety / Cloze / Spell).
  return (
    <div className={styles.boxesRow}>
      {words.map((w) => {
        const done = completedStages.get(w.id) ?? new Set<Stage>();
        const slots = [0, 0, 0, 0, 0];
        for (const s of done) slots[stageSlot(s)] = 1;
        const total = slots.reduce((a, b) => a + b, 0);
        return (
          <div
            key={w.id}
            className={styles.boxItem}
            title={`${w.french} · ${total}/5`}
          >
            {slots.map((filled, i) => (
              <span
                key={i}
                className={`${styles.boxDot} ${filled ? styles.boxDotFilled : ''}`}
              />
            ))}
          </div>
        );
      })}
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

/* ── Reverse MC: RU → choose FR (productive recognition) ────────────────── */

function ReverseMCStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<string[] | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number>(-1);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { distractors } = await wordsApi.getDistractors(word.id);
        // Use OTHER French words as distractors. Filter out current word & dedupe.
        const wrong = distractors
          .map((d) => d.french)
          .filter((x) => x && x !== word.french)
          .slice(0, 3);
        // Pad if not enough distractors came back
        while (wrong.length < 3) wrong.push('—');
        const all = [...wrong, word.french];
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j]!, all[i]!];
        }
        if (!cancelled) {
          setOptions(all);
          setCorrectIndex(all.indexOf(word.french));
        }
      } catch {
        if (!cancelled) {
          setOptions([word.french, '—', '—', '—']);
          setCorrectIndex(0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [word.id, word.french]);

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === correctIndex;
    setTimeout(() => onAdvance(correct), correct ? 700 : 1500);
  };

  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{t.learn.stageReverseHint}</p>
      <h2 className={styles.bigTranslation}>{word.translation}</h2>
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

/* ── Listening: hear audio, type the FR word ────────────────────────────── */

function ListeningStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'input' | 'correct' | 'wrong'>('input');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play on mount and focus the input.
  useEffect(() => {
    inputRef.current?.focus();
    const timer = setTimeout(() => { void playAudio(word.french, word.audioUrl); }, 250);
    return () => clearTimeout(timer);
  }, [word.id, word.audioUrl, word.french]);

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
    const correct = normalize(value) === normalize(target);
    setState(correct ? 'correct' : 'wrong');
    setTimeout(() => onAdvance(correct), correct ? 700 : 2200);
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <p className={styles.cardLabel}>{t.learn.stageListeningHint}</p>

      <div className={styles.listeningPlay}>
        <button
          type="button"
          className={styles.listeningBigBtn}
          onClick={() => playAudio(word.french, word.audioUrl)}
          aria-label="play"
        >
          <Volume2 size={32} />
        </button>
      </div>
      <p className={styles.bigTranslation}>{word.translation}</p>

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
      {state === 'wrong' && (
        <p className={styles.spellingCorrectAnswer}>
          {t.learn.correctAnswer} <strong>{target}</strong>
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

/* ── Scramble: letters shuffled, click to assemble ──────────────────────── */

interface Tile { ch: string; key: number; placedAt: number | null }

function ScrambleStage({ word, onAdvance }: { word: WordData; onAdvance: (correct: boolean) => void }) {
  const { t } = useI18n();
  const target = word.french;
  const [tiles, setTiles] = useState<Tile[]>(() => {
    const arr = Array.from(target).map((ch, i) => ({ ch, key: i, placedAt: null as number | null }));
    // Shuffle (Fisher-Yates) for the pool — but anchor punctuation in place
    // so spaces / hyphens / apostrophes don't drift around.
    const indices = arr.map((_, i) => i).filter((i) => {
      const c = arr[i]!.ch;
      return !(c === ' ' || c === '-' || c === '\'');
    });
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j]!, indices[i]!];
    }
    // Result: tiles in shuffled order. Punctuation tiles are placed
    // automatically at their target slot.
    const shuffled: Tile[] = [];
    let idxNonSpace = 0;
    for (let pos = 0; pos < arr.length; pos++) {
      const t = arr[pos]!;
      if (t.ch === ' ' || t.ch === '-' || t.ch === '\'') {
        shuffled.push({ ...t, placedAt: pos }); // auto-place
      } else {
        const src = indices[idxNonSpace++]!;
        shuffled.push({ ...arr[src]!, placedAt: null });
      }
    }
    return shuffled;
  });
  const [state, setState] = useState<'input' | 'correct' | 'wrong'>('input');

  // Build the current assembled word from placed tiles.
  const assembled = useMemo(() => {
    const slots: string[] = Array.from(target).map(() => '');
    for (const t of tiles) {
      if (t.placedAt !== null) slots[t.placedAt] = t.ch;
    }
    return slots;
  }, [tiles, target]);

  const allFilled = assembled.every((s) => s !== '');
  const isCorrect = allFilled && assembled.join('') === target;

  // Click a letter tile from the pool → place at first empty slot.
  const placeTile = (tileKey: number) => {
    if (state !== 'input') return;
    setTiles((prev) => {
      const next = [...prev];
      const idx = next.findIndex((t) => t.key === tileKey);
      if (idx < 0 || next[idx]!.placedAt !== null) return prev;
      // Find first empty slot
      const used = new Set(next.filter((t) => t.placedAt !== null).map((t) => t.placedAt));
      let firstEmpty = -1;
      for (let i = 0; i < target.length; i++) {
        if (!used.has(i)) { firstEmpty = i; break; }
      }
      if (firstEmpty < 0) return prev;
      next[idx] = { ...next[idx]!, placedAt: firstEmpty };
      return next;
    });
  };

  // Click a placed letter → send it back to the pool.
  const unplaceSlot = (slotIdx: number) => {
    if (state !== 'input') return;
    setTiles((prev) => prev.map((t) => {
      if (t.placedAt === slotIdx) {
        const ch = t.ch;
        // Anchor punctuation stays in place.
        if (ch === ' ' || ch === '-' || ch === '\'') return t;
        return { ...t, placedAt: null };
      }
      return t;
    }));
  };

  // Check on submit; also auto-evaluate when all slots filled.
  useEffect(() => {
    if (state !== 'input' || !allFilled) return;
    const correct = isCorrect;
    setState(correct ? 'correct' : 'wrong');
    setTimeout(() => onAdvance(correct), correct ? 700 : 2200);
  }, [allFilled, isCorrect, onAdvance, state]);

  // Pool tiles = unplaced ones, in their shuffled order.
  const poolTiles = tiles.filter((t) => t.placedAt === null);

  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{t.learn.stageScrambleHint}</p>
      <p className={styles.bigTranslation}>{word.translation}</p>
      <AudioBtn word={word} />

      <div className={styles.scrambleSlots}>
        {assembled.map((ch, i) => {
          const target_ch = target[i] ?? '';
          const isSep = target_ch === ' ' || target_ch === '-' || target_ch === '\'';
          const cls = [styles.scrambleSlot];
          if (state === 'correct') cls.push(styles.scrambleSlotMatch);
          else if (state === 'wrong' && ch && ch !== target_ch) cls.push(styles.scrambleSlotMismatch);
          else if (ch) cls.push(styles.scrambleSlotFilled);
          if (isSep) cls.push(styles.scrambleSlotSep);
          return (
            <button
              key={i}
              type="button"
              className={cls.join(' ')}
              onClick={() => unplaceSlot(i)}
              disabled={state !== 'input' || !ch || isSep}
            >
              {ch || (isSep ? target_ch : '·')}
            </button>
          );
        })}
      </div>

      <div className={styles.scramblePool}>
        {poolTiles.map((t) => (
          <button
            key={t.key}
            type="button"
            className={styles.scrambleTile}
            onClick={() => placeTile(t.key)}
            disabled={state !== 'input'}
          >
            {t.ch}
          </button>
        ))}
      </div>

      {state === 'wrong' && (
        <p className={styles.spellingCorrectAnswer}>
          {t.learn.correctAnswer} <strong>{target}</strong>
        </p>
      )}
    </div>
  );
}

