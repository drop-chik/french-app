import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../../features/auth/authStore';
import { AppLayout } from '../../shared/components/AppLayout';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { InstallPrompt } from '../../shared/components/InstallPrompt';
import { HelpProvider } from '../../shared/help/HelpProvider';
import { HelpButton } from '../../shared/help/HelpButton';
import { NetworkBanner } from '../../shared/components/NetworkBanner';
import { EmailVerifyBanner } from '../../shared/components/EmailVerifyBanner';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <HelpProvider>
      {/* WCAG 2.4.1 — first focusable element is a skip-to-content link so
          keyboard / screen-reader users don't have to tab through the
          whole sidebar on every page. Styled in global.css (invisible
          until focused). */}
      <a href="#main-content" className="skipLink">Skip to content</a>
      <NetworkBanner />
      <EmailVerifyBanner />
      <AppLayout>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        <InstallPrompt />
        <HelpButton />
      </AppLayout>
    </HelpProvider>
  ),
});
