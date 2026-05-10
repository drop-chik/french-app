import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router';
import { WritingPage } from '../../pages/writing/WritingPage';

function WritingLayout() {
  const matchRoute = useMatchRoute();
  const isNested =
    matchRoute({ to: '/writing/$slug' }) ||
    matchRoute({ to: '/writing/result/$id' });
  if (isNested) return <Outlet />;
  return <WritingPage />;
}

export const Route = createFileRoute('/_auth/writing')({
  component: WritingLayout,
});
