import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Clock, CheckCircle2, ChevronRight, Sparkles, X, Plus, Timer } from 'lucide-react';
import { writingApi, type WritingSubmission, type WritingTypeId } from './api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { Pill } from '../../shared/components/ui';
import { WritingMockTab } from './WritingMockTab';
import styles from './WritingPage.module.css';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const TYPES: WritingTypeId[] = ['postcard', 'message', 'letter_informal', 'letter_formal', 'email', 'description', 'blog_article', 'essay', 'narrative'];

type CefrLevel = (typeof LEVELS)[number];

function LevelBadge({ level }: { level: string }) {
  return <Pill tone="level" level={level as CefrLevel}>{level}</Pill>;
}

// ── AI prompt generation modal ────────────────────────────────────────────────

interface GenerateModalProps {
  defaultLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  onClose: () => void;
  onCreated: (slug: string) => void;
}

function GenerateModal({ defaultLevel, onClose, onCreated }: GenerateModalProps) {
  const { t } = useI18n();
  const tw = t.writing;
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>(defaultLevel);
  const [writingType, setWritingType] = useState<WritingTypeId>('email');
  const [topicHint, setTopicHint] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Lock scroll + ESC close
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const generate = useMutation({
    mutationFn: () =>
      writingApi.generatePrompt({
        level,
        writingType,
        ...(topicHint.trim() ? { topicHint: topicHint.trim() } : {}),
      }),
    onSuccess: ({ prompt }) => onCreated(prompt.slug),
    onError: (err: Error) => setError(err.message ?? 'AI generation failed'),
  });

  const getTypeLabel = (type: string) => (tw.types as Record<string, string>)[type] ?? type;

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="presentation">
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          generate.mutate();
        }}
      >
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className={styles.modalHeader}>
          <Sparkles size={20} className={styles.modalHeaderIcon} />
          <h2 className={styles.modalTitle}>{tw.aiGenerateTitle}</h2>
        </div>
        <p className={styles.modalSubtitle}>{tw.aiGenerateSubtitle}</p>

        <div className={styles.modalRow}>
          <label className={styles.modalField}>
            <span className={styles.modalLabel}>{tw.filterLevel}</span>
            <select
              className={styles.modalInput}
              value={level}
              onChange={(e) => setLevel(e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')}
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.modalLabel}>{tw.filterType}</span>
            <select
              className={styles.modalInput}
              value={writingType}
              onChange={(e) => setWritingType(e.target.value as WritingTypeId)}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.modalField}>
          <span className={styles.modalLabel}>{tw.aiTopicHint}</span>
          <input
            type="text"
            className={styles.modalInput}
            value={topicHint}
            onChange={(e) => setTopicHint(e.target.value)}
            maxLength={200}
            placeholder={tw.aiTopicHintPlaceholder}
          />
          <span className={styles.modalHint}>{tw.aiTopicHintNote}</span>
        </label>

        {error && <p className={styles.modalError}>{error}</p>}

        <button
          type="submit"
          className={styles.modalSubmit}
          disabled={generate.isPending}
        >
          <Sparkles size={16} />
          {generate.isPending ? tw.aiGenerating : tw.aiGenerateBtn}
        </button>
      </form>
    </div>
  );
}

export function WritingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();
  const tw = t.writing;
  const userLevel = useAuthStore((s) => s.user?.level);
  const [tab, setTab] = useState<'prompts' | 'ai' | 'history' | 'mock'>('prompts');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showGenerate, setShowGenerate] = useState(false);

  const { data: promptsData, isLoading: promptsLoading } = useQuery({
    queryKey: ['writing-prompts', filterLevel, filterType],
    queryFn: () => writingApi.getPrompts(filterLevel || undefined, filterType || undefined),
    enabled: tab === 'prompts',
  });

  const { data: aiPromptsData, isLoading: aiLoading } = useQuery({
    queryKey: ['writing-prompts-ai'],
    queryFn: writingApi.getAiPrompts,
    enabled: tab === 'ai',
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['writing-submissions'],
    queryFn: writingApi.getSubmissions,
    enabled: tab === 'history',
  });

  const aiPrompts = aiPromptsData?.prompts ?? [];
  const defaultAiLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' =
    (LEVELS as readonly string[]).includes(userLevel ?? '')
      ? (userLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')
      : 'B1';

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

      <div className={styles.tabs} data-tour="writing-tabs">
        <button
          className={`${styles.tab} ${tab === 'prompts' ? styles.tabActive : ''}`}
          onClick={() => setTab('prompts')}
        >
          {tw.tabPrompts}
        </button>
        <button
          className={`${styles.tab} ${tab === 'ai' ? styles.tabActive : ''}`}
          onClick={() => setTab('ai')}
          data-tour="writing-ai"
        >
          <Sparkles size={13} className={styles.tabIcon} />
          {tw.tabAi}
        </button>
        <button
          className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setTab('history')}
        >
          {tw.tabHistory}
        </button>
        <button
          className={`${styles.tab} ${tab === 'mock' ? styles.tabActive : ''}`}
          onClick={() => setTab('mock')}
        >
          <Timer size={13} className={styles.tabIcon} /> {tw.tabMock}
        </button>
      </div>

      {tab === 'mock' && <WritingMockTab />}

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

      {tab === 'ai' && (
        <>
          <div className={styles.aiHero}>
            <div className={styles.aiHeroText}>
              <div className={styles.aiHeroTitleRow}>
                <Sparkles size={18} className={styles.aiHeroIcon} />
                <h2 className={styles.aiHeroTitle}>{tw.aiTitle}</h2>
              </div>
              <p className={styles.aiHeroDesc}>{tw.aiDescription}</p>
            </div>
            <button
              type="button"
              className={styles.aiGenerateBtn}
              onClick={() => setShowGenerate(true)}
            >
              <Plus size={16} /> {tw.aiGenerateNew}
            </button>
          </div>

          {aiLoading ? (
            <p className={styles.loading}>{tw.loading}</p>
          ) : aiPrompts.length === 0 ? (
            <div className={styles.aiEmpty}>
              <Sparkles size={32} className={styles.aiEmptyIcon} />
              <p className={styles.aiEmptyTitle}>{tw.aiEmptyTitle}</p>
              <p className={styles.aiEmptyDesc}>{tw.aiEmptyDesc}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {aiPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className={`${styles.card} ${styles.cardAi}`}
                  onClick={() => navigate({ to: '/writing/$slug', params: { slug: prompt.slug } })}
                >
                  <div className={styles.cardHeader}>
                    <LevelBadge level={prompt.level} />
                    <span className={styles.cardType}>{getTypeLabel(prompt.writingType)}</span>
                    <span className={styles.aiBadge} title={tw.aiBadge}>
                      <Sparkles size={11} /> AI
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{getTitle(prompt)}</h3>
                  <p className={styles.cardPrompt}>{getPromptText(prompt)}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.wordRange}>
                      {tw.wordRange.replace('{min}', String(prompt.minWords)).replace('{max}', String(prompt.maxWords))}
                    </span>
                    <span className={styles.cardAction}>
                      {tw.startWriting}
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showGenerate && (
        <GenerateModal
          defaultLevel={defaultAiLevel}
          onClose={() => setShowGenerate(false)}
          onCreated={(slug) => {
            setShowGenerate(false);
            queryClient.invalidateQueries({ queryKey: ['writing-prompts-ai'] });
            navigate({ to: '/writing/$slug', params: { slug } });
          }}
        />
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
