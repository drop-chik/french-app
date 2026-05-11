import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router';
import { ReadingPage } from '../../pages/reading/ReadingPage';

function ReadingLayout() {
  const matchRoute = useMatchRoute();
  const isNested = matchRoute({ to: '/reading/$slug' });
  if (isNested) return <Outlet />;
  return <ReadingPage />;
}

export const Route = createFileRoute('/_auth/reading')({
  component: ReadingLayout,
});
