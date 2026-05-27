import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

// Code-split: VocabularyPage pulls 7 flow-mode components (intro / match /
// reverse / listening / scramble / cloze / spell) plus AdaptiveLearnFlow
// orchestrator. Hot path but still benefits from being its own chunk so
// dashboard's first paint isn't blocked on the whole vocab pipeline.
const VocabularyPage = lazyPage(
  () => import('../../pages/vocabulary/VocabularyPage'),
  'VocabularyPage',
);

export const Route = createFileRoute('/_auth/vocabulary')({
  component: VocabularyPage,
});
