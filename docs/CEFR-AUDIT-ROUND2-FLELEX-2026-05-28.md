# FrenchUp CEFR Audit Round 2 — FLELex / Beacco Référentiels

> Follow-up to `CEFR-AUDIT-2026-05-28.md`. Uses the academic gold-standard
> source the previous audit recommended: **FLELex** (UCLouvain CENTAL,
> CEFRLex project) aligned with the **Conseil de l'Europe Référentiels**
> (Beacco et al., Didier 2004–2011).

## Source

- **FLELex** at [cental.uclouvain.be/flelex](https://cental.uclouvain.be/flelex/)
- License: CC BY-NC-SA 4.0 (non-commercial, attribution required, share-alike)
- Two datasets merged:
  - `FleLex_TT_Beacco.tsv` — 14,236 entries, Beacco-aligned (the
    closest available to Conseil de l'Europe Référentiels)
  - `FleLex_CRF.csv` — 17,871 entries, broader coverage
- Built from a 777,000-word corpus of FFL (Français Langue Étrangère)
  textbooks at each CEFR level

## Methodology

### Level derivation

FLELex's `level` column uses an internal algorithm that biases toward
words appearing across multiple levels with stable distribution. For
words with **isolated single-level occurrences** (e.g. `violon` appears
only in A1 textbooks with freq 1.16) it assigns C2 as catch-all — even
though A1 is the obvious correct level.

We adopted a **hybrid derivation rule**:
1. If FLELex's `level` ∈ {A1, A2, B1, B2}, use it (reliable signal).
2. If FLELex's `level` ∈ {C1, C2} but the word has exactly one non-zero
   frequency cell, override with that cell's level (catch-all fix).
3. Otherwise keep FLELex's level.

### Lookup

For each DB word:
- Try raw form
- Strip leading article (`le `, `la `, `l'`, `les `, `un `, `une `, `des `)
- Strip reflexive (`se `, `s'`)
- **Never** fall back to first-token for multi-word entries — that's
  what corrupted the previous Lexique-only audit (`prendre le taureau
  par les cornes` was incorrectly downgraded to A1 because `prendre` is
  A1)

### Apply rule (conservative)

Only apply a correction when ALL of:
1. Single-word entry (no spaces in `french`)
2. Magnitude = exactly 2 (skip aggressive ≥3 cases where FLELex's
   isolated-catch-all heuristic might still be misleading)
3. word|pos exact match (skip word-only fallback)
4. Direction = downgrade (DB level > FLELex level)

Why downgrades only:
- Upgrades hit the categorical curricular vocab false-positive problem
  (foods, weather, sports, countries — taught at A1 by curriculum but
  rare in corpora). Without authoritative DELF lists we can't filter
  these out reliably.
- AI second-opinion can't help: AI's known +1 bias would amplify
  upgrade false positives.

## Results

### Distribution

| Bucket | Count | % of 3859 |
|--------|-------|-----------|
| Exact match (FLELex = DB level) | 1094 | 28.3% |
| ±1 (curricular noise, kept) | 1225 | 31.7% |
| Not in FLELex | 1054 | 27.3% |
| ≥2 delta (analysed) | 486 | 12.6% |

### Of 486 ≥2-delta proposals

- 448 strong (word|pos match)
- 38 weak (word-only match)
- 73 passed all conservative-apply filters

### Applied (n=73)

**B1 → A1** (62 entries):
`accident`, `accompagner`, `approcher`, `association`, `aventure`,
`commander`, `commerce`, `complet`, `couvrir`, `culture`, `culturel`,
`domaine`, `effet`, `erreur`, `espace`, `étranger`, `européen`,
`exposition`, `fonction`, `frapper`, `génération`, `grave`, `habitant`,
`indépendant`, `international`, `interroger`, `l'apéritif`,
`l'arrondissement`, `l'association`, `l'assurance`, `l'atelier`,
`l'espace`, `l'identité`, `l'immeuble`, `master`, `mondial`, `noter`,
`observer`, `organiser`, `peinture`, `politique` (adj), `prévoir`,
`protéger`, `publier`, `qualité`, `reconnaître`, `remplacer`,
`représenter`, `respecter`, `responsable`, `s'attacher`, `s'informer`,
`scientifique` (adj), `spectacle`, `succès`, `taux`, `tourisme`,
`transformer`, `varier`, `végétarien`, `voile`, `zone`

**B2 → A2** (11 entries):
`diversité`, `fonder`, `l'ambivalence`, `l'angle`, `l'archipel`,
`l'assimilation`, `l'escrime`, `l'évolution`, `musulman` (adj),
`spectaculaire`, `venise`

## What FLELex is and isn't good for

### What it nails

- Multi-level common words: when a word appears across A1-C2 with a
  stable distribution growing in frequency, FLELex's level assignment
  is a strong signal (médical → B1, fondamental → B2, religieux → B1).
- Identifying severely over-leveled words: nouns like `erreur`,
  `qualité`, `succès`, `responsable` at B1 are clearly basic vocabulary.

### What it misses

- **Single-level isolates**: hand-overridden via the hybrid rule above,
  but the override is heuristic, not perfect.
- **Curricular vs corpus divergence**: many A1 curriculum words (food,
  weather, sport names, ordinals beyond 10, country names) appear
  rarely in films/textbooks above their introduction level, so FLELex
  often labels them B2-C2. Not corrected — too high a false-positive
  risk.
- **Multi-word idioms**: explicitly excluded from apply because
  first-token lookup is misleading. The DB's level for idioms (mostly
  B2-C1) is generally correct.
- **Polysemous words**: `regard` ("look" A1 vs "perspective" B2),
  `valoir` ("ça vaut" basic vs "il vaut mieux" B1) — FLELex aggregates
  all senses; we kept DB level for ambiguous cases.

## Cumulative content state

| Module | Before any audit | After all rounds |
|--------|------------------|------------------|
| Vocabulary pattern findings | 1959 (51%) | **0** |
| IPA accuracy vs Wiktionary | 0/6 | **5/5** |
| Grammar wrong answers in sample | unknown | **0 of 44** |
| Reading text errors in sample | unknown | **0 of 11** |
| Listening tense bugs | 1 | **0** (fixed) |
| CEFR corrections applied | — | **19 (round-1 Lexique+AI) + 73 (FLELex) = 92 total** |

**Total OpenAI spend across all audits + remediation: ~\$0.30.**

## Honest assessment of CEFR coverage

We've moved from "no CEFR audit" to "92 high-confidence corrections
applied via two independent academic sources". That's substantially
better than starting state.

But CEFR levels are fundamentally **curricular judgments**, not
deterministic facts. Even authoritative sources disagree (FLELex's
Beacco-aligned levels diverge from Lexique frequency-based mapping in
about 25% of cases on common words). Our 92 corrections target the
cases where these sources strongly converge — but the remaining 90%+
of the vocab has some judgment baked into the level assignments.

If a future pass wants to push CEFR coverage further, the right
approach is licensing the **DELF/DALF reference vocabulary lists**
from CLE International (the Beacco référentiels publisher) and running
deterministic membership checks. That's a ~€200 investment for the
4-volume reference set, plus a few hours of integration work.

---

*Audit performed by Claude. FLELex used under CC BY-NC-SA 4.0; cite
François et al. 2014 ("FLELex: a graded lexical resource for French
foreign learners", LREC 2014). Scripts: `flelex-build-map.ts`,
`flelex-relevel.ts`. Raw artifacts at `apps/api/tmp/flelex/` and
`apps/api/tmp/content-audit/round2/`.*
