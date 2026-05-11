import { createFileRoute } from '@tanstack/react-router';
import { ReadingTextPage } from '../../pages/reading/ReadingTextPage';

function ReadingTextRoute() {
  const { slug } = Route.useParams();
  return <ReadingTextPage slug={slug} />;
}

export const Route = createFileRoute('/_auth/reading/$slug')({
  component: ReadingTextRoute,
});
