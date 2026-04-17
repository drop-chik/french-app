import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../../features/auth/authStore';
import { AppLayout } from '../../shared/components/AppLayout';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
