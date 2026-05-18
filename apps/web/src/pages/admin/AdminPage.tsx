import { useI18n } from '../../shared/i18n';

// Phase 0 stub — full Users / Metrics tabs land in Phase 1 & 2.
export function AdminPage() {
  const { t } = useI18n();
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>{t.nav.admin}</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Admin panel — coming online.
      </p>
    </div>
  );
}
