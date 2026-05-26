import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage } from '../../pages/auth/ResetPasswordPage';

// Exported so TanStack Router's generated routeTree can name the validated
// search-param shape without inlining anonymous types (would fail TS4023).
export interface ResetPasswordSearch {
  token: string | undefined;
}

export const Route = createFileRoute('/reset-password')({
  // Accept the `?token=...` search param. ResetPasswordPage validates it
  // (renders a dead-end if missing) so we don't need stricter parsing here.
  validateSearch: (search): ResetPasswordSearch => ({
    token: typeof search['token'] === 'string' ? search['token'] : undefined,
  }),
  component: ResetPasswordPage,
});
