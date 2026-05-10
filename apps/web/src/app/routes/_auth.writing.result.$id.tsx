import { createFileRoute } from '@tanstack/react-router';
import { WritingResultPage } from '../../pages/writing/WritingResultPage';

function WritingResultRoute() {
  const { id } = Route.useParams();
  return <WritingResultPage id={id} />;
}

export const Route = createFileRoute('/_auth/writing/result/$id')({
  component: WritingResultRoute,
});
