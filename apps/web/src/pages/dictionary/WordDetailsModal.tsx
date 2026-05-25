import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { X, Volume2, Plus, Check, BookOpen, ArrowRight, Hash, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { wordsApi, type WordData } from '../../features/words/api';
import { listeningApi } from '../../features/listening/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './WordDetailsModal.module.css';

interface Props {
  wordId: string;
  onClose: () => void;
  onMutated: () => void;
  onEdit?: (word: WordData) => void;
}

const STATUS_LABEL: Record<string, string> = {
  new: 'new',
  learning: 'learning',
  review: 'review',
  mastered: 'mastered',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#6b7280',
  learning: '#f59e0b',
  review: '#3b82f6',
  mastered: '#22c55e',
};

const LEVEL_COLOR: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#f97316',
  B2: '#a855f7',
};

export function WordDetailsModal({ wordId, onClose, onMutated, onEdit }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [audioLoading, setAudioLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['word-details', wordId],
    queryFn: () => wordsApi.getWord(wordId),
    staleTime: 60_000,
  });
  const word = data?.word;

  // After any mutation, the modal must refetch this word so the action
  // buttons reflect the new state.
  function handleMutated() {
    queryClient.invalidateQueries({ queryKey: ['word-details', wordId] });
    onMutated();
  }

  // Lock background scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const markMutation = useMutation({
    mutationFn: (action: 'study' | 'mastered') => wordsApi.markWord(wordId, action),
    onSuccess: handleMutated,
  });
  const restartMutation = useMutation({
    mutationFn: () => wordsApi.restartWord(wordId),
    onSuccess: handleMutated,
  });
  const deleteMutation = useMutation({
    mutationFn: () => wordsApi.deleteWord(wordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browse-words'] });
      queryClient.invalidateQueries({ queryKey: ['browse-search'] });
      queryClient.invalidateQueries({ queryKey: ['word-categories'] });
      onMutated();
      onClose();
    },
  });

  function handleDelete() {
    // eslint-disable-next-line no-alert
    if (window.confirm(t.dictionary.deleteWordConfirm)) {
      deleteMutation.mutate();
    }
  }

  async function playAudio() {
    if (!word) return;
    setAudioLoading(true);
    try {
      const blob = await listeningApi.generateTTS(word.french);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch(() => null);
      audio.onended = () => URL.revokeObjectURL(url);
    } finally {
      setAudioLoading(false);
    }
  }

  const status = word?.progress?.status ?? null;
  const isOwner = !!word?.createdByUserId && word.createdByUserId === currentUserId;
  const isWorking = markMutation.isPending || restartMutation.isPending || deleteMutation.isPending;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={word?.french ?? 'Word details'}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {isLoading && <p className={styles.loading}>...</p>}

        {!isLoading && word && (
          <>
            {/* Header — French word + audio + level */}
            <div className={styles.header}>
              <button
                type="button"
                className={styles.audioBtn}
                onClick={playAudio}
                disabled={audioLoading}
                aria-label={t.dictionary.listen}
              >
                <Volume2 size={20} />
              </button>
              <div className={styles.headerText}>
                <h2 className={styles.french}>{word.french}</h2>
                {word.ipa && <span className={styles.ipa}>/{word.ipa}/</span>}
                {word.partOfSpeech && (
                  <span className={styles.pos}>
                    {word.partOfSpeech}
                    {word.gender ? ` · ${word.gender === 'm' ? 'm.' : 'f.'}` : ''}
                  </span>
                )}
              </div>
              {word.level && (
                <span
                  className={styles.levelChip}
                  style={{
                    color: LEVEL_COLOR[word.level] ?? '#3b82f6',
                    background: `${LEVEL_COLOR[word.level] ?? '#3b82f6'}1a`,
                  }}
                >
                  {word.level}
                </span>
              )}
            </div>

            <p className={styles.translation}>{word.translation}</p>

            {/* Meta strip — status, frequency, grammar tag */}
            <div className={styles.metaRow}>
              {isOwner && (
                <span className={styles.metaChipOwn}>{t.dictionary.ownWordBadge}</span>
              )}
              {status ? (
                <span
                  className={styles.metaChip}
                  style={{
                    color: STATUS_COLOR[status] ?? '#6b7280',
                    background: `${STATUS_COLOR[status] ?? '#6b7280'}1a`,
                  }}
                >
                  {t.dictionary.status[STATUS_LABEL[status] as keyof typeof t.dictionary.status] ?? status}
                </span>
              ) : (
                <span className={styles.metaChipMuted}>{t.dictionary.notStudied}</span>
              )}
              {word.frequencyRank !== null && word.frequencyRank !== undefined && (
                <span className={styles.metaChipMuted}>
                  <Hash size={11} /> {t.dictionary.freqRank.replace('{n}', String(word.frequencyRank))}
                </span>
              )}
              {word.grammarTag && (
                <button
                  type="button"
                  className={`${styles.metaChip} ${styles.metaChipTag}`}
                  onClick={() => {
                    onClose();
                    navigate({ to: '/grammar/$slug', params: { slug: word.grammarTag as string } });
                  }}
                >
                  <BookOpen size={11} /> {word.grammarTag}
                </button>
              )}
            </div>

            {/* Examples block */}
            {word.exampleFr && (
              <div className={styles.examplesBlock}>
                <div className={styles.exampleFr}>«{word.exampleFr}»</div>
                {word.exampleRu && (
                  <div className={styles.exampleRu}>{word.exampleRu}</div>
                )}
              </div>
            )}

            {/* Single primary action determined by current status. */}
            <div className={styles.actions}>
              {!status && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => markMutation.mutate('study')}
                  disabled={isWorking}
                >
                  <Plus size={16} /> {t.dictionary.markStudy}
                </button>
              )}
              {status && status !== 'mastered' && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => markMutation.mutate('mastered')}
                  disabled={isWorking}
                >
                  <Check size={16} /> {t.dictionary.markMastered}
                </button>
              )}
              {status === 'mastered' && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => restartMutation.mutate()}
                  disabled={isWorking}
                >
                  <RotateCcw size={16} /> {t.dictionary.restartLearning}
                </button>
              )}
              {word.grammarTag && (
                <button
                  className={styles.btnTertiary}
                  onClick={() => {
                    onClose();
                    navigate({ to: '/vocabulary', search: { tag: word.grammarTag as string } as never });
                  }}
                >
                  {t.dictionary.practiceRelated}
                  <ArrowRight size={14} />
                </button>
              )}
              {isOwner && (
                <div className={styles.ownerActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => onEdit?.(word)}
                    disabled={isWorking}
                  >
                    <Pencil size={14} /> {t.dictionary.editWord}
                  </button>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={handleDelete}
                    disabled={isWorking}
                  >
                    <Trash2 size={14} />
                    {deleteMutation.isPending ? t.dictionary.deleting : t.dictionary.deleteWord}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
