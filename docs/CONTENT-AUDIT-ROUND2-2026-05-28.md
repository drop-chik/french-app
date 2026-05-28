# FrenchUp Content Audit — Round 2 (2026-05-28)

> Follow-up to `CONTENT-AUDIT-2026-05-28.md` after vocabulary remediation
> closed the 1959 pattern-defect findings. Round 2 targets the audit areas
> that round 1 explicitly deferred or only sampled lightly:
>
>   - Grammar exercises (32 random across A1-B2)
>   - Reading texts (10 of 32 active, ~31% coverage)
>   - CEFR-level appropriateness (200 random words, 50/level)
>
> Audio↔transcript alignment (would have required Whisper) was excluded
> per user direction.

## Sources

| Source | Used for |
|--------|----------|
| Bescherelle, Académie française, Grevisse "Le Bon Usage" | Grammar exercise answer verification |
| Wiktionary FR/EN | CEFR cross-checks where queryable |
| CEFR Référentiel A1-B2 (Conseil de l'Europe) + Profil français | Level-appropriateness baseline |
| Lexique 383 frequency bands | Tiebreaker (lexique.org was unreachable; used AI's internal knowledge of frequency) |
| gpt-4o-mini with explicit CEFR criteria | Bulk level cross-check (200-word sample) |

---

## Executive summary

| Module | Sampled | Verdict | Findings |
|--------|---------|---------|----------|
| **Grammar exercises** | 32 / 503 (6.4%) | 🟢 **Excellent** | 0 wrong answers, 1 duplicate option (fixed) |
| **Reading texts** | 10 / 32 (31%) | 🟢 **Excellent** | 0 issues — all native-quality French |
| **CEFR levels** | 200 / 3859 (5.2%) | 🟡 **Mostly OK** | AI shows +1 systematic bias; 14 borderline downgrade candidates (not a remediation priority) |

**Single actionable fix applied**: Step 8 — replaced a duplicate option in the `adjectives-agreement` exercise. **0** wrong answers found in either grammar or reading audits.

---

## Grammar exercises (32 sampled, stratified 8 per level)

Every exercise verified for: answer correctness, explanation accuracy, option distinctness, level-appropriate difficulty.

**Results**: 31/32 perfect. The one finding:

### G1 — Duplicate option in multiple-choice (Critical → FIXED)
- Exercise `9116d971-9b27-4223-b330-cdf3de269e99` (`adjectives-agreement`, A1)
- Question: "des enfants ___ (heureux)"
- Options before: `["heureux", "heureuse", "heureuses", "heureux"]` ← position 0 and 3 identical
- Options after: `["heureux", "heureuse", "heureuses", "heureuxes"]` ← position 3 replaced with a learner-error form, so the exercise still tests the right discrimination
- Fix script: `apps/api/src/scripts/fix-content-step8-dup-option.ts`

### Notes (no fixes needed)

- Articles, conjugations (être/avoir, futur simple of `faire`, irregular stems), reflexive pronouns, partitive vs definite, agreement of adjectives, c'est/il est, imparfait, passé composé with both auxiliaries, gérondif, subjonctif after `Il est important que` / `Bien que`, pronoms relatifs (`dont`, `où`, composés `laquelle`), conditionnel passé, conditionnel journalistique (`aurait annoncé`), participe présent vs gérondif, nominalisation, propositions participiales (`Ayant fini`, `Étant`), discours indirect au passé with `le lendemain` time shift — all sampled, all correct.

---

## Reading texts (10 of 32 active = 31% coverage)

Every text checked for: native-quality French, level-appropriate vocabulary, question answerability from text, distractor plausibility.

| Slug | Level | Wc | Q | Verdict |
|------|-------|-----|----|---------|
| `a1-mon-chat-leo` | A1 | 107 | 4 | ✅ |
| `a1-mon-ecole` | A1 | 133 | 4 | ✅ |
| `a1-mon-anniversaire` | A1 | 140 | 4 | ✅ |
| `a2-mon-quartier` | A2 | 167 | 4 | ✅ |
| `a2-rencontre-train` | A2 | 174 | 4 | ✅ |
| `b1-cinema-francais` | B1 | 206 | 4 | ✅ |
| `b1-jeunes-environnement` | B1 | 204 | 4 | ✅ |
| `b2-intelligence-artificielle` | B2 | 300 | 5 | ✅ (incl. Vrai/Faux/NM Q5 format) |
| `b2-economie-partage` | B2 | 370 | 5 | ✅ |
| `b2-jeunesse-politique` | B2 | 391 | 5 | ✅ |

**No issues found.** Across all 10 texts: native-near French, level-appropriate vocabulary, well-distractored questions, every correct answer verifiable from the text.

---

## CEFR-level cross-check (200 words, 50 per level)

**Methodology caveat:** Authoritative CEFR vocabulary lists (DELF/DALF
reference, lexique.org's level-tagged subsets) were not directly queryable.
Used gpt-4o-mini with explicit Référentiel criteria as a proxy.

**Confusion matrix** (rows = DB level, columns = AI verdict):

| DB \\ AI | A1 | A2 | B1 | B2 | C1 | C2 |
|---------|----|----|----|----|----|----|
| **A1** (50) | 16 | 29 | 5 | 0 | 0 | 0 |
| **A2** (50) | 2 | 18 | 14 | 15 | 1 | 0 |
| **B1** (50) | 1 | 7 | 10 | 28 | 4 | 0 |
| **B2** (50) | 0 | 0 | 4 | 14 | 24 | 8 |

**Key reading:**
- Diagonal (exact match) = 58/200 = 29% — barely above random.
- Within ±1 level (the band where reasonable curricula disagree) = ~74%.
- AI shows a **systematic +1 bias**: A1 words get assigned A2 most often, B1 → B2, B2 → C1.

This pattern is much better explained by AI over-rating difficulty than by widespread mis-leveling in the DB.

### Potentially over-leveled words (14 candidates AI judges lower than stored)

These are the only direction where AI bias does NOT explain the disagreement, so they're the most actionable signal:

| Word | DB | AI says | Notes |
|------|----|---------|-------|
| `autour` (prep.) | B1 | A1 | "autour de" is in many A1 syllabi |
| `le ciel` | A2 | A1 | very common, A1 plausible |
| `chaussettes` | A2 | A1 | basic clothing, A1 plausible |
| `la côte` | B1 | A2 | borderline |
| `aventure` | B1 | A2 | common cognate |
| `en général` | B1 | A2 | common connector |
| `la prison` | B1 | A2 | borderline |
| `respecter` | B1 | A2 | borderline |
| `la une` | B1 | A2 | "front page" — B1 actually defensible |
| `la randonnée` | B1 | A2 | borderline |
| `la compétence` | B2 | B1 | borderline |
| `renoncer` | B2 | B1 | borderline |
| `la liste d'attente` | B2 | B1 | borderline |
| `le récit` | B2 | B1 | borderline |

**Recommendation: do NOT remediate at this time.** These are borderline cases where official curricula disagree. None are dramatically mis-leveled (no word at B2 that's actually A1, or vice versa). Re-leveling them risks creating new inconsistencies without authoritative source backing.

If the level audit is ever revisited, the right approach would be to source the official DELF A1/A2 reference vocabulary lists (publicly available via the Cadre européen commun de référence) and run a deterministic membership check rather than relying on AI judgement.

---

## What round 2 *did not* cover

- **Audio↔transcript alignment** — excluded per user direction (would have required Whisper re-run).
- **Conjugation table accuracy** for individual verbs beyond what the audited grammar topics use.
- **Custom user words** (Dictionary `+` feature) — not in scope.

---

## Cumulative state after both audit rounds

| Module | Round 1 finding | Round 2 finding | Current state |
|--------|----------------|-----------------|---------------|
| Vocabulary patterns (POS, gender, IPA bugs) | 1959 | — | **0** (remediated) |
| Vocabulary IPA accuracy vs Wiktionary | 0/6 | — | **5/5** spot-check correct |
| Grammar exercises | 0 wrong | 0 wrong + 1 duplicate option (fixed) | **0** |
| Listening | 1 tense mismatch (fixed) | — | **0** |
| Reading | 0 in 1-text sample | 0 in 10-text sample | **0** |
| CEFR levels | sample 'pupitre' noted as borderline | 14 borderline candidates, no clear errors | **Not a remediation priority** |

**Total cost of all remediation: ~$0.18 in OpenAI calls.**

---

*Audit performed by Claude. Raw findings JSON at `apps/api/tmp/content-audit/round2/`. Fix scripts: `apps/api/src/scripts/fix-content-step1..step8.ts`.*
