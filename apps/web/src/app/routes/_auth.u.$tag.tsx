import { createFileRoute } from '@tanstack/react-router';
import { PublicProfilePage } from '../../pages/social/PublicProfilePage';

function PublicProfileRoute() {
  const { tag } = Route.useParams();
  return <PublicProfilePage tag={tag} />;
}

export const Route = createFileRoute('/_auth/u/$tag')({
  component: PublicProfileRoute,
});
