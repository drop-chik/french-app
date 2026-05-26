import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { conjugationApi } from '../../features/conjugation/api';
import { useI18n } from '../../shared/i18n';
import styles from './ConjugationPage.module.css';

// French personal pronouns for the conjugation table
const FR_PRONOUNS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const;

// Translations shown in small under each French pronoun (per UI language)
const RU_HINTS = ['я', 'ты', 'он/она', 'мы', 'вы', 'они'] as const;
const EN_HINTS = ['I', 'you', 'he/she', 'we', 'you', 'they'] as const;

// Impératif uses these labels (no first-person singular)
const IMPERATIVE_FR = ['(tu)', '(nous)', '(vous)'] as const;
const IMPERATIVE_RU = ['ты', 'мы', 'вы'] as const;
const IMPERATIVE_EN = ['you', 'let\'s', 'you (pl.)'] as const;

// Subjonctif is typically prefixed with "que" in the table
const SUBJ_PRONOUNS = ['que je', 'que tu', "qu'il", 'que nous', 'que vous', "qu'ils"] as const;

const TENSE_ORDER: Array<{
  key: 'present' | 'passeCompose' | 'imparfait' | 'futurSimple' | 'conditionnel' | 'subjonctif';
  level: 'A1' | 'A2' | 'B1';
}> = [
  { key: 'present',      level: 'A1' },
  { key: 'passeCompose', level: 'A1' },
  { key: 'imparfait',    level: 'A2' },
  { key: 'futurSimple',  level: 'A2' },
  { key: 'conditionnel', level: 'B1' },
  { key: 'subjonctif',   level: 'B1' },
];

const SUGGESTED_VERBS = ['être', 'avoir', 'aller', 'faire', 'parler', 'finir', 'prendre', 'pouvoir', 'vouloir', 'dire', 'voir', 'venir'];

// Vowel / mute-h test used for élision: je → j' before a vowel-initial form
const VOWEL_START = /^[aeiouyhéèêëàâîïôûüœæ]/i;

function buildPronoun(base: string, form: string): string {
  // "je" elides to "j'" before a vowel: j'ai, j'étais, j'irai…
  if (base === 'je' && VOWEL_START.test(form)) return "j'";
  // "que je" → "que j'" before a vowel
  if (base === 'que je' && VOWEL_START.test(form)) return "que j'";
  // "qu'il" / "qu'ils" already elided in the constant — keep as is
  return `${base} `;
}

export function ConjugationPage() {
  const { t, lang } = useI18n();
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isFetching, error } = useQuery({
    queryKey: ['conjugation', submitted],
    queryFn: () => conjugationApi.conjugate(submitted),
    enabled: submitted.length >= 2,
    retry: false,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = input.trim().toLowerCase();
    if (v.length >= 2) setSubmitted(v);
  }

  function handleSuggestion(verb: string) {
    setInput(verb);
    setSubmitted(verb);
  }

  const hints = lang === 'ru' ? RU_HINTS : EN_HINTS;
  const imperativeHints = lang === 'ru' ? IMPERATIVE_RU : IMPERATIVE_EN;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <BookOpen size={26} className={styles.titleIcon} />
          <div>
            <h1 className={styles.title}>{t.conjugation.title}</h1>
            <p className={styles.subtitle}>{t.conjugation.subtitle}</p>
          </div>
        </div>
      </div>

      <form className={styles.searchForm} onSubmit={handleSubmit} data-tour="conj-form">
        <div className={styles.searchRow}>
          <div className={styles.inputWrap}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.conjugation.placeholder}
              className={styles.searchInput}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className={styles.searchBtn} disabled={input.trim().length < 2}>
            {t.conjugation.searchBtn}
          </button>
        </div>
        <div className={styles.suggestions}>
          <span className={styles.suggestionsLabel}>{t.conjugation.tryAlso}</span>
          {SUGGESTED_VERBS.map((v) => (
            <button
              key={v}
              type="button"
              className={styles.suggestionPill}
              onClick={() => handleSuggestion(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </form>

      {submitted && (
        <div className={styles.resultWrap}>
          {isFetching && <div className={styles.loading}>{t.common.loading}</div>}

          {error && !isFetching && (
            <div className={styles.errorCard}>
              <AlertCircle size={20} />
              <div>
                <p className={styles.errorTitle}>{t.conjugation.errorTitle}</p>
                <p className={styles.errorMsg}>
                  {String(t.conjugation.errorBody).replace('{verb}', submitted)}
                </p>
              </div>
            </div>
          )}

          {data && !isFetching && (
            <>
              <div className={styles.verbHeader}>
                <div>
                  <h2 className={styles.verbInf}>{data.infinitive}</h2>
                  {data.isIrregular && (
                    <span className={styles.irregularTag}>
                      <Sparkles size={12} /> {t.conjugation.irregular}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.tensesGrid}>
                {TENSE_ORDER.map(({ key, level }) => {
                  const forms = data.tenses[key];
                  const pronouns = key === 'subjonctif' ? SUBJ_PRONOUNS : FR_PRONOUNS;
                  return (
                    <TenseCard
                      key={key}
                      title={t.conjugation.tenses[key]}
                      level={level}
                      pronouns={pronouns as unknown as readonly string[]}
                      hints={hints as unknown as readonly string[]}
                      forms={forms}
                      isSubjonctif={key === 'subjonctif'}
                    />
                  );
                })}
                <TenseCard
                  title={t.conjugation.tenses.imperatif}
                  level="A1"
                  pronouns={IMPERATIVE_FR as unknown as readonly string[]}
                  hints={imperativeHints as unknown as readonly string[]}
                  forms={data.tenses.imperatif}
                  isImperative
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TenseCard({
  title,
  level,
  pronouns,
  hints,
  forms,
  isSubjonctif,
  isImperative,
}: {
  title: string;
  level: string;
  pronouns: readonly string[];
  hints: readonly string[];
  forms: readonly string[];
  isSubjonctif?: boolean;
  isImperative?: boolean;
}) {
  const LEVEL_COLORS: Record<string, string> = {
    A1: '#22c55e',
    A2: '#3b82f6',
    B1: '#f59e0b',
    B2: '#8b5cf6',
  };
  return (
    <div className={styles.tenseCard}>
      <div className={styles.tenseHeader}>
        <h3 className={styles.tenseTitle}>{title}</h3>
        <span
          className={styles.tenseLevel}
          style={{ color: LEVEL_COLORS[level], background: `${LEVEL_COLORS[level]}1a` }}
        >
          {level}
        </span>
      </div>
      <div className={styles.rows}>
        {pronouns.map((pronoun, i) => {
          const form = forms[i] ?? '—';
          // For impératif we show just the form (no pronoun before it);
          // for everything else: pronoun + form with élision.
          const fullForm = isImperative
            ? form
            : `${buildPronoun(pronoun, form)}${form}`;
          return (
            <div key={pronoun + i} className={styles.row}>
              <div className={styles.pronounCell}>
                {isImperative && <span className={styles.pronounLabel}>{pronoun}</span>}
                <span className={styles.pronounHint}>{hints[i]}</span>
              </div>
              <div className={styles.formCell}>{fullForm}</div>
            </div>
          );
        })}
      </div>
      {isSubjonctif && (
        <p className={styles.tenseNote}>* «que» — обычная вводная частица для subjonctif</p>
      )}
    </div>
  );
}
