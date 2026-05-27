import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

// Code-split: feedback-display module (score tiles + per-correction list +
// strengths/improvements). Loaded only after a submission is graded.
const WritingResultPage = lazyPage<{ id: string }>(
  () => import('../../pages/writing/WritingResultPage'),
  'WritingResultPage',
);

function WritingResultRoute() {
  const { id } = Route.useParams();
  return <WritingResultPage id={id} />;
}

export const Route = createFileRoute('/_auth/writing/result/$id')({
  component: WritingResultRoute,
});
