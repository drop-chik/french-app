import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../../features/auth/authStore';
import { AppLayout } from '../../shared/components/AppLayout';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { InstallPrompt } from '../../shared/components/InstallPrompt';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <AppLayout>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <InstallPrompt />
    </AppLayout>
  ),
});
