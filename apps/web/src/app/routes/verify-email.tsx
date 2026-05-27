import { createFileRoute } from '@tanstack/react-router';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage';

// Same search-param pattern as reset-password: token may be absent if user
// typed the URL manually. VerifyEmailPage handles missing token gracefully.
export interface VerifyEmailSearch {
  token: string | undefined;
}

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search): VerifyEmailSearch => ({
    token: typeof search['token'] === 'string' ? search['token'] : undefined,
  }),
  component: VerifyEmailPage,
});
