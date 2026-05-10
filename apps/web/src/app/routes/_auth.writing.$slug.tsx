import { createFileRoute } from '@tanstack/react-router';
import { WritingEditorPage } from '../../pages/writing/WritingEditorPage';

function WritingEditorRoute() {
  const { slug } = Route.useParams();
  return <WritingEditorPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/writing/$slug')({
  component: WritingEditorRoute,
});
