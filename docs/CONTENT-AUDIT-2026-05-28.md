# FrenchUp Content Audit — 2026-05-28

> Cross-checked the production DB against authoritative French sources.
> Methodology: full-DB pattern scan + 120-word random sample + 4 grammar
> topics deep-dive + 5 listening exercises + 1 reading text.

## Sources cited

| Source | URL | Used for |
|--------|-----|----------|
| **Wiktionary FR/EN** | en.wiktionary.org | IPA, gender, common translations |
| **CNRTL / TLFi** | cnrtl.fr | Trésor de la Langue Française — definitive French dictionary |
| **Larousse / Le Robert** | larousse.fr / lerobert.com | Russian/English translation cross-check |
| **Académie française** | academie-francaise.fr | Official spelling and grammar |
| **Bescherelle** | bescherelle.com | Conjugations and tense formation |
| **CEFR Référentiel / Profil français** | rm.coe.int | Level descriptors A1→C2 |
| **Lexique 383** | lexique.org | French word frequency (level appropriateness) |

---

## Executive summary

| Module | Total items | Verdict | Issues found |
|--------|-------------|---------|---------------|
| **Vocabulary** | 3859 active | 🔴 **Major systemic issues** | 1959 records (51%) — IPA broken, taxonomy split, missing fields |
| **Grammar** | 82 topics, 503 exercises | 🟢 **Excellent quality** | 0 systemic issues, only a minor terminological note |
| **Listening** | 43 active | 🟢 **High quality** | 1 minor tense inconsistency in 1/5 sampled |
| **Reading** | 32 texts | 🟢 **High quality** | None in the sample |

**The vocabulary needs significant cleanup before any new content effort.** Grammar / listening / reading don't.

---

## 🔴 Critical findings

### V1 — IPA generation is systemically broken (HIGHEST priority)

**Scope**: Spot-checked 6 random IPAs against Wiktionary — **6/6 wrong** (100% error rate in sample).
Full-DB pattern scan identified 1106 records with structural IPA defects (28.7% of vocab).

**Concrete examples** (DB vs Wiktionary):

| Word | DB IPA | Wiktionary (authoritative) | Defect |
|------|--------|----------------------------|--------|
| quatrième | `ka.tʁi.ɛm` | `/ka.tʁi.jɛm/` | Missing `j` glide |
| avenue | `avənɥy` | `/a.vny/` or `/a.və.ny/` | Invalid `ɥ` glide where `n` should be |
| jean (clothing) | `ʒɑ̃` | `/dʒin/` | Pronounced as the proper name "Jean", not jeans |
| le dessert | `de deˈsɛʁ` | `/de.sɛʁ/` | Duplicated `de` + invalid stress mark `ˈ` |
| étudiant | `e.tu.djɑ̃` | `/e.ty.djɑ̃/` | Wrong vowel `u` instead of `y` (open vs closed) |
| conduire | `kɔ̃.dʁiʁ` | `/kɔ̃.dɥiʁ/` | Missing/jumbled `ɥ` glide |

**Pattern-level counts (full DB)**:
- `ipa-includes-article` (e.g. `lə pɔst` instead of `pɔst`): **1013 records**
- `ipa-stress-mark` (Frenchу does not use ˈ): **40 records**
- `ipa-duplicated` (initial token repeated): **6 records**

**Recommendation**:
1. Re-run IPA generation with stricter prompting: "Return only the IPA of the bare word without articles, without stress marks (French has none), and verify glides (`j`, `ɥ`, `w`) appear where required."
2. Add automated post-validation: regex-strip duplicated leading tokens, strip article prefix, strip stress marks.
3. Random-sample 50 IPAs after regeneration; if >10% still differ from Wiktionary, escalate to per-word manual review.

**Estimated cost**: ~$0.10 to regenerate all 3859 IPAs via gpt-4o-mini with stricter prompts + Wiktionary cross-check.

---

### V2 — `partOfSpeech` taxonomy split: `adj` and `adjective` coexist

**Scope**: 89 records have `partOfSpeech = 'adj'` while the rest of the DB uses `'adjective'`.
Per level: A1=19, A2=24, B1=26, B2=20.

**Impact**: Dictionary filtering breaks (`pos = 'adjective'` query misses the 89 mislabeled).
Statistics under-report adjective coverage.

**Recommendation**: Single SQL UPDATE to normalise to `adjective`:
```sql
UPDATE words SET part_of_speech = 'adjective' WHERE part_of_speech = 'adj';
```
**Risk**: zero. **Time**: 5 seconds.

---

### V3 — 62 nouns with elided article (`l'X`) have `gender: NULL`

**Scope**: Words like `l'addition`, `l'hôpital`, `l'heure`, `l'année`, `l'atterrissage`
store gender as NULL because the article is elided to `l'` regardless of gender.

**Impact**:
- Frontend can't display gender-aware UI ("nf" / "nm" tag)
- Adjective agreement exercises break (system can't tell "la jolie addition" from "le joli hôpital")
- Word-cards lose pedagogical information that matters in French

**Examples cross-checked against CNRTL**:
- `l'addition` → feminine (`la addition`)
- `l'hôpital` → masculine
- `l'heure` → feminine
- `l'année` → feminine
- `l'atterrissage` → masculine

**Recommendation**: One-off backfill script that looks up each `l'X` word in Wiktionary (or asks gpt-4o-mini with a strict prompt) and writes the gender. **~$0.005** cost (62 words × $0.0001).

---

## 🟠 High findings

### V4 — 55 bare nouns (no article in `french` field) have no gender either

**Scope**: Words like `septembre`, `air` are stored without an article AND without gender.
Some are weekdays/months (epicene by convention but technically masculine: `septembre` is masculine in French).
Some are common nouns that should have gender resolved.

**Recommendation**: Same backfill approach as V3 — Wiktionary lookup + gpt-4o-mini fallback.

### V5 — 40 records with stress marks (`ˈ`) in IPA

**Scope**: Stress marks like `de deˈsɛʁ`. French is a syllable-timed language and does not use lexical stress marks in IPA.

**Recommendation**: Single regex strip during V1 IPA regeneration.

---

## 🟡 Medium findings

### V6 — 347 records missing `translationEn`

About 9% of the vocab has only Russian translation. Affects users who selected English UI.

**Recommendation**: gpt-4o-mini batch fill (~$0.02 for all 347).

### V7 — 347 records missing `exampleFr` / `exampleRu`

Same ~9% missing examples. Same gpt-4o-mini batch fill works.

### V8 — 1013 records: IPA includes the article

`la pɔst` instead of `pɔst`. Inconsistent — most records have just the bare word's IPA.

**Recommendation**: Post-process — if `french` starts with `le `, `la `, `l'`, `les `, then strip the matching article phoneme prefix from `ipa`.

### V9 — `pupitre` translation creates confusion (1 case, possibly more)

DB: `pupitre` → "парта, пюпитр" + EN "school desk".
**Issue**: "пюпитр" in Russian means a music stand; in French `pupitre` is more often a lectern or school desk in modern usage. The "парта" usage is dated.

**Recommendation**: Simplify Russian to "парта (школьная)" alone, or add a usage note. Sample-level finding — full audit might surface more confusing translations.

### V10 — One question (listening) has present tense answer for a past-tense transcript

Exercise "Week-end à la campagne" Q4: ответ `ils font un barbecue` (présent), but transcript reads `nous avons préparé un barbecue` (passé composé).

**Recommendation**: Update Q4 option to `ils ont fait un barbecue` or rewrite question wording.

---

## ✅ What's solid (do not touch)

### Grammar (82 topics, 503 exercises)
- **All 4 deeply audited topics** were pedagogically and grammatically correct:
  - `imparfait` — conjugation table, usage rules, all 3 sample exercises ✓
  - `c'est / il est` — covers all 6 patterns with examples that match the rule ✓
  - `voix-passive` — includes the subtle `de` vs `par` distinction for state verbs (aimer/respecter) — high-quality detail ✓
  - `conditionnel-passé` — `si + plus-que-parfait → conditionnel passé` correctly tested ✓
- Structural: all 82 topics have non-empty content, all have ≥3 exercises.
- Minor terminological note: "Кондисьональ" is a transliteration; Russian linguistics standard is **"Условное наклонение"**. Consider renaming `titleRu`.

### Listening (43 exercises, 5 audited)
- All 5 transcripts coherent, grammatically clean French.
- All questions verifiable from transcripts.
- B2 topic ("migrations climatiques") is genuinely sophisticated — high pedagogical value.
- ⚠️ The one tense inconsistency in `Week-end à la campagne` is the only finding.

### Reading (32 texts, 1 audited)
- B2 text on UNESCO/gastronomy is well-written, native-like French.
- Questions test comprehension at appropriate depth (factual + inferential).
- wordMap includes function words with translations.

---

## CEFR-level appropriateness spot-check

Quick check of a few words against the **CEFR Référentiel A1** (Conseil de l'Europe, "Niveau A1 pour le français"):
- `peu`, `hier`, `vache`, `septembre`, `mardi`, `enchanté`, `derrière`, `jean` (clothing) — all present in A1 official lists ✓
- `pupitre` — NOT in A1 standard frequency lists; appears in A2+ frequency bands. **Should likely be A2, not A1.**
- `l'addition` — A1 standard (restaurant vocabulary) ✓

**Recommendation**: Full Lexique 383 frequency cross-check would surface ~50-100 mislevelled words. Not blocking — defer until after V1-V3 fixes.

---

## Recommended remediation order

| # | Action | Effort | Cost | Records affected |
|---|--------|--------|------|------------------|
| 1 | `UPDATE words SET pos='adjective' WHERE pos='adj'` (V2) | 5 sec | $0 | 89 |
| 2 | Strip article phoneme prefix from IPA for words starting with le/la/l'/les (V8) | 30 min script | $0 | 1013 |
| 3 | Strip ˈ stress marks from IPA + fix duplicated leading tokens (V5 + V1 part) | 15 min script | $0 | 46 |
| 4 | Backfill gender for `l'X` and bare nouns (V3 + V4) | 1h script + AI batch | $0.005 | 117 |
| 5 | Regenerate IPA with stricter prompt + Wiktionary validation (V1 main) | 2-3h | $0.10 | 3859 |
| 6 | Backfill missing translationEn + examples (V6 + V7) | 1h | $0.05 | 347 |
| 7 | Listening Q4 wording fix (V10) | 1 min | $0 | 1 |
| 8 | Full Lexique-383 level cross-check (deferred) | 1-2 days | $0 | ~50-100 estimated |

**Total cost to clean the vocabulary**: **~$0.16** + ~5-6 hours of script work.

---

## What this audit did NOT cover

- **Audio-transcript alignment**: would need to listen to each MP3 or re-run Whisper. Defer to a separate audio-quality pass.
- **Conjugation table correctness** beyond the 4 grammar topics audited.
- **Reading questions on all 32 texts** — only 1 sample text reviewed in depth.
- **Grammar exercise variety** beyond `multiple_choice / fill_blank / translate / reorder` distribution.
- **Custom user words** (Dictionary "+" feature) — not audited.

---

*Audit performed by Claude. Sources cross-referenced live during the audit. Raw findings JSON at `apps/api/tmp/content-audit/full-scan-findings.json`.*
