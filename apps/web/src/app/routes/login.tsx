import { createFileRoute, redirect } from '@tanstack/react-router';
import { HomePage } from '../../pages/home/HomePage';
import { useAuthStore } from '../../features/auth/authStore';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: user?.placementTestDone ? '/vocabulary' : '/placement' });
    }
  },
  component: HomePage,
});
