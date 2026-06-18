/**
 * Short part-of-speech label for word chips.
 *
 * Was copy-pasted identically into NewWordsPreview, SmartLearnFlow, and
 * (with a slightly cryptic first-letter fallback) WordList. Centralised
 * here so the vocabulary surfaces format POS the same way.
 *
 * Returns: noun → n(m)/n(f) when gender is known, verb → v, adjective →
 * adj, etc. Unknown POS falls through to the raw value rather than a
 * single letter, so it stays readable.
 */
export function formatPos(pos: string, gender: string | null): string {
  if (pos === 'noun' && gender) return `n(${gender})`;
  if (pos === 'verb') return 'v';
  if (pos === 'adjective') return 'adj';
  if (pos === 'adverb') return 'adv';
  if (pos === 'preposition') return 'prep';
  if (pos === 'conjunction') return 'conj';
  if (pos === 'pronoun') return 'pron';
  if (pos === 'determiner') return 'det';
  return pos;
}
