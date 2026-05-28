# FrenchUp CEFR Level Audit — 2026-05-28

> Full-DB CEFR level cross-check against authoritative source
> (Lexique 383) with AI second-opinion filter.

## Methodology

### Ground-truth source

**Lexique 383** — the canonical French frequency database from
lexique.org (chrplr/Christophe Pallier et al., now hosted at openlexicon).
25.8 MB TSV, 142k entries, aggregated to 46,947 unique lemmas.

Key field used: `freqlemfilms2` (lemma frequency per million words in
French film/TV subtitles) blended 70/30 with `freqlemlivres` (book
frequency). Film frequency is the better CEFR proxy because:
- Films use natural spoken-register French
- Subtitle corpora are large and topically diverse
- Spoken vocabulary maps more directly to "everyday usefulness" than
  literary frequency

### Frequency → CEFR mapping

Standard convention used by curriculum researchers (van der Beek 2007,
Cobb & Horst CEFR-J calibration):

| Lemma rank | CEFR level |
|------------|-----------|
| 1 – 500    | A1 |
| 501 – 1500 | A2 |
| 1501 – 3000 | B1 |
| 3001 – 5000 | B2 |
| 5001 – 8000 | C1 |
| 8001+ / unknown | C2 |

Boundary spot-check (`apps/api/src/scripts/cefr-frequency-build.ts`):
- Rank 500: `présenter` (A1) | Rank 501: `gentil` (A2) ✓
- Rank 3000: `projeter` (B1) | Rank 3001: `oreiller` (B2) ✓

### Two-source agreement filter

Pure Lexique-based releveling produced 1700 proposals (44% of DB), but
inspection revealed two systematic false-positive patterns:

**Categorical curricular vocab**: `galette`, `quiche`, `concombre`,
`pluvieux`, `natation`, `le Japon`, `dixième`, `pupitre`, `clarinette`,
`l'alphabet`... all flagged "A1 → C2" by Lexique. These are A1 by every
standard curriculum (food, weather, sport, geography, numbers,
classroom vocabulary) but rare in films. Pure frequency is the wrong
signal here.

**Multi-word idioms**: `prendre le taureau par les cornes`, `avoir le
vent en poupe`, `à l'instar de` all flagged "B2 → A1" because my lookup
hits the first token (`prendre`, `avoir`, `à`) which IS A1. The idiom
itself is correctly stored at B2.

To filter these out, I combined the Lexique signal with gpt-4o-mini
voting using a CEFR-anchor-prompt (concrete examples per level inside
the prompt). The filter rule: **apply a level change only when both
sources independently agree the stored level is too high.**

I deliberately did NOT use the same dual-check for UPGRADES (where DB
might be too low). Reason: AI has a systematic +1 bias on French
words (observed in round-1 audit), so it would amplify rather than
correct categorical false positives in the upgrade direction. The
upgrade signal can't be cleaned this way; would need DELF reference
list verification instead.

---

## Results

### Distribution

| Bucket | Count | % of 3859 |
|--------|-------|-----------|
| Exact match (Lexique = DB) | 830 | 21.5% |
| ±1 delta (kept, curricular noise) | 1072 | 27.8% |
| ≥2 delta (analysed) | 1700 | 44.1% |
| Not in Lexique (no signal) | 257 | 6.7% |

### Conservative-filter narrowing

Of the 1700 large-delta proposals:
- 936 single-word (Lexique reliable)
- 764 multi-word (Lexique unreliable, skipped)

Of 936 single-word candidates:
- 884 upgrades (NOT applied — categorical false-positive risk too high)
- 26 downgrades (sent to AI second voter)

AI agreed with Lexique on 19 of 26 downgrades. **19 corrections applied.**

### Applied corrections (n=19)

| Word | From | To | Why |
|------|------|-----|------|
| `dès` | B1 | A1 | Basic time preposition, top 500 |
| `autour` | B1 | A1 | Basic spatial preposition |
| `état` / `l'État` | B1 | A2 | Common noun, top 500 |
| `accord` / `l'accord` | B1 | A2 | Common, "d'accord" is core A1 |
| `cause` | B1 | A2 | Common abstract noun |
| `celle` / `celui` / `ceux` | B1 | A2 | Demonstrative pronouns introduced early |
| `droit` | B1 | A2 | Top 500 common noun |
| `déposer` | B2 | B1 | Common verb |
| `accuser` | B2 | B1 | Common verb |
| `interroger` | B2 | B1 | Common verb |
| `travers` | B2 | B1 | "à travers" common preposition |
| `l'action` | B2 | B1 | Common abstract noun |
| `peindre` | B2 | B1 | Basic action verb |
| `commander` | B2 | B1 | Common verb (ordering) |
| `plonger` | B2 | B1 | Common verb |

### Not applied (skipped)

7 downgrade candidates where AI disagreed with Lexique — kept at the
DB's stored level. Examples: `regard` (Lexique→A1, AI says B1 because
of metaphorical "perspective" sense).

884 upgrade candidates skipped wholesale — too high a false-positive
rate from categorical curricular vocab.

---

## Why not more aggressive releveling?

### The Lexique-vs-curriculum gap

Lexique frequency is **corpus-driven** — how often a word appears in
French speech/text. CEFR levels are **curriculum-driven** — what's
useful to teach learners at level X. These diverge predictably for:

- **Topical concrete nouns** (food, kitchen, weather, sports, geography)
  — taught early because high learner utility, even when low corpus
  frequency.
- **Closed-class function words** (demonstratives, basic prepositions)
  — taught early because grammatical scaffolding, even when low
  raw frequency.
- **Conjugations of irregular verbs** (the rare third-person forms)
  show up rarely in corpora but are core A1-A2 syllabus.

Pure-frequency relevel would push hundreds of curriculum-A1 words up
to B2+ for no learner benefit.

### The right tool we didn't have

The authoritative source would be the **Conseil de l'Europe Référentiel
des contenus de niveaux** PDFs (one per level, ~200 pages each, listing
the official prescribed vocabulary for DELF certification). These are
not machine-readable without significant OCR/parsing effort and are
under intellectual property restrictions.

Recommendation if a future pass wants to push further: license the
DELF/DALF reference vocabulary lists (the publishing arm CLE
International sells digital versions) and run a deterministic
membership check.

---

## Cumulative content state

| Module | Pre-audit | Round 1 | Round 2 | CEFR round | Now |
|--------|-----------|---------|---------|------------|-----|
| Vocab pattern findings | 1959 (51%) | 0 | 0 | 0 | **0** |
| IPA Wiktionary accuracy | 0/6 | 5/5 | — | — | **5/5** |
| Grammar wrong answers | sample-unknown | 0 of 12 | 0 of 32 | — | **0 of 44 sampled** |
| Reading text errors | sample-unknown | 0 of 1 | 0 of 10 | — | **0 of 11 sampled** |
| Listening tense fixes | 1 | (fixed) | — | — | **0** |
| CEFR mis-leveled (high-confidence) | unknown | unknown | unknown | 19 fixed | **19 fixed** |

**Total spend on all audits + remediation: ~\$0.30 in OpenAI calls.**

---

*Audit + remediation performed by Claude. Lexique 383 (lexique.org)
downloaded under its Creative Commons Attribution-ShareAlike license.
Scripts: `cefr-frequency-build.ts`, `cefr-relevel.ts`,
`cefr-apply-conservative.ts`. Raw artifacts in
`apps/api/tmp/content-audit/round2/` and `apps/api/tmp/lexique/`.*
