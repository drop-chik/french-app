import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Save } from 'lucide-react';
import { wordsApi, type WordData } from '../../features/words/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import styles from './WordDetailsModal.module.css';

interface Props {
  onClose: () => void;
  // When provided the modal opens in EDIT mode pre-filled with the word's
  // current values. Submitting calls PATCH /words/:id instead of POST /words.
  editWord?: WordData | null;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const POS_OPTIONS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'expression'] as const;

export function AddWordModal({ onClose, editWord }: Props) {
  const { t } = useI18n();
  const userLevel = useAuthStore((s) => s.user?.level);
  const queryClient = useQueryClient();
  const isEdit = !!editWord;

  const [french, setFrench] = useState(editWord?.french ?? '');
  const [translation, setTranslation] = useState(editWord?.translation ?? '');
  const [level, setLevel] = useState<string>(
    editWord?.level ?? ((LEVELS as readonly string[]).includes(userLevel ?? '') ? (userLevel as string) : 'A1'),
  );
  const [partOfSpeech, setPartOfSpeech] = useState<string>(editWord?.partOfSpeech ?? 'noun');
  const [gender, setGender] = useState<'' | 'm' | 'f'>(
    (editWord?.gender as 'm' | 'f' | null) ?? '',
  );
  const [category, setCategory] = useState<string>(editWord?.category ?? 'custom');
  const [exampleFr, setExampleFr] = useState(editWord?.exampleFr ?? '');
  const [exampleRu, setExampleRu] = useState(editWord?.exampleRu ?? '');
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        french: french.trim(),
        translation: translation.trim(),
        level,
        category: category.trim() || 'custom',
        partOfSpeech,
        gender: partOfSpeech === 'noun' ? gender : '' as 'm' | 'f' | '',
        exampleFr: exampleFr.trim(),
        exampleRu: exampleRu.trim(),
      };
      if (isEdit) {
        await wordsApi.updateWord(editWord!.id, payload);
      } else {
        await wordsApi.createWord(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browse-words'] });
      queryClient.invalidateQueries({ queryKey: ['browse-search'] });
      queryClient.invalidateQueries({ queryKey: ['word-categories'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['word-details', editWord!.id] });
      }
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const canSubmit = french.trim().length >= 1 && translation.trim().length >= 1 && !saveMutation.isPending;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) saveMutation.mutate();
        }}
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 className={styles.french} style={{ marginBottom: 24 }}>
          {isEdit ? t.dictionary.editWordTitle : t.dictionary.addWordTitle}
        </h2>

        {/* French + translation — required */}
        <div className={styles.formGrid}>
          <label className={styles.formField}>
            <span className={styles.formLabel}>{t.dictionary.addWordFrench} *</span>
            <input
              type="text"
              className={styles.formInput}
              value={french}
              onChange={(e) => setFrench(e.target.value)}
              required
              maxLength={255}
              autoFocus
              placeholder="quotidien"
            />
          </label>
          <label className={styles.formField}>
            <span className={styles.formLabel}>{t.dictionary.addWordTranslation} *</span>
            <input
              type="text"
              className={styles.formInput}
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              required
              maxLength={255}
              placeholder="ежедневный"
            />
          </label>
        </div>

        {/* Level + POS + gender */}
        <div className={styles.formGrid3}>
          <label className={styles.formField}>
            <span className={styles.formLabel}>{t.dictionary.addWordLevel}</span>
            <select className={styles.formInput} value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className={styles.formField}>
            <span className={styles.formLabel}>{t.dictionary.addWordPos}</span>
            <select className={styles.formInput} value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)}>
              {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {partOfSpeech === 'noun' && (
            <label className={styles.formField}>
              <span className={styles.formLabel}>{t.dictionary.addWordGender}</span>
              <select className={styles.formInput} value={gender} onChange={(e) => setGender(e.target.value as '' | 'm' | 'f')}>
                <option value="">—</option>
                <option value="m">m.</option>
                <option value="f">f.</option>
              </select>
            </label>
          )}
        </div>

        {/* Category */}
        <label className={`${styles.formField} ${styles.formFieldFull}`}>
          <span className={styles.formLabel}>{t.dictionary.addWordCategory}</span>
          <input
            type="text"
            className={styles.formInput}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={100}
            placeholder="custom"
          />
        </label>

        {/* Examples (optional) */}
        <label className={`${styles.formField} ${styles.formFieldFull}`}>
          <span className={styles.formLabel}>{t.dictionary.addWordExampleFr}</span>
          <input
            type="text"
            className={styles.formInput}
            value={exampleFr}
            onChange={(e) => setExampleFr(e.target.value)}
            maxLength={500}
            placeholder="Je lis le journal quotidien."
          />
        </label>
        <label className={`${styles.formField} ${styles.formFieldFull}`}>
          <span className={styles.formLabel}>{t.dictionary.addWordExampleRu}</span>
          <input
            type="text"
            className={styles.formInput}
            value={exampleRu}
            onChange={(e) => setExampleRu(e.target.value)}
            maxLength={500}
            placeholder="Я читаю ежедневную газету."
          />
        </label>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={!canSubmit}
          >
            {isEdit ? <Save size={16} /> : <Plus size={16} />}
            {saveMutation.isPending
              ? (isEdit ? t.dictionary.editWordSubmitting : t.dictionary.addWordSubmitting)
              : (isEdit ? t.dictionary.editWordSubmit : t.dictionary.addWordSubmit)}
          </button>
        </div>
      </form>
    </div>
  );
}
