import { createFileRoute } from '@tanstack/react-router';
import { DictionaryPage } from '../../pages/dictionary/DictionaryPage';

export const Route = createFileRoute('/_auth/dictionary')({
  component: DictionaryPage,
});
