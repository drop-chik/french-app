import { createFileRoute } from '@tanstack/react-router';
import { FriendsPage } from '../../pages/social/FriendsPage';

export const Route = createFileRoute('/_auth/friends')({
  component: FriendsPage,
});
