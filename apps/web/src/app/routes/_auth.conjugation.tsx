import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

// Code-split: conjugation engine is a big lookup table (~80 KB) — only
// loaded when the user opens the verb lookup tab.
const ConjugationPage = lazyPage(
  () => import('../../pages/conjugation/ConjugationPage'),
  'ConjugationPage',
);

export const Route = createFileRoute('/_auth/conjugation')({
  component: ConjugationPage,
});
