import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

// Code-split: editor module (textarea + tips accordion + saveMutation +
// AI feedback hooks). Used only when user picks a prompt.
const WritingEditorPage = lazyPage<{ slug: string }>(
  () => import('../../pages/writing/WritingEditorPage'),
  'WritingEditorPage',
);

function WritingEditorRoute() {
  const { slug } = Route.useParams();
  return <WritingEditorPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/writing/$slug')({
  component: WritingEditorRoute,
});
