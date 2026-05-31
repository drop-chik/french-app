import { createFileRoute } from '@tanstack/react-router';
import { LevelTestPage } from '../../pages/level-test/LevelTestPage';

export const Route = createFileRoute('/_auth/level-test')({
  component: LevelTestPage,
});
