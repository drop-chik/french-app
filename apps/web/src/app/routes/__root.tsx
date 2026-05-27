import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useTheme } from '../../shared/hooks/useTheme';
import { RouteTitle } from '../../shared/components/RouteTitle';

function RootLayout() {
  useTheme(); // apply theme to <html>
  return (
    <>
      {/* RouteTitle sets per-route document.title. Mounted at root so it
          fires for public pages (/login, /forgot-password, /verify-email,
          /privacy, /terms) — _auth has its own copy but that subtree
          doesn't render until the user is authenticated. */}
      <RouteTitle />
      <Outlet />
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
