import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router';
import { DrillsPage } from '../../pages/drills/DrillsPage';

function DrillsLayout() {
  const matchRoute = useMatchRoute();
  const isNested = matchRoute({ to: '/drills/$slug' });
  if (isNested) return <Outlet />;
  return <DrillsPage />;
}

export const Route = createFileRoute('/_auth/drills')({
  component: DrillsLayout,
});
