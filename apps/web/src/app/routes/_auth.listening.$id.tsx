import { createFileRoute } from '@tanstack/react-router';
import { ListeningExercisePage } from '../../pages/listening/ListeningExercisePage';

function ListeningExerciseRoute() {
  const { id } = Route.useParams();
  return <ListeningExercisePage id={id} />;
}

export const Route = createFileRoute('/_auth/listening/$id')({
  component: ListeningExerciseRoute,
});
