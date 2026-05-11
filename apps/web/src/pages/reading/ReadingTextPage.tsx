import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, BookPlus, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { readingApi, type ReadingQuestion, type WordEntry } from '../../features/reading/api';
import { useI18n } from '../../shared/i18n';
import styles from './ReadingTextPage.module.css';

interface Props {
  slug: string;
}

type Phase = 'reading' | 'questions' | 'summary';

export function ReadingTextPage({ slug }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reading-text', slug],
    queryFn: () => readingApi.getTextBySlug(slug),
    staleTime: 10 * 60 * 1000,
  });

  const [phase, setPhase] = useState<Phase>('reading');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [wordsLookedUp, setWordsLookedUp] = useState<Set<string>>(new Set());
  const [wordsSaved, setWordsSaved] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'exists' | 'not_found'>>({});

  const progressMutation = useMutation({
    mutationFn: (payload: { score: number; totalQuestions: number }) =>
      readingApi.saveProgress(data!.text.id, {
        ...payload,
        wordsLookedUp: [...wordsLookedUp],
        wordsSaved: [...wordsSaved],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-texts'] });
      queryClient.invalidateQueries({ queryKey: ['reading-text', slug] });
    },
  });

  const saveWordMutation = useMutation({
    mutationFn: (word: string) => readingApi.saveWord(word),
  });

  const handleSaveWord = useCallback(async (word: string) => {
    if (saveStatus[word]) return;
    setSaveStatus((prev) => ({ ...prev, [word]: 'saving' }));
    try {
      const res = await saveWordMutation.mutateAsync(word);
      if (res.added) {
        setSaveStatus((prev) => ({ ...prev, [word]: 'saved' }));
        setWordsSaved((prev) => new Set([...prev, word]));
      } else if (res.reason === 'Already in vocabulary') {
        setSaveStatus((prev) => ({ ...prev, [word]: 'exists' }));
      } else {
        setSaveStatus((prev) => ({ ...prev, [word]: 'not_found' }));
      }
    } catch {
      setSaveStatus((prev) => ({ ...prev, [word]: 'not_found' }));
    }
  }, [saveStatus, saveWordMutation]);

  const handleLookup = useCallback((word: string) => {
    setWordsLookedUp((prev) => new Set([...prev, word]));
  }, []);

  const handleSubmitAnswers = () => {
    if (!data) return;
    setSubmitted(true);
    const questions = data.text.questions;
    const correct = questions.filter((q) => answers[q.id] === q.correct).length;
    progressMutation.mutate({ score: correct, totalQuestions: questions.length });
    setPhase('summary');
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBar} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{t.common.error}</p>
        <Link to="/reading" className={styles.backBtn}>{t.reading.back}</Link>
      </div>
    );
  }

  const { text } = data;
  const questions = text.questions;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const correctCount = questions.filter((q) => answers[q.id] === q.correct).length;
  const pct = Math.round((correctCount / questions.length) * 100);

  return (
    <div className={styles.page}>
      {/* Back + title */}
      <div className={styles.header}>
        <Link to="/reading" className={styles.backLink}>
          <ChevronLeft size={18} /> {t.reading.back}
        </Link>
        <div className={styles.headerMeta}>
          <span className={styles.levelBadge} data-level={text.level}>{text.level}</span>
          <h1 className={styles.title}>{text.title}</h1>
        </div>
      </div>

      {/* Phase tabs */}
      <div className={styles.phaseTabs}>
        <button
          className={`${styles.phaseTab} ${phase === 'reading' ? styles.phaseTabActive : ''}`}
          onClick={() => setPhase('reading')}
        >
          {t.reading.tabRead}
        </button>
        <button
          className={`${styles.phaseTab} ${phase === 'questions' ? styles.phaseTabActive : ''}`}
          onClick={() => setPhase('questions')}
        >
          {t.reading.tabQuestions} ({questions.length})
        </button>
        {submitted && (
          <button
            className={`${styles.phaseTab} ${phase === 'summary' ? styles.phaseTabActive : ''}`}
            onClick={() => setPhase('summary')}
          >
            {t.reading.tabSummary}
          </button>
        )}
      </div>

      {/* Reading phase */}
      {phase === 'reading' && (
        <div className={styles.readerContainer}>
          <InteractiveText
            content={text.contentFr}
            wordMap={text.wordMap}
            onLookup={handleLookup}
            onSaveWord={handleSaveWord}
            saveStatus={saveStatus}
            wordsSaved={wordsSaved}
          />
          <button
            className={styles.startQuestionsBtn}
            onClick={() => setPhase('questions')}
          >
            {t.reading.goToQuestions} →
          </button>
        </div>
      )}

      {/* Questions phase */}
      {phase === 'questions' && !submitted && (
        <div className={styles.questionsContainer}>
          <p className={styles.questionsHint}>{t.reading.questionsHint}</p>
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i + 1}
              chosen={answers[q.id] ?? null}
              onChoose={(opt) => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
              submitted={false}
            />
          ))}
          <button
            className={styles.submitBtn}
            disabled={!allAnswered}
            onClick={handleSubmitAnswers}
          >
            {t.reading.checkAnswers}
          </button>
        </div>
      )}

      {/* Summary phase */}
      {phase === 'summary' && submitted && (
        <div className={styles.summary}>
          <div className={styles.summaryScore}>
            <span className={styles.summaryScoreNum}>{correctCount} / {questions.length}</span>
            <span className={styles.summaryScorePct}>{pct}%</span>
            <p className={styles.summaryScoreLabel}>
              {pct >= 80
                ? t.reading.resultGreat
                : pct >= 60
                ? t.reading.resultGood
                : t.reading.resultKeep}
            </p>
          </div>

          {/* Question review */}
          <div className={styles.summaryQuestions}>
            <h3 className={styles.summarySectionTitle}>{t.reading.reviewTitle}</h3>
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i + 1}
                chosen={answers[q.id] ?? null}
                onChoose={() => {}}
                submitted={true}
              />
            ))}
          </div>

          {/* Vocabulary stats */}
          {(wordsLookedUp.size > 0 || wordsSaved.size > 0) && (
            <div className={styles.summaryVocab}>
              <h3 className={styles.summarySectionTitle}>{t.reading.vocabTitle}</h3>
              <div className={styles.vocabStats}>
                <div className={styles.vocabStat}>
                  <span className={styles.vocabStatNum}>{wordsLookedUp.size}</span>
                  <span className={styles.vocabStatLabel}>{t.reading.wordsLookedUp}</span>
                </div>
                <div className={styles.vocabStat}>
                  <span className={styles.vocabStatNum}>{wordsSaved.size}</span>
                  <span className={styles.vocabStatLabel}>{t.reading.wordsSaved}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.summaryActions}>
            <Link to="/reading" className={styles.backBtn}>{t.reading.backToList}</Link>
            <button className={styles.retryBtn} onClick={() => {
              setAnswers({});
              setSubmitted(false);
              setPhase('reading');
            }}>
              <RotateCcw size={16} /> {t.reading.readAgain}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interactive text with clickable words ────────────────────────────────────

// French stopwords that are too common/short to be useful
const STOPWORDS = new Set([
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on',
  'me', 'te', 'se', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd',
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
  'que', 'qui', 'qu', 'quoi', 'dont', 'où',
  'à', 'au', 'aux', 'en', 'y', 'par', 'pour', 'sur', 'sous', 'dans', 'avec',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'leurs',
  'est', 'es', 'suis', 'êtes', 'sont', 'être',
  'a', 'ont', 'ai', 'as', 'avez', 'avoir',
  'ne', 'pas', 'plus', 'très', 'bien', 'aussi', 'encore', 'toujours',
  'je', 'l', 'j', 'm', 'n', 's', 'c',
  'il', 'y',
]);

function cleanWord(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[«»""''.,!?;:()[\]—–\-]+/, '')
    .replace(/[«»""''.,!?;:()[\]—–\-]+$/, '')
    .replace(/^[lLdD]'/, '')
    .replace(/^[mM]'/, '')
    .replace(/^[sS]'/, '')
    .replace(/^[nN]'/, '')
    .replace(/^[jJ]'/, '')
    .replace(/^[cC]'/, '');
}

interface PopupState {
  rawWord: string;
  cleanWord: string;
  entry: WordEntry | null;
  loading: boolean;
  notFound: boolean;
  x: number;
  y: number;
}

interface InteractiveTextProps {
  content: string;
  wordMap: Record<string, WordEntry>;
  onLookup: (word: string) => void;
  onSaveWord: (word: string) => void;
  saveStatus: Record<string, string>;
  wordsSaved: Set<string>;
}

function InteractiveText({ content, wordMap, onLookup, onSaveWord, saveStatus, wordsSaved }: InteractiveTextProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  // Cache DB lookups for this session
  const translationCache = useRef<Map<string, WordEntry | null>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleWordClick = useCallback(async (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = cleanWord(token);
    if (!clean || clean.length < 2 || STOPWORDS.has(clean)) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.bottom - containerRect.top + 4;

    // 1. Check wordMap first (instant)
    const mapEntry = wordMap[clean];
    if (mapEntry) {
      onLookup(clean);
      setPopup({ rawWord: token, cleanWord: clean, entry: mapEntry, loading: false, notFound: false, x, y });
      return;
    }

    // 2. Check session cache
    if (translationCache.current.has(clean)) {
      const cached = translationCache.current.get(clean) ?? null;
      onLookup(clean);
      setPopup({ rawWord: token, cleanWord: clean, entry: cached, loading: false, notFound: !cached, x, y });
      return;
    }

    // 3. Fetch from DB
    onLookup(clean);
    setPopup({ rawWord: token, cleanWord: clean, entry: null, loading: true, notFound: false, x, y });

    try {
      const res = await readingApi.translate(clean);
      const entry = res.result ? { tr: res.result.tr, pos: res.result.pos } : null;
      translationCache.current.set(clean, entry);
      setPopup((prev) => prev?.cleanWord === clean
        ? { ...prev, entry, loading: false, notFound: !entry }
        : prev,
      );
    } catch {
      translationCache.current.set(clean, null);
      setPopup((prev) => prev?.cleanWord === clean
        ? { ...prev, loading: false, notFound: true }
        : prev,
      );
    }
  }, [wordMap, onLookup]);

  const paragraphs = content.split('\n').filter((line) => line.trim().length > 0);

  return (
    <div className={styles.interactiveText} ref={containerRef} onClick={() => setPopup(null)}>
      {paragraphs.map((para, pi) => (
        <p key={pi} className={styles.paragraph}>
          {para.split(/(\s+)/).map((token, ti) => {
            if (/^\s+$/.test(token)) return <span key={ti}>{token}</span>;
            const clean = cleanWord(token);
            const isClickable = clean.length >= 2 && !STOPWORDS.has(clean);
            const hasMapEntry = !!wordMap[clean];
            return (
              <span
                key={ti}
                className={isClickable
                  ? hasMapEntry
                    ? styles.wordClickable
                    : styles.wordClickableAny
                  : undefined}
                onClick={isClickable ? (e) => void handleWordClick(token, e) : undefined}
              >
                {token}
              </span>
            );
          })}
        </p>
      ))}

      {popup && (
        <div
          className={styles.popup}
          style={{ left: popup.x, top: popup.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.popupWord}>{popup.cleanWord}</div>
          {popup.loading && (
            <div className={styles.popupLoading}><Loader2 size={14} className={styles.spinner} /></div>
          )}
          {!popup.loading && popup.entry && (
            <>
              {popup.entry.pos && <div className={styles.popupPos}>{popup.entry.pos}</div>}
              <div className={styles.popupTr}>{popup.entry.tr}</div>
            </>
          )}
          {!popup.loading && popup.notFound && (
            <div className={styles.popupNotFound}>Нет перевода</div>
          )}
          {!popup.loading && popup.entry && (
            <button
              className={`${styles.popupSaveBtn} ${saveStatus[popup.cleanWord] === 'saved' || wordsSaved.has(popup.cleanWord) ? styles.popupSaveBtnDone : ''}`}
              onClick={() => onSaveWord(popup.cleanWord)}
              disabled={!!saveStatus[popup.cleanWord]}
            >
              {saveStatus[popup.cleanWord] === 'saving' ? '...' :
                saveStatus[popup.cleanWord] === 'saved' || wordsSaved.has(popup.cleanWord) ? <><Check size={13} /> Добавлено</> :
                saveStatus[popup.cleanWord] === 'exists' ? 'Уже в словаре' :
                saveStatus[popup.cleanWord] === 'not_found' ? 'Нет в словаре' :
                <><BookPlus size={13} /> В словарь</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  chosen,
  onChoose,
  submitted,
}: {
  question: ReadingQuestion;
  index: number;
  chosen: string | null;
  onChoose: (opt: string) => void;
  submitted: boolean;
}) {
  return (
    <div className={styles.questionCard}>
      <p className={styles.questionText}>
        <span className={styles.questionNum}>{index}.</span> {question.question}
      </p>
      <div className={styles.options}>
        {question.options.map((opt) => {
          let cls = styles.option;
          if (submitted) {
            if (opt === question.correct) cls = `${styles.option} ${styles.optionCorrect}`;
            else if (opt === chosen && opt !== question.correct) cls = `${styles.option} ${styles.optionWrong}`;
          } else if (chosen === opt) {
            cls = `${styles.option} ${styles.optionChosen}`;
          }
          return (
            <button
              key={opt}
              className={cls}
              onClick={() => !submitted && onChoose(opt)}
              disabled={submitted}
            >
              {submitted && opt === question.correct && <Check size={14} className={styles.optionIcon} />}
              {submitted && opt === chosen && opt !== question.correct && <X size={14} className={styles.optionIcon} />}
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && (
        <p className={styles.explanation}>{question.explanation}</p>
      )}
    </div>
  );
}
