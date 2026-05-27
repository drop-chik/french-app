/**
 * Shared password-strength rule for client-side instant feedback.
 *
 * Stays in lockstep with the server's PASSWORD_RULE in
 * apps/api/src/modules/auth/auth.schema.ts. If you change one, change
 * the other — the server is the source of truth, the client just
 * surfaces it earlier so users don't submit only to get an error toast.
 *
 * Rule: ≥8 chars, ≥1 letter, ≥1 digit. See the comment on PASSWORD_RULE
 * in auth.schema.ts for why this exact rule (NIST SP 800-63B compromise).
 */
export interface PasswordCheck {
  ok: boolean;
  /** Which individual constraints pass — for the granular per-rule UI. */
  checks: {
    length: boolean;
    letter: boolean;
    digit: boolean;
  };
}

export function checkPassword(pw: string): PasswordCheck {
  const length = pw.length >= 8;
  const letter = /[a-zA-Z]/.test(pw);
  const digit = /[0-9]/.test(pw);
  return {
    ok: length && letter && digit,
    checks: { length, letter, digit },
  };
}
