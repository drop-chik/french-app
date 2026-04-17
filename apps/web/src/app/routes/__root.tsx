import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useTheme } from '../../shared/hooks/useTheme';

function RootLayout() {
  useTheme(); // apply theme to <html>
  return <Outlet />;
}

export const Route = createRootRoute({
  component: RootLayout,
});
