import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

const ReadingTextPage = lazyPage<{ slug: string }>(
  () => import('../../pages/reading/ReadingTextPage'),
  'ReadingTextPage',
);

function ReadingTextRoute() {
  const { slug } = Route.useParams();
  return <ReadingTextPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/reading/$slug')({
  component: ReadingTextRoute,
});
