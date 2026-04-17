import { createFileRoute } from '@tanstack/react-router';
import { PlacementPage } from '../../pages/placement/PlacementPage';

export const Route = createFileRoute('/_auth/placement')({
  component: PlacementPage,
});
