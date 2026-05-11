import { createFileRoute } from '@tanstack/react-router';
import { AchievementsPage } from '../../pages/achievements/AchievementsPage';

export const Route = createFileRoute('/_auth/achievements')({
  component: AchievementsPage,
});
