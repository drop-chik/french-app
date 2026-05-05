import { createFileRoute } from '@tanstack/react-router';
import { DrillSessionPage } from '../../pages/drills/DrillSessionPage';

function DrillSessionRoute() {
  const { slug } = Route.useParams();
  return <DrillSessionPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/drills/$slug')({
  component: DrillSessionRoute,
});
