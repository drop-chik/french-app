import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

// Code-split: badge catalog + rendering pipeline. Visited rarely.
const AchievementsPage = lazyPage(
  () => import('../../pages/achievements/AchievementsPage'),
  'AchievementsPage',
);

export const Route = createFileRoute('/_auth/achievements')({
  component: AchievementsPage,
});
