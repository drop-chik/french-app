import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../../features/auth/authStore';
import { AdminPage } from '../../pages/admin/AdminPage';

// Nested under /_auth so it already requires auth. This adds a role gate
// on top — non-admins are bounced to the dashboard. Defense-in-depth: the
// backend /admin API independently enforces requireAdmin, so this is just
// to avoid rendering an empty shell for non-admins.
export const Route = createFileRoute('/_auth/admin')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user?.role !== 'admin') {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: AdminPage,
});
