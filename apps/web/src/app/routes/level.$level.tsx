import { createFileRoute } from '@tanstack/react-router';
import { LevelPage } from '../../pages/level/LevelPage';

/**
 * PUBLIC level marketing page. Lives outside the `_auth` layout
 * deliberately — gpt-crawlable + onboarding funnel + works pre-signup.
 * Authenticated users still see it; they get a "your progress" insert
 * and a "Continue" CTA pointing at the dashboard.
 */
export const Route = createFileRoute('/level/$level')({
  component: LevelPage,
});
