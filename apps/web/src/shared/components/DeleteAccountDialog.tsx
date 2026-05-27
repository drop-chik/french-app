import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n';
import styles from './ConfirmDialog.module.css';

interface Props {
  /** Email of the account being deleted — used as the typed-confirm phrase. */
  userEmail: string;
  loading?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * GDPR Art 17 delete-my-account dialog. Requires the user to type their own
 * email verbatim before the Delete button enables. This is the GitHub /
 * Vercel pattern for irreversible actions — prevents the common "clicked
 * Delete by accident" mistake (e.g. tab muscle memory, double-click bug).
 */
export function DeleteAccountDialog({
  userEmail,
  loading = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const [typed, setTyped] = useState('');

  // Esc closes — same UX as the generic ConfirmDialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, loading]);

  const matches = typed.trim().toLowerCase() === userEmail.trim().toLowerCase();

  return (
    <div className={styles.overlay} onClick={loading ? undefined : onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <AlertTriangle size={28} color="#dc2626" />
        </div>
        <p className={styles.title}>{t.profile.deleteDialogTitle}</p>
        <p className={styles.message}>{t.profile.deleteDialogBody}</p>

        <ul style={{
          margin: '0 0 16px 0',
          paddingLeft: 18,
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}>
          <li>{t.profile.deleteWarn1}</li>
          <li>{t.profile.deleteWarn2}</li>
          <li>{t.profile.deleteWarn3}</li>
        </ul>

        <label style={{
          display: 'block',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          marginBottom: 6,
        }}>
          {t.profile.deleteConfirmLabel.replace('{email}', userEmail)}
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoFocus
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            fontSize: 14,
            fontFamily: 'inherit',
            marginBottom: 12,
          }}
        />

        {errorMessage && (
          <p style={{
            fontSize: 13,
            color: '#b91c1c',
            background: 'color-mix(in srgb, #dc2626 10%, transparent)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            margin: '0 0 12px 0',
          }}>{errorMessage}</p>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            {t.common.cancel}
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={loading || !matches}
            style={{
              // Danger-red instead of brand colour. The generic ConfirmDialog
              // uses brand orange which doesn't communicate "irreversible".
              background: matches && !loading ? '#dc2626' : '#dc262680',
              cursor: matches && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? t.common.loading : t.profile.deleteConfirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
