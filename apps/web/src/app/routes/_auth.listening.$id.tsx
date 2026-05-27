import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

const ListeningExercisePage = lazyPage<{ id: string }>(
  () => import('../../pages/listening/ListeningExercisePage'),
  'ListeningExercisePage',
);

function ListeningExerciseRoute() {
  const { id } = Route.useParams();
  return <ListeningExercisePage id={id} />;
}

export const Route = createFileRoute('/_auth/listening/$id')({
  component: ListeningExerciseRoute,
});
