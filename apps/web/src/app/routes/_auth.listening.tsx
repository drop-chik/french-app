import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router';
import { ListeningPage } from '../../pages/listening/ListeningPage';

function ListeningLayout() {
  const matchRoute = useMatchRoute();
  const isNested = matchRoute({ to: '/listening/$id' });
  if (isNested) return <Outlet />;
  return <ListeningPage />;
}

export const Route = createFileRoute('/_auth/listening')({
  component: ListeningLayout,
});
