import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { X, Volume2, Plus, Check, EyeOff, Eye, BookOpen, ArrowRight, Hash, RotateCcw } from 'lucide-react';
import { wordsApi } from '../../features/words/api';
import { listeningApi } from '../../features/listening/api';
import { useI18n } from '../../shared/i18n';
import styles from './WordDetailsModal.module.css';

interface Props {
  wordId: string;
  onClose: () => void;
  onMutated: () => void;
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

export function WordDetailsModal({ wordId, onClose, onMutated }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [audioLoading, setAudioLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['word-details', wordId],
    queryFn: () => wordsApi.getWord(wordId),
    staleTime: 60_000,
  });
  const word = data?.word;

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
    onSuccess: () => onMutated(),
  });
  const dismissMutation = useMutation({
    mutationFn: () => wordsApi.dismissWord(wordId),
    onSuccess: () => onMutated(),
  });
  const undismissMutation = useMutation({
    mutationFn: () => wordsApi.undismissWord(wordId),
    onSuccess: () => onMutated(),
  });
  const restartMutation = useMutation({
    mutationFn: () => wordsApi.restartWord(wordId),
    onSuccess: () => onMutated(),
  });

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
  const isDismissed = (word as { isDismissed?: boolean } | undefined)?.isDismissed ?? false;
  const isWorking = markMutation.isPending || dismissMutation.isPending || undismissMutation.isPending || restartMutation.isPending;

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
              {status && (
                <span
                  className={styles.metaChip}
                  style={{
                    color: STATUS_COLOR[status] ?? '#6b7280',
                    background: `${STATUS_COLOR[status] ?? '#6b7280'}1a`,
                  }}
                >
                  {t.dictionary.status[STATUS_LABEL[status] as keyof typeof t.dictionary.status] ?? status}
                </span>
              )}
              {!status && <span className={styles.metaChipMuted}>{t.dictionary.notStudied}</span>}
              {isDismissed && (
                <span className={`${styles.metaChip} ${styles.metaChipDismissed}`}>
                  <EyeOff size={11} /> {t.dictionary.dismissedLabel}
                </span>
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

            {/* Actions */}
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
              {/* Mastered → bring back to learning. Common ask: user marked
                  something mastered too eagerly, wants to revisit */}
              {status === 'mastered' && (
                <button
                  className={styles.btnSecondary}
                  onClick={() => restartMutation.mutate()}
                  disabled={isWorking}
                >
                  <RotateCcw size={16} /> {t.dictionary.restartLearning}
                </button>
              )}
              {isDismissed ? (
                <button
                  className={styles.btnSecondary}
                  onClick={() => undismissMutation.mutate()}
                  disabled={isWorking}
                >
                  <Eye size={16} /> {t.dictionary.undismiss}
                </button>
              ) : (
                <button
                  className={styles.btnSecondary}
                  onClick={() => {
                    if (confirm(t.dictionary.dismissConfirm)) dismissMutation.mutate();
                  }}
                  disabled={isWorking}
                >
                  <EyeOff size={16} /> {t.dictionary.dismiss}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
