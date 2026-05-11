import type { TenseSet } from './regular.js';

/**
 * Hardcoded irregular verbs. Each verb's TenseSet is the source of truth —
 * we don't try to derive irregulars from rules.
 *
 * Auxiliary in passé composé is baked into the array (most use "avoir"; the
 * motion verbs use "être" and the participle agrees with the subject, but for
 * the table view we show the masculine-singular form as the canonical).
 */

export const IRREGULAR_VERBS: Record<string, TenseSet> = {
  // ── être ────────────────────────────────────────────────────────────────
  'être': {
    present:      ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
    passeCompose: ['ai été', 'as été', 'a été', 'avons été', 'avez été', 'ont été'],
    imparfait:    ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
    futurSimple:  ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
    conditionnel: ['serais', 'serais', 'serait', 'serions', 'seriez', 'seraient'],
    subjonctif:   ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'],
    imperatif:    ['sois', 'soyons', 'soyez'],
  },

  // ── avoir ───────────────────────────────────────────────────────────────
  'avoir': {
    present:      ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    passeCompose: ['ai eu', 'as eu', 'a eu', 'avons eu', 'avez eu', 'ont eu'],
    imparfait:    ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
    futurSimple:  ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
    conditionnel: ['aurais', 'aurais', 'aurait', 'aurions', 'auriez', 'auraient'],
    subjonctif:   ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'],
    imperatif:    ['aie', 'ayons', 'ayez'],
  },

  // ── aller ───────────────────────────────────────────────────────────────
  'aller': {
    present:      ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
    passeCompose: ['suis allé', 'es allé', 'est allé', 'sommes allés', 'êtes allés', 'sont allés'],
    imparfait:    ['allais', 'allais', 'allait', 'allions', 'alliez', 'allaient'],
    futurSimple:  ['irai', 'iras', 'ira', 'irons', 'irez', 'iront'],
    conditionnel: ['irais', 'irais', 'irait', 'irions', 'iriez', 'iraient'],
    subjonctif:   ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'],
    imperatif:    ['va', 'allons', 'allez'],
  },

  // ── faire ───────────────────────────────────────────────────────────────
  'faire': {
    present:      ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
    passeCompose: ['ai fait', 'as fait', 'a fait', 'avons fait', 'avez fait', 'ont fait'],
    imparfait:    ['faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'],
    futurSimple:  ['ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront'],
    conditionnel: ['ferais', 'ferais', 'ferait', 'ferions', 'feriez', 'feraient'],
    subjonctif:   ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'],
    imperatif:    ['fais', 'faisons', 'faites'],
  },

  // ── dire ────────────────────────────────────────────────────────────────
  'dire': {
    present:      ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
    passeCompose: ['ai dit', 'as dit', 'a dit', 'avons dit', 'avez dit', 'ont dit'],
    imparfait:    ['disais', 'disais', 'disait', 'disions', 'disiez', 'disaient'],
    futurSimple:  ['dirai', 'diras', 'dira', 'dirons', 'direz', 'diront'],
    conditionnel: ['dirais', 'dirais', 'dirait', 'dirions', 'diriez', 'diraient'],
    subjonctif:   ['dise', 'dises', 'dise', 'disions', 'disiez', 'disent'],
    imperatif:    ['dis', 'disons', 'dites'],
  },

  // ── pouvoir ─────────────────────────────────────────────────────────────
  'pouvoir': {
    present:      ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
    passeCompose: ['ai pu', 'as pu', 'a pu', 'avons pu', 'avez pu', 'ont pu'],
    imparfait:    ['pouvais', 'pouvais', 'pouvait', 'pouvions', 'pouviez', 'pouvaient'],
    futurSimple:  ['pourrai', 'pourras', 'pourra', 'pourrons', 'pourrez', 'pourront'],
    conditionnel: ['pourrais', 'pourrais', 'pourrait', 'pourrions', 'pourriez', 'pourraient'],
    subjonctif:   ['puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'],
    imperatif:    ['—', '—', '—'], // pouvoir has no impératif
  },

  // ── vouloir ─────────────────────────────────────────────────────────────
  'vouloir': {
    present:      ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
    passeCompose: ['ai voulu', 'as voulu', 'a voulu', 'avons voulu', 'avez voulu', 'ont voulu'],
    imparfait:    ['voulais', 'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient'],
    futurSimple:  ['voudrai', 'voudras', 'voudra', 'voudrons', 'voudrez', 'voudront'],
    conditionnel: ['voudrais', 'voudrais', 'voudrait', 'voudrions', 'voudriez', 'voudraient'],
    subjonctif:   ['veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent'],
    imperatif:    ['veuille', 'veuillons', 'veuillez'],
  },

  // ── devoir ──────────────────────────────────────────────────────────────
  'devoir': {
    present:      ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'],
    passeCompose: ['ai dû', 'as dû', 'a dû', 'avons dû', 'avez dû', 'ont dû'],
    imparfait:    ['devais', 'devais', 'devait', 'devions', 'deviez', 'devaient'],
    futurSimple:  ['devrai', 'devras', 'devra', 'devrons', 'devrez', 'devront'],
    conditionnel: ['devrais', 'devrais', 'devrait', 'devrions', 'devriez', 'devraient'],
    subjonctif:   ['doive', 'doives', 'doive', 'devions', 'deviez', 'doivent'],
    imperatif:    ['—', '—', '—'],
  },

  // ── savoir ──────────────────────────────────────────────────────────────
  'savoir': {
    present:      ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
    passeCompose: ['ai su', 'as su', 'a su', 'avons su', 'avez su', 'ont su'],
    imparfait:    ['savais', 'savais', 'savait', 'savions', 'saviez', 'savaient'],
    futurSimple:  ['saurai', 'sauras', 'saura', 'saurons', 'saurez', 'sauront'],
    conditionnel: ['saurais', 'saurais', 'saurait', 'saurions', 'sauriez', 'sauraient'],
    subjonctif:   ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'],
    imperatif:    ['sache', 'sachons', 'sachez'],
  },

  // ── venir ───────────────────────────────────────────────────────────────
  'venir': {
    present:      ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
    passeCompose: ['suis venu', 'es venu', 'est venu', 'sommes venus', 'êtes venus', 'sont venus'],
    imparfait:    ['venais', 'venais', 'venait', 'venions', 'veniez', 'venaient'],
    futurSimple:  ['viendrai', 'viendras', 'viendra', 'viendrons', 'viendrez', 'viendront'],
    conditionnel: ['viendrais', 'viendrais', 'viendrait', 'viendrions', 'viendriez', 'viendraient'],
    subjonctif:   ['vienne', 'viennes', 'vienne', 'venions', 'veniez', 'viennent'],
    imperatif:    ['viens', 'venons', 'venez'],
  },

  // ── tenir (same pattern as venir) ──────────────────────────────────────
  'tenir': {
    present:      ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'],
    passeCompose: ['ai tenu', 'as tenu', 'a tenu', 'avons tenu', 'avez tenu', 'ont tenu'],
    imparfait:    ['tenais', 'tenais', 'tenait', 'tenions', 'teniez', 'tenaient'],
    futurSimple:  ['tiendrai', 'tiendras', 'tiendra', 'tiendrons', 'tiendrez', 'tiendront'],
    conditionnel: ['tiendrais', 'tiendrais', 'tiendrait', 'tiendrions', 'tiendriez', 'tiendraient'],
    subjonctif:   ['tienne', 'tiennes', 'tienne', 'tenions', 'teniez', 'tiennent'],
    imperatif:    ['tiens', 'tenons', 'tenez'],
  },

  // ── voir ────────────────────────────────────────────────────────────────
  'voir': {
    present:      ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
    passeCompose: ['ai vu', 'as vu', 'a vu', 'avons vu', 'avez vu', 'ont vu'],
    imparfait:    ['voyais', 'voyais', 'voyait', 'voyions', 'voyiez', 'voyaient'],
    futurSimple:  ['verrai', 'verras', 'verra', 'verrons', 'verrez', 'verront'],
    conditionnel: ['verrais', 'verrais', 'verrait', 'verrions', 'verriez', 'verraient'],
    subjonctif:   ['voie', 'voies', 'voie', 'voyions', 'voyiez', 'voient'],
    imperatif:    ['vois', 'voyons', 'voyez'],
  },

  // ── prendre ─────────────────────────────────────────────────────────────
  'prendre': {
    present:      ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
    passeCompose: ['ai pris', 'as pris', 'a pris', 'avons pris', 'avez pris', 'ont pris'],
    imparfait:    ['prenais', 'prenais', 'prenait', 'prenions', 'preniez', 'prenaient'],
    futurSimple:  ['prendrai', 'prendras', 'prendra', 'prendrons', 'prendrez', 'prendront'],
    conditionnel: ['prendrais', 'prendrais', 'prendrait', 'prendrions', 'prendriez', 'prendraient'],
    subjonctif:   ['prenne', 'prennes', 'prenne', 'prenions', 'preniez', 'prennent'],
    imperatif:    ['prends', 'prenons', 'prenez'],
  },

  // ── mettre ──────────────────────────────────────────────────────────────
  'mettre': {
    present:      ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'],
    passeCompose: ['ai mis', 'as mis', 'a mis', 'avons mis', 'avez mis', 'ont mis'],
    imparfait:    ['mettais', 'mettais', 'mettait', 'mettions', 'mettiez', 'mettaient'],
    futurSimple:  ['mettrai', 'mettras', 'mettra', 'mettrons', 'mettrez', 'mettront'],
    conditionnel: ['mettrais', 'mettrais', 'mettrait', 'mettrions', 'mettriez', 'mettraient'],
    subjonctif:   ['mette', 'mettes', 'mette', 'mettions', 'mettiez', 'mettent'],
    imperatif:    ['mets', 'mettons', 'mettez'],
  },

  // ── partir / sortir (same pattern) ────────────────────────────────────
  'partir': {
    present:      ['pars', 'pars', 'part', 'partons', 'partez', 'partent'],
    passeCompose: ['suis parti', 'es parti', 'est parti', 'sommes partis', 'êtes partis', 'sont partis'],
    imparfait:    ['partais', 'partais', 'partait', 'partions', 'partiez', 'partaient'],
    futurSimple:  ['partirai', 'partiras', 'partira', 'partirons', 'partirez', 'partiront'],
    conditionnel: ['partirais', 'partirais', 'partirait', 'partirions', 'partiriez', 'partiraient'],
    subjonctif:   ['parte', 'partes', 'parte', 'partions', 'partiez', 'partent'],
    imperatif:    ['pars', 'partons', 'partez'],
  },
  'sortir': {
    present:      ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'],
    passeCompose: ['suis sorti', 'es sorti', 'est sorti', 'sommes sortis', 'êtes sortis', 'sont sortis'],
    imparfait:    ['sortais', 'sortais', 'sortait', 'sortions', 'sortiez', 'sortaient'],
    futurSimple:  ['sortirai', 'sortiras', 'sortira', 'sortirons', 'sortirez', 'sortiront'],
    conditionnel: ['sortirais', 'sortirais', 'sortirait', 'sortirions', 'sortiriez', 'sortiraient'],
    subjonctif:   ['sorte', 'sortes', 'sorte', 'sortions', 'sortiez', 'sortent'],
    imperatif:    ['sors', 'sortons', 'sortez'],
  },

  // ── lire ────────────────────────────────────────────────────────────────
  'lire': {
    present:      ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
    passeCompose: ['ai lu', 'as lu', 'a lu', 'avons lu', 'avez lu', 'ont lu'],
    imparfait:    ['lisais', 'lisais', 'lisait', 'lisions', 'lisiez', 'lisaient'],
    futurSimple:  ['lirai', 'liras', 'lira', 'lirons', 'lirez', 'liront'],
    conditionnel: ['lirais', 'lirais', 'lirait', 'lirions', 'liriez', 'liraient'],
    subjonctif:   ['lise', 'lises', 'lise', 'lisions', 'lisiez', 'lisent'],
    imperatif:    ['lis', 'lisons', 'lisez'],
  },

  // ── écrire ──────────────────────────────────────────────────────────────
  'écrire': {
    present:      ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
    passeCompose: ['ai écrit', 'as écrit', 'a écrit', 'avons écrit', 'avez écrit', 'ont écrit'],
    imparfait:    ['écrivais', 'écrivais', 'écrivait', 'écrivions', 'écriviez', 'écrivaient'],
    futurSimple:  ['écrirai', 'écriras', 'écrira', 'écrirons', 'écrirez', 'écriront'],
    conditionnel: ['écrirais', 'écrirais', 'écrirait', 'écririons', 'écririez', 'écriraient'],
    subjonctif:   ['écrive', 'écrives', 'écrive', 'écrivions', 'écriviez', 'écrivent'],
    imperatif:    ['écris', 'écrivons', 'écrivez'],
  },

  // ── boire ───────────────────────────────────────────────────────────────
  'boire': {
    present:      ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'],
    passeCompose: ['ai bu', 'as bu', 'a bu', 'avons bu', 'avez bu', 'ont bu'],
    imparfait:    ['buvais', 'buvais', 'buvait', 'buvions', 'buviez', 'buvaient'],
    futurSimple:  ['boirai', 'boiras', 'boira', 'boirons', 'boirez', 'boiront'],
    conditionnel: ['boirais', 'boirais', 'boirait', 'boirions', 'boiriez', 'boiraient'],
    subjonctif:   ['boive', 'boives', 'boive', 'buvions', 'buviez', 'boivent'],
    imperatif:    ['bois', 'buvons', 'buvez'],
  },

  // ── connaître ───────────────────────────────────────────────────────────
  'connaître': {
    present:      ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'],
    passeCompose: ['ai connu', 'as connu', 'a connu', 'avons connu', 'avez connu', 'ont connu'],
    imparfait:    ['connaissais', 'connaissais', 'connaissait', 'connaissions', 'connaissiez', 'connaissaient'],
    futurSimple:  ['connaîtrai', 'connaîtras', 'connaîtra', 'connaîtrons', 'connaîtrez', 'connaîtront'],
    conditionnel: ['connaîtrais', 'connaîtrais', 'connaîtrait', 'connaîtrions', 'connaîtriez', 'connaîtraient'],
    subjonctif:   ['connaisse', 'connaisses', 'connaisse', 'connaissions', 'connaissiez', 'connaissent'],
    imperatif:    ['connais', 'connaissons', 'connaissez'],
  },

  // ── vivre ───────────────────────────────────────────────────────────────
  'vivre': {
    present:      ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'],
    passeCompose: ['ai vécu', 'as vécu', 'a vécu', 'avons vécu', 'avez vécu', 'ont vécu'],
    imparfait:    ['vivais', 'vivais', 'vivait', 'vivions', 'viviez', 'vivaient'],
    futurSimple:  ['vivrai', 'vivras', 'vivra', 'vivrons', 'vivrez', 'vivront'],
    conditionnel: ['vivrais', 'vivrais', 'vivrait', 'vivrions', 'vivriez', 'vivraient'],
    subjonctif:   ['vive', 'vives', 'vive', 'vivions', 'viviez', 'vivent'],
    imperatif:    ['vis', 'vivons', 'vivez'],
  },

  // ── courir ──────────────────────────────────────────────────────────────
  'courir': {
    present:      ['cours', 'cours', 'court', 'courons', 'courez', 'courent'],
    passeCompose: ['ai couru', 'as couru', 'a couru', 'avons couru', 'avez couru', 'ont couru'],
    imparfait:    ['courais', 'courais', 'courait', 'courions', 'couriez', 'couraient'],
    futurSimple:  ['courrai', 'courras', 'courra', 'courrons', 'courrez', 'courront'],
    conditionnel: ['courrais', 'courrais', 'courrait', 'courrions', 'courriez', 'courraient'],
    subjonctif:   ['coure', 'coures', 'coure', 'courions', 'couriez', 'courent'],
    imperatif:    ['cours', 'courons', 'courez'],
  },

  // ── ouvrir / offrir / découvrir (conjugate like -er in présent) ────────
  'ouvrir': {
    present:      ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'],
    passeCompose: ['ai ouvert', 'as ouvert', 'a ouvert', 'avons ouvert', 'avez ouvert', 'ont ouvert'],
    imparfait:    ['ouvrais', 'ouvrais', 'ouvrait', 'ouvrions', 'ouvriez', 'ouvraient'],
    futurSimple:  ['ouvrirai', 'ouvriras', 'ouvrira', 'ouvrirons', 'ouvrirez', 'ouvriront'],
    conditionnel: ['ouvrirais', 'ouvrirais', 'ouvrirait', 'ouvririons', 'ouvririez', 'ouvriraient'],
    subjonctif:   ['ouvre', 'ouvres', 'ouvre', 'ouvrions', 'ouvriez', 'ouvrent'],
    imperatif:    ['ouvre', 'ouvrons', 'ouvrez'],
  },
  'offrir': {
    present:      ['offre', 'offres', 'offre', 'offrons', 'offrez', 'offrent'],
    passeCompose: ['ai offert', 'as offert', 'a offert', 'avons offert', 'avez offert', 'ont offert'],
    imparfait:    ['offrais', 'offrais', 'offrait', 'offrions', 'offriez', 'offraient'],
    futurSimple:  ['offrirai', 'offriras', 'offrira', 'offrirons', 'offrirez', 'offriront'],
    conditionnel: ['offrirais', 'offrirais', 'offrirait', 'offririons', 'offririez', 'offriraient'],
    subjonctif:   ['offre', 'offres', 'offre', 'offrions', 'offriez', 'offrent'],
    imperatif:    ['offre', 'offrons', 'offrez'],
  },

  // ── croire ──────────────────────────────────────────────────────────────
  'croire': {
    present:      ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'],
    passeCompose: ['ai cru', 'as cru', 'a cru', 'avons cru', 'avez cru', 'ont cru'],
    imparfait:    ['croyais', 'croyais', 'croyait', 'croyions', 'croyiez', 'croyaient'],
    futurSimple:  ['croirai', 'croiras', 'croira', 'croirons', 'croirez', 'croiront'],
    conditionnel: ['croirais', 'croirais', 'croirait', 'croirions', 'croiriez', 'croiraient'],
    subjonctif:   ['croie', 'croies', 'croie', 'croyions', 'croyiez', 'croient'],
    imperatif:    ['crois', 'croyons', 'croyez'],
  },

  // ── recevoir (apercevoir, décevoir follow the same pattern) ─────────────
  'recevoir': {
    present:      ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'],
    passeCompose: ['ai reçu', 'as reçu', 'a reçu', 'avons reçu', 'avez reçu', 'ont reçu'],
    imparfait:    ['recevais', 'recevais', 'recevait', 'recevions', 'receviez', 'recevaient'],
    futurSimple:  ['recevrai', 'recevras', 'recevra', 'recevrons', 'recevrez', 'recevront'],
    conditionnel: ['recevrais', 'recevrais', 'recevrait', 'recevrions', 'recevriez', 'recevraient'],
    subjonctif:   ['reçoive', 'reçoives', 'reçoive', 'recevions', 'receviez', 'reçoivent'],
    imperatif:    ['reçois', 'recevons', 'recevez'],
  },

  // ── conduire ────────────────────────────────────────────────────────────
  'conduire': {
    present:      ['conduis', 'conduis', 'conduit', 'conduisons', 'conduisez', 'conduisent'],
    passeCompose: ['ai conduit', 'as conduit', 'a conduit', 'avons conduit', 'avez conduit', 'ont conduit'],
    imparfait:    ['conduisais', 'conduisais', 'conduisait', 'conduisions', 'conduisiez', 'conduisaient'],
    futurSimple:  ['conduirai', 'conduiras', 'conduira', 'conduirons', 'conduirez', 'conduiront'],
    conditionnel: ['conduirais', 'conduirais', 'conduirait', 'conduirions', 'conduiriez', 'conduiraient'],
    subjonctif:   ['conduise', 'conduises', 'conduise', 'conduisions', 'conduisiez', 'conduisent'],
    imperatif:    ['conduis', 'conduisons', 'conduisez'],
  },

  // ── suivre ──────────────────────────────────────────────────────────────
  'suivre': {
    present:      ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'],
    passeCompose: ['ai suivi', 'as suivi', 'a suivi', 'avons suivi', 'avez suivi', 'ont suivi'],
    imparfait:    ['suivais', 'suivais', 'suivait', 'suivions', 'suiviez', 'suivaient'],
    futurSimple:  ['suivrai', 'suivras', 'suivra', 'suivrons', 'suivrez', 'suivront'],
    conditionnel: ['suivrais', 'suivrais', 'suivrait', 'suivrions', 'suiviez', 'suivraient'],
    subjonctif:   ['suive', 'suives', 'suive', 'suivions', 'suiviez', 'suivent'],
    imperatif:    ['suis', 'suivons', 'suivez'],
  },
};
