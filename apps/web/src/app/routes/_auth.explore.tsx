import { createFileRoute } from '@tanstack/react-router';
import { ExplorePage } from '../../pages/explore/ExplorePage';

export const Route = createFileRoute('/_auth/explore')({
  component: ExplorePage,
});
