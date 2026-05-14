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
  | 'match'      // group of 4 words: pair FR ↔ RU by clicking (batch stage)
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

// Per-word stage sequence given its current SRS status. NOTE: for 'new'
// words the recognition stage is 'match' rather than 'mc' — multiple new
// words are batched into a 4-pair matching exercise together. The 'match'
// slot here is a marker; the actual matching cards are inserted as
// separate batch items in buildSchedule.
function stagesForStatus(status: string): Stage[] {
  if (status === 'new')      return ['intro', 'match', pickVariety(), 'cloze', 'spell'];
  if (status === 'learning') return ['mc', pickVariety(), 'cloze', 'spell'];
  if (status === 'review')   return ['cloze', 'spell'];
  if (status === 'mastered') return ['spell'];
  return ['intro', 'match', pickVariety(), 'cloze', 'spell'];
}

const STAGE_RANK: Record<Stage, number> = {
  intro: 0,
  match: 1,
  mc: 1,
  reverse: 2,
  listening: 2,
  scramble: 2,
  cloze: 3,
  spell: 4,
};

// Per-word stage entry (the common case).
interface PerWordItem {
  kind: 'word';
  wordId: string;
  stage: Stage;
  round: number;
}

// Batch matching entry — 2-4 words on one card.
interface MatchBatchItem {
  kind: 'match';
  wordIds: string[];
  round: number;
}

type ScheduleItem = PerWordItem | MatchBatchItem;

// Build the session schedule. TWO phases:
//
// 1. INTRODUCTION — every new word's Intro card plays back-to-back at the
//    start. Matches the user's mental model (see all the new words first,
//    then drill them). Words with no Intro stage (status='learning' or
//    higher) skip this phase.
//
// 2. PRACTICE — wave/diagonal interleaving over the remaining drill stages
//    (MC → Variety → Cloze → Spell). For word i and its k-th drill stage,
//    we place it at round `i + k * 2`. Per-word same-stage gaps are
//    2 → 4 → 6 (strictly growing Pimsleur intervals).
//
// The combination keeps Pimsleur's within-session spacing (the gaps that
// matter for retention are between RETRIEVALS, not between intros and
// first retrieval) while giving the user the familiar "carousel of new
// words, then quiz" structure.
// Group items into chunks of N (last chunk may be smaller).
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const MATCH_CHUNK_SIZE = 4;
const MATCH_MIN_CHUNK = 2; // smaller chunks get appended to previous one

function buildSchedule(words: WordData[]): ScheduleItem[] {
  const introItems: ScheduleItem[] = [];
  const matchItems: ScheduleItem[] = [];
  const practiceItems: ScheduleItem[] = [];

  // Words that get matching as their first recall test (new status).
  const newWordIds: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i]!;
    const status = w.progress?.status ?? 'new';
    const stages = stagesForStatus(status);
    if (status === 'new') newWordIds.push(w.id);

    let drillIndex = 0;
    for (const stage of stages) {
      if (stage === 'intro') {
        introItems.push({ kind: 'word', wordId: w.id, stage, round: i });
      } else if (stage === 'match') {
        // skip — matching is batched separately below
        drillIndex++;
      } else {
        practiceItems.push({ kind: 'word', wordId: w.id, stage, round: i + drillIndex * 2 });
        drillIndex++;
      }
    }
  }

  // Build matching batches: chunks of 4. If the last chunk is only 1 word,
  // merge it into the previous chunk (you can't match with 1 pair).
  if (newWordIds.length >= MATCH_MIN_CHUNK) {
    const chunks = chunkArray(newWordIds, MATCH_CHUNK_SIZE);
    if (chunks.length >= 2 && chunks[chunks.length - 1]!.length < MATCH_MIN_CHUNK) {
      // merge tiny tail into previous chunk
      const tail = chunks.pop()!;
      chunks[chunks.length - 1] = [...chunks[chunks.length - 1]!, ...tail];
    }
    for (let c = 0; c < chunks.length; c++) {
      matchItems.push({ kind: 'match', wordIds: chunks[c]!, round: c });
    }
  } else if (newWordIds.length === 1) {
    // Edge case: only one new word — fall back to a per-word MC stage
    // so the user still gets a recognition check.
    const wId = newWordIds[0]!;
    practiceItems.unshift({ kind: 'word', wordId: wId, stage: 'mc', round: 0 });
  }

  introItems.sort((a, b) => a.round - b.round);
  matchItems.sort((a, b) => a.round - b.round);
  practiceItems.sort((a, b) => {
    if (a.kind !== 'word' || b.kind !== 'word') return a.round - b.round;
    return a.round - b.round || STAGE_RANK[b.stage] - STAGE_RANK[a.stage];
  });

  return [...introItems, ...matchItems, ...practiceItems];
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

// One audio cache per session — keyed by French text. Acts as the in-memory
// L2 cache; the server has its own persistent L1 in the tts_cache table.
const audioCache = new Map<string, string>();

// Fetch the audio bytes and store as a blob URL — but don't play. Used by
// prefetch on session start so when the user reaches a card, audio is
// already in memory and plays instantly.
async function prefetchAudio(text: string, audioUrl?: string | null): Promise<void> {
  if (audioUrl) return;          // external URL — browser will cache on first play
  if (audioCache.has(text)) return;
  try {
    const blob = await listeningApi.generateTTS(text);
    const url = URL.createObjectURL(blob);
    audioCache.set(text, url);
  } catch {
    // Silent — playback will simply fall through to a fresh fetch.
  }
}

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

  // Prefetch ALL session words' audio in parallel at session start. By the
  // time the user finishes reading the first Intro card, every subsequent
  // card's audio is already in memory — eliminates the perceived "lag"
  // of waiting for OpenAI TTS round-trip.
  useEffect(() => {
    void Promise.all(words.map((w) => prefetchAudio(w.french, w.audioUrl)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = schedule[index] ?? null;
  // Per-word stages have a single word; match batches have multiple, so
  // currentWord is only meaningful for the per-word kind.
  const currentWord = current && current.kind === 'word' ? wordById.get(current.wordId) ?? null : null;
  const mainDone = !current;

  // Pre-play audio when a new card appears — but ONLY for stages where the
  // French word is already on screen as the prompt. Otherwise auto-playing
  // the audio just hands the user the answer:
  //   - reverse: prompt is the Russian translation
  //   - cloze:   user must produce the word from a sentence with a gap
  //   - spell:   user must produce the word from the Russian only
  //   - scramble: user must assemble shuffled letters
  //   - listening: this stage owns its own audio playback (and IS the test)
  //   - match:    multiple words on screen, no auto-play
  // The manual AudioBtn is still available in most of these stages — that's
  // a user-initiated hint, not a free leak.
  const currentStage = current && current.kind === 'word' ? current.stage : null;
  useEffect(() => {
    if (!currentWord || !currentStage) return;
    const autoPlayOk = currentStage === 'intro' || currentStage === 'mc';
    if (!autoPlayOk) return;
    const timer = setTimeout(() => { void playAudio(currentWord.french, currentWord.audioUrl); }, 200);
    return () => clearTimeout(timer);
  }, [currentWord?.id, currentStage]);

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
        next.splice(insertAt, 0, { kind: 'word', wordId, stage, round: -1 });
        return next;
      });
    }
    setIndex((i) => i + 1);
  }, [index, recordStageResult]);

  // Result from a Matching batch — N words, each with correct/incorrect flag.
  const handleMatchResult = useCallback((results: { wordId: string; correct: boolean }[]) => {
    setCompletedStages((prev) => {
      const next = new Map(prev);
      for (const r of results) {
        recordStageResult(r.wordId, r.correct);
        if (r.correct) {
          const set = new Set(next.get(r.wordId) ?? []);
          set.add('match');
          next.set(r.wordId, set);
        }
      }
      return next;
    });
    setIndex((i) => i + 1);
  }, [recordStageResult]);

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

  if (!current) return null;

  // Counter label varies by kind: match-batch shows its own label.
  const counterStageLabel =
    current.kind === 'match' ? t.learn.stageMatch : stageLabel(current.stage, t);

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${learnProgress}%` }} />
      </div>
      <div className={styles.counter}>
        {t.learn.adaptiveLabel}
        <span className={styles.stageBadge}>{counterStageLabel}</span>
      </div>
      <BoxesProgress words={words} completedStages={completedStages} />

      <AnimatePresence mode="wait">
        <motion.div
          key={
            current.kind === 'match'
              ? `match-${current.wordIds.join(',')}-${index}`
              : `${current.wordId}-${current.stage}-${index}`
          }
          className={styles.stageWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {current.kind === 'match' && (
            <MatchingStage
              words={current.wordIds
                .map((id) => wordById.get(id))
                .filter((w): w is WordData => !!w)}
              onComplete={handleMatchResult}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'intro' && (
            <IntroStage
              word={currentWord}
              onAdvance={() => handleStageResult(currentWord.id, 'intro', true)}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'mc' && (
            <MCStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'mc', correct)}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'reverse' && (
            <ReverseMCStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'reverse', correct)}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'listening' && (
            <ListeningStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'listening', correct)}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'scramble' && (
            <ScrambleStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'scramble', correct)}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'cloze' && (
            <ClozeStage
              word={currentWord}
              onAdvance={(correct) => handleStageResult(currentWord.id, 'cloze', correct)}
            />
          )}
          {current.kind === 'word' && currentWord && current.stage === 'spell' && (
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
  if (stage === 'match') return t.learn.stageMatch;
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
  if (stage === 'mc' || stage === 'match') return 1;
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

/* ── Matching: 2-4 pairs of FR ↔ RU, click two cards to match ──────────── */

interface MatchingResult { wordId: string; correct: boolean }

function MatchingStage({
  words,
  onComplete,
}: {
  words: WordData[];
  onComplete: (results: MatchingResult[]) => void;
}) {
  const { t } = useI18n();

  // Build the two columns in shuffled order — independently. Each card knows
  // which wordId it represents and what side it lives on.
  const initialCards = useMemo(() => {
    const shuffled = <T,>(arr: T[]): T[] => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    };
    const left = shuffled(words.map((w) => ({ side: 'fr' as const, wordId: w.id, text: w.french })));
    const right = shuffled(words.map((w) => ({ side: 'ru' as const, wordId: w.id, text: w.translation })));
    return { left, right };
  }, [words]);

  // Selection state — which card the user has currently picked, and which
  // wordIds have been matched (greyed out / removed).
  const [selected, setSelected] = useState<{ side: 'fr' | 'ru'; wordId: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  // Per-word mistake count — anyone who made ≥1 wrong attempt is marked
  // as 'not first try' in the final results.
  const mistakesRef = useRef<Map<string, number>>(new Map());
  // Brief visual flash on wrong attempts so the user sees what they picked
  // before it's deselected.
  const [wrongFlash, setWrongFlash] = useState<{ a: string; b: string } | null>(null);

  const handlePick = (side: 'fr' | 'ru', wordId: string) => {
    if (matched.has(wordId)) return;
    if (wrongFlash) return; // ignore clicks during the flash window
    if (!selected) {
      setSelected({ side, wordId });
      return;
    }
    if (selected.side === side) {
      // Re-pick within same column — replace selection
      setSelected({ side, wordId });
      return;
    }
    // Two cards selected — same word? match!
    if (selected.wordId === wordId) {
      setMatched((prev) => {
        const next = new Set(prev);
        next.add(wordId);
        return next;
      });
      setSelected(null);
    } else {
      // Mismatch — count a mistake against BOTH picked words and flash red.
      const a = selected.wordId;
      const b = wordId;
      mistakesRef.current.set(a, (mistakesRef.current.get(a) ?? 0) + 1);
      mistakesRef.current.set(b, (mistakesRef.current.get(b) ?? 0) + 1);
      setWrongFlash({ a, b });
      setTimeout(() => {
        setWrongFlash(null);
        setSelected(null);
      }, 600);
    }
  };

  // When all words matched → finalise and report results.
  useEffect(() => {
    if (matched.size === words.length && words.length > 0) {
      const results: MatchingResult[] = words.map((w) => ({
        wordId: w.id,
        correct: (mistakesRef.current.get(w.id) ?? 0) === 0,
      }));
      // brief delay so user sees the last green flash
      const t = setTimeout(() => onComplete(results), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [matched, words, onComplete]);

  const isFlashed = (wordId: string) =>
    wrongFlash && (wrongFlash.a === wordId || wrongFlash.b === wordId);

  function renderCard(card: { side: 'fr' | 'ru'; wordId: string; text: string }) {
    const isMatched = matched.has(card.wordId);
    const isSelected = selected?.side === card.side && selected.wordId === card.wordId;
    const flashed = isFlashed(card.wordId);
    const cls = [styles.matchCard];
    if (isMatched) cls.push(styles.matchCardDone);
    else if (flashed) cls.push(styles.matchCardWrong);
    else if (isSelected) cls.push(styles.matchCardSelected);
    return (
      <button
        key={card.side + card.wordId}
        type="button"
        className={cls.join(' ')}
        onClick={() => handlePick(card.side, card.wordId)}
        disabled={isMatched}
      >
        {card.text}
      </button>
    );
  }

  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{t.learn.matchingHint}</p>
      <div className={styles.matchGrid}>
        <div className={styles.matchColumn}>
          {initialCards.left.map(renderCard)}
        </div>
        <div className={styles.matchColumn}>
          {initialCards.right.map(renderCard)}
        </div>
      </div>
    </div>
  );
}

