import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

const LevelVocabPage = lazyPage(
  () => import('../../pages/vocabulary/LevelVocabPage'),
  'LevelVocabPage',
);

export const Route = createFileRoute('/_auth/vocabulary/level/$level')({
  component: LevelVocabPage,
});
