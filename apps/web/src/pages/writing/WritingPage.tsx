import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PenLine, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { writingApi, type WritingSubmission } from './api';
import { useI18n } from '../../shared/i18n';
import styles from './WritingPage.module.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
const TYPES = ['postcard', 'message', 'letter_informal', 'letter_formal', 'email', 'description', 'blog_article', 'essay', 'narrative'] as const;

function LevelBadge({ level }: { level: string }) {
  return <span className={`${styles.badge} ${styles[`badge${level}`]}`}>{level}</span>;
}

export function WritingPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const tw = t.writing;
  const [tab, setTab] = useState<'prompts' | 'history'>('prompts');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const { data: promptsData, isLoading: promptsLoading } = useQuery({
    queryKey: ['writing-prompts', filterLevel, filterType],
    queryFn: () => writingApi.getPrompts(filterLevel || undefined, filterType || undefined),
    enabled: tab === 'prompts',
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['writing-submissions'],
    queryFn: writingApi.getSubmissions,
    enabled: tab === 'history',
  });

  const prompts = promptsData?.prompts ?? [];
  const submissions = historyData?.submissions ?? [];

  const getSubmissionForPrompt = (promptId: string): WritingSubmission | undefined =>
    submissions.find((s) => s.promptId === promptId);

  const getTypeLabel = (type: string) =>
    (tw.types as Record<string, string>)[type] ?? type;

  const getTitle = (p: { titleRu: string; titleEn: string }) =>
    lang === 'ru' ? p.titleRu : p.titleEn;

  const getPromptText = (p: { promptRu: string; promptEn: string }) =>
    lang === 'ru' ? p.promptRu : p.promptEn;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{tw.title}</h1>
          <p className={styles.subtitle}>{tw.subtitle}</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'prompts' ? styles.tabActive : ''}`}
          onClick={() => setTab('prompts')}
        >
          {tw.tabPrompts}
        </button>
        <button
          className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setTab('history')}
        >
          {tw.tabHistory}
        </button>
      </div>

      {tab === 'prompts' && (
        <>
          <div className={styles.filters}>
            <select
              className={styles.select}
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="">{tw.allLevels}</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{tw.allTypes}</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          {promptsLoading ? (
            <p className={styles.loading}>{tw.loading}</p>
          ) : prompts.length === 0 ? (
            <p className={styles.empty}>{tw.noPrompts}</p>
          ) : (
            <div className={styles.grid}>
              {prompts.map((prompt) => {
                const sub = getSubmissionForPrompt(prompt.id);
                const isDraft = sub?.status === 'draft';
                const isSubmitted = sub?.status === 'submitted';
                return (
                  <button
                    key={prompt.id}
                    className={styles.card}
                    onClick={() => navigate({ to: '/writing/$slug', params: { slug: prompt.slug } })}
                  >
                    <div className={styles.cardHeader}>
                      <LevelBadge level={prompt.level} />
                      <span className={styles.cardType}>{getTypeLabel(prompt.writingType)}</span>
                      {isSubmitted && <CheckCircle2 size={16} className={styles.iconDone} />}
                      {isDraft && <Clock size={16} className={styles.iconDraft} />}
                    </div>
                    <h3 className={styles.cardTitle}>{getTitle(prompt)}</h3>
                    <p className={styles.cardPrompt}>{getPromptText(prompt)}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.wordRange}>
                        {tw.wordRange.replace('{min}', String(prompt.minWords)).replace('{max}', String(prompt.maxWords))}
                      </span>
                      <span className={styles.cardAction}>
                        {isSubmitted
                          ? tw.viewResult
                          : isDraft
                          ? tw.continueWriting
                          : tw.startWriting}
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {historyLoading ? (
            <p className={styles.loading}>{tw.loading}</p>
          ) : submissions.length === 0 ? (
            <p className={styles.empty}>{tw.noHistory}</p>
          ) : (
            <div className={styles.historyList}>
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  className={styles.historyCard}
                  onClick={() =>
                    sub.status === 'submitted' && sub.feedback
                      ? navigate({ to: '/writing/result/$id', params: { id: sub.id } })
                      : navigate({ to: '/writing/$slug', params: { slug: sub.prompt?.slug ?? '' } })
                  }
                >
                  <div className={styles.historyCardLeft}>
                    <div className={styles.historyCardTop}>
                      <LevelBadge level={sub.level} />
                      {sub.prompt && (
                        <span className={styles.cardType}>
                          {getTypeLabel(sub.prompt.writingType)}
                        </span>
                      )}
                      <span className={`${styles.status} ${sub.status === 'submitted' ? styles.statusSubmitted : styles.statusDraft}`}>
                        {sub.status === 'submitted' ? tw.statusSubmitted : tw.statusDraft}
                      </span>
                    </div>
                    <p className={styles.historyTitle}>
                      {sub.prompt ? getTitle(sub.prompt) : sub.promptId}
                    </p>
                    <p className={styles.historyMeta}>
                      {tw.wordCount.replace('{n}', String(sub.wordCount))}
                      {sub.feedback && (
                        <span className={styles.score}>
                          {' · '}{sub.feedback.scores.total}/{sub.feedback.scores.maxTotal}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className={styles.chevron} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
