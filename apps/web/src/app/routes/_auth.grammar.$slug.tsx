import { createFileRoute } from '@tanstack/react-router';
import { GrammarTopicPage } from '../../pages/grammar/GrammarTopicPage';

function GrammarTopicRoute() {
  const { slug } = Route.useParams();
  return <GrammarTopicPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/grammar/$slug')({
  component: GrammarTopicRoute,
});
