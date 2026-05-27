import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

const DictionaryPage = lazyPage(
  () => import('../../pages/dictionary/DictionaryPage'),
  'DictionaryPage',
);

export const Route = createFileRoute('/_auth/dictionary')({
  component: DictionaryPage,
});
