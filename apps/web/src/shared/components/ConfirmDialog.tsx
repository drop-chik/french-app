import { useEffect } from 'react';
import { useI18n } from '../i18n';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            {cancelLabel ?? t.common.cancel}
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
