import { createFileRoute } from '@tanstack/react-router';
import { ConjugationPage } from '../../pages/conjugation/ConjugationPage';

export const Route = createFileRoute('/_auth/conjugation')({
  component: ConjugationPage,
});
