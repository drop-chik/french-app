import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

const GrammarTopicPage = lazyPage<{ slug: string }>(
  () => import('../../pages/grammar/GrammarTopicPage'),
  'GrammarTopicPage',
);

function GrammarTopicRoute() {
  const { slug } = Route.useParams();
  return <GrammarTopicPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/grammar/$slug')({
  component: GrammarTopicRoute,
});
