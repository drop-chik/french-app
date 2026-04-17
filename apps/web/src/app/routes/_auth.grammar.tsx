import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router';
import { GrammarPage } from '../../pages/grammar/GrammarPage';

function GrammarLayout() {
  const matchRoute = useMatchRoute();
  // If we're on a nested route (slug), render Outlet; otherwise render GrammarPage
  const isNested = matchRoute({ to: '/grammar/$slug' });
  if (isNested) return <Outlet />;
  return <GrammarPage />;
}

export const Route = createFileRoute('/_auth/grammar')({
  component: GrammarLayout,
});
