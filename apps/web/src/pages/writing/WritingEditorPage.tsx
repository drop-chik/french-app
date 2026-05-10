import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Lightbulb, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { writingApi, type WritingSubmission } from './api';
import { useI18n } from '../../shared/i18n';
import styles from './WritingEditorPage.module.css';

interface Props {
  slug: string;
}

export function WritingEditorPage({ slug }: Props) {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const tw = t.writing;
  const qc = useQueryClient();

  const [content, setContent] = useState('');
  const [submission, setSubmission] = useState<WritingSubmission | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: promptData, isLoading } = useQuery({
    queryKey: ['writing-prompt', slug],
    queryFn: () => writingApi.getPromptBySlug(slug),
  });

  const { data: submissionsData } = useQuery({
    queryKey: ['writing-submissions'],
    queryFn: writingApi.getSubmissions,
  });

  const prompt = promptData?.prompt;

  useEffect(() => {
    if (!prompt || !submissionsData) return;
    const existing = submissionsData.submissions.find((s) => s.promptId === prompt.id);
    if (existing) {
      setSubmission(existing);
      setContent(existing.content);
    }
  }, [prompt, submissionsData]);

  const saveMutation = useMutation({
    mutationFn: (data: { content: string; status: 'draft' | 'submitted' }) =>
      writingApi.saveSubmission({
        promptId: prompt!.id,
        content: data.content,
        status: data.status,
        ...(submission?.id ? { submissionId: submission.id } : {}),
      }),
    onSuccess: (res) => {
      setSubmission(res.submission);
      setSaveStatus('saved');
      qc.invalidateQueries({ queryKey: ['writing-submissions'] });
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  const triggerAutoSave = useCallback(
    (text: string) => {
      if (!prompt || submission?.status === 'submitted') return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        setSaveStatus('saving');
        saveMutation.mutate({ content: text, status: 'draft' });
      }, 1500);
    },
    [prompt, submission?.status, saveMutation],
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setSaveStatus('idle');
    triggerAutoSave(text);
  };

  const handleSubmit = () => {
    if (!prompt) return;
    saveMutation.mutate(
      { content, status: 'submitted' },
      {
        onSuccess: (res) => {
          navigate({ to: '/writing/result/$id', params: { id: res.submission.id } });
        },
      },
    );
    setConfirmSubmit(false);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isUnderMin = prompt && wordCount < prompt.minWords;
  const isOverMax = prompt && wordCount > prompt.maxWords;
  const isSubmitted = submission?.status === 'submitted';

  const getTips = () => {
    if (!prompt) return [];
    return lang === 'ru' ? (prompt.tipsRu ?? []) : (prompt.tipsEn ?? []);
  };

  const getTitle = () => {
    if (!prompt) return '';
    return lang === 'ru' ? prompt.titleRu : prompt.titleEn;
  };

  const getPromptText = () => {
    if (!prompt) return '';
    return lang === 'ru' ? prompt.promptRu : prompt.promptEn;
  };

  if (isLoading) {
    return <div className={styles.loading}>{tw.loading}</div>;
  }

  if (!prompt) {
    return <div className={styles.loading}>Задание не найдено</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate({ to: '/writing' })}>
          {tw.back}
        </button>
        <div className={styles.saveIndicator}>
          {saveStatus === 'saving' && <span className={styles.saving}>{tw.saving}</span>}
          {saveStatus === 'saved' && <span className={styles.saved}>{tw.saved}</span>}
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.promptCard}>
            <div className={styles.promptHeader}>
              <span className={`${styles.badge} ${styles[`badge${prompt.level}`]}`}>
                {prompt.level}
              </span>
              <span className={styles.promptType}>
                {(tw.types as Record<string, string>)[prompt.writingType] ?? prompt.writingType}
              </span>
            </div>
            <h1 className={styles.promptTitle}>{getTitle()}</h1>
            <p className={styles.promptLabel}>{tw.promptInstruction}</p>
            <p className={styles.promptText}>{getPromptText()}</p>

            {prompt.requiredElements && prompt.requiredElements.length > 0 && (
              <div className={styles.requiredBox}>
                <p className={styles.requiredLabel}>{tw.requiredElements}</p>
                <ul className={styles.requiredList}>
                  {prompt.requiredElements.map((el, i) => (
                    <li key={i}>{el}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.wordLimits}>
              <span className={isUnderMin ? styles.limitWarn : styles.limitOk}>
                {tw.wordMin.replace('{n}', String(prompt.minWords))}
              </span>
              <span className={isOverMax ? styles.limitWarn : styles.limitOk}>
                {tw.wordMax.replace('{n}', String(prompt.maxWords))}
              </span>
            </div>
          </div>

          {getTips().length > 0 && (
            <div className={styles.tipsCard}>
              <button
                className={styles.tipsToggle}
                onClick={() => setShowTips((v) => !v)}
              >
                <Lightbulb size={16} />
                <span>{tw.tips}</span>
                {showTips ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showTips && (
                <ul className={styles.tipsList}>
                  {getTips().map((tip, i) => (
                    <li key={i} className={styles.tip}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        <div className={styles.editorArea}>
          <div className={styles.editorTop}>
            <span className={`${styles.wordCounter} ${isUnderMin ? styles.counterWarn : isOverMax ? styles.counterOver : styles.counterOk}`}>
              {tw.wordCount.replace('{n}', String(wordCount))}
            </span>
          </div>

          <textarea
            className={styles.textarea}
            value={content}
            onChange={handleContentChange}
            placeholder={`Écris ton texte ici... (${prompt.minWords}–${prompt.maxWords} mots)`}
            disabled={isSubmitted}
            spellCheck={false}
          />

          {!isSubmitted && (
            <div className={styles.actions}>
              {confirmSubmit ? (
                <div className={styles.confirmBox}>
                  <AlertCircle size={16} />
                  <span>{tw.confirmSubmit}</span>
                  <div className={styles.confirmBtns}>
                    <button
                      className={styles.btnSecondary}
                      onClick={() => setConfirmSubmit(false)}
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      className={styles.btnPrimary}
                      onClick={handleSubmit}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? tw.submitting : tw.submit}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => {
                      setSaveStatus('saving');
                      saveMutation.mutate({ content, status: 'draft' });
                    }}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? tw.saving : tw.saveDraft}
                  </button>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => setConfirmSubmit(true)}
                    disabled={wordCount === 0}
                  >
                    {tw.submit}
                  </button>
                </>
              )}
            </div>
          )}

          {isSubmitted && (
            <div className={styles.submittedBanner}>
              <p>Работа сдана. Получи оценку AI!</p>
              <button
                className={styles.btnPrimary}
                onClick={() =>
                  navigate({ to: '/writing/result/$id', params: { id: submission!.id } })
                }
              >
                {tw.getFeedback}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
