/**
 * Build a word+POS → CEFR map from FLELex (cental.uclouvain.be/flelex).
 *
 * FLELex is the academic gold standard for French CEFR vocabulary:
 *   - Built from 777,000 words of FFL textbooks at each CEFR level
 *   - Beacco TSV is aligned with the Conseil de l'Europe Référentiels
 *   - CC BY-NC-SA 4.0 licensed
 *
 * We use two sources merged:
 *   - FleLex_TT_Beacco.tsv (14236 entries, primary, Beacco-aligned)
 *   - FleLex_CRF.csv      (17871 entries, fallback — covers more
 *                          multi-word expressions and rarer forms)
 *
 * Output: tmp/flelex/flelex-map.json
 *   { "<word>|<pos>": "A1"|"A2"|...|"C2",
 *     "<word>":       "A1"|"A2"|...|"C2"  ← POS-free fallback
 *   }
 *
 * The level for each entry is either FLELex's `level` column (Beacco
 * TSV — first level where the word has stable, non-trivial frequency)
 * or computed for CRF as "earliest level where freq ≥ 1.0 per million".
 */
import { readFileSync, writeFileSync } from 'node:fs';

const BEACCO = 'tmp/flelex/FleLex_TT_Beacco.tsv';
const CRF = 'tmp/flelex/FleLex_CRF.csv';
const OUT = 'tmp/flelex/flelex-map.json';
// Any non-zero appearance counts. FLELex's `level` column biased toward
// words that recur across levels; for one-shot vocab (éléphant, violon,
// rugby) it returns C1-C2 even when the word appears strongly at A1.
// We override that bias by taking the EARLIEST level with any non-zero
// frequency — meaning "a textbook at this level used this word, so a
// learner at this level needs it".
const FREQ_THRESHOLD = 0.0;

// FLELex POS tags (TT and CRF differ slightly) → our DB partOfSpeech tags.
const POS_MAP: Record<string, string> = {
  NOM: 'noun',
  N: 'noun',
  VER: 'verb',
  V: 'verb',
  ADJ: 'adjective',
  ADV: 'adverb',
  PRP: 'preposition',
  PRO: 'pronoun',
  DET: 'determiner',
  KON: 'conjunction',
  INT: 'interjection',
  NUM: 'number',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

interface Entry { word: string; pos: string; level: string }
const entries: Entry[] = [];

function parseBeaccoTsv(): void {
  const text = readFileSync(BEACCO, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const idxWord = header.indexOf('word');
  const idxTag = header.indexOf('tag');
  const idxLevel = header.indexOf('level');
  const idxF = LEVELS.map((l) => header.indexOf(`freq_${l}`));
  if (idxWord < 0 || idxLevel < 0) throw new Error('Beacco header mismatch');
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[idxWord] ?? '').toLowerCase().trim();
    const tag = (parts[idxTag] ?? '').toUpperCase().trim();
    if (!word) continue;
    const flLevel = (parts[idxLevel] ?? '').toUpperCase().trim();

    // Hybrid rule:
    //  - When FLELex level is A1-B2 it's reliable (the algorithm
    //    identifies the introduction level from stable distribution
    //    across multiple levels).
    //  - When FLELex level is C1-C2 it can be a "catch-all" assigned to
    //    words that only appear at one isolated level (e.g. 'violon'
    //    only in A1 textbooks). In that case, override with the level
    //    where the word actually appears.
    let chosenLevel: string | null = null;
    if (LEVELS.includes(flLevel as typeof LEVELS[number]) &&
        flLevel !== 'C1' && flLevel !== 'C2') {
      chosenLevel = flLevel;
    } else {
      // Find single non-zero level (isolated occurrence override)
      let nonZeroLevels: string[] = [];
      let earliestNonZero: string | null = null;
      for (let k = 0; k < LEVELS.length; k++) {
        const idx = idxF[k];
        if (idx === undefined || idx < 0) continue;
        const f = parseFloat(parts[idx] ?? '0');
        if (f > 0) {
          nonZeroLevels.push(LEVELS[k]!);
          if (!earliestNonZero) earliestNonZero = LEVELS[k]!;
        }
      }
      if (nonZeroLevels.length === 1 && earliestNonZero) {
        // Single-level isolate — trust the appearance over the C1/C2 tag.
        chosenLevel = earliestNonZero;
      } else if (LEVELS.includes(flLevel as typeof LEVELS[number])) {
        // Multi-level, FLELex put it at C1/C2 — accept that (genuine
        // advanced vocab that grows toward upper levels).
        chosenLevel = flLevel;
      }
    }
    if (!chosenLevel) continue;
    const pos = POS_MAP[tag] ?? POS_MAP[tag.split(':')[0] ?? ''] ?? '';
    entries.push({ word, pos, level: chosenLevel });
  }
}

function parseCrfCsv(): void {
  const text = readFileSync(CRF, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines[0]!.split('\t');
  const idxWord = header.indexOf('word');
  const idxTag = header.indexOf('tag');
  // CRF has lowercase freq_a1 etc. No `level` column — derive it.
  const idxF = LEVELS.map((l) => header.indexOf(`freq_${l.toLowerCase()}`));
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split('\t');
    if (parts.length < header.length) continue;
    const word = (parts[idxWord] ?? '').toLowerCase().trim();
    const tag = (parts[idxTag] ?? '').toUpperCase().trim();
    if (!word) continue;
    // Earliest level with freq ≥ threshold = derived level
    let derivedLevel: string | null = null;
    for (let k = 0; k < LEVELS.length; k++) {
      const idx = idxF[k];
      if (idx === undefined || idx < 0) continue;
      const f = parseFloat(parts[idx] ?? '0');
      if (f > FREQ_THRESHOLD) { derivedLevel = LEVELS[k]!; break; }
    }
    if (!derivedLevel) continue;
    const pos = POS_MAP[tag] ?? POS_MAP[tag.split(':')[0] ?? ''] ?? '';
    entries.push({ word, pos, level: derivedLevel });
  }
}

parseBeaccoTsv();
const beaccoCount = entries.length;
parseCrfCsv();
console.log(`[flelex] parsed ${beaccoCount} Beacco + ${entries.length - beaccoCount} CRF entries`);

// Merge — Beacco wins on conflict (it's the academic reference)
const wordPosToLevel: Record<string, string> = {};
const wordToLevel: Record<string, string> = {};
const wordToLevels: Record<string, string[]> = {};

for (const e of entries) {
  const keyPos = e.pos ? `${e.word}|${e.pos}` : null;
  if (keyPos && !(keyPos in wordPosToLevel)) wordPosToLevel[keyPos] = e.level;
  if (!wordToLevels[e.word]) wordToLevels[e.word] = [];
  wordToLevels[e.word]!.push(e.level);
}

// Pos-free fallback: take EARLIEST level seen for this word across all POS.
const LEVEL_ORDER = LEVELS as readonly string[];
for (const [word, levels] of Object.entries(wordToLevels)) {
  let earliest = levels[0]!;
  for (const l of levels) {
    if (LEVEL_ORDER.indexOf(l) < LEVEL_ORDER.indexOf(earliest)) earliest = l;
  }
  wordToLevel[word] = earliest;
}

const out = { wordPos: wordPosToLevel, word: wordToLevel };
writeFileSync(OUT, JSON.stringify(out));
console.log(`[flelex] ${Object.keys(wordPosToLevel).length} word|pos + ${Object.keys(wordToLevel).length} word entries → ${OUT}`);
