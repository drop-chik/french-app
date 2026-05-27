import { z } from 'zod';

/**
 * Password strength rule. Conscious trade-off:
 *  - Not zxcvbn (200KB dep that ships to client; overkill for an app
 *    without high-value targets).
 *  - Not "8 lowercase characters" — `12345678` passes that and is in
 *    every top-100 leak list.
 *  - Compromise: ≥8 chars, ≥1 letter, ≥1 digit. Blocks the worst
 *    all-numeric / all-alpha leaks ("password", "qwerty", "12345678"),
 *    aligns with NIST SP 800-63B which deprecates forced complexity
 *    in favour of length + breach-list checks but accepts a minimal
 *    diversity rule when no breach DB is wired in.
 *
 * The frontend mirrors this rule for instant feedback (apps/web/src/
 * features/auth/passwordRules.ts) — keep them in sync.
 */
const PASSWORD_RULE = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(100)
  .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one digit' });

export const registerSchema = z.object({
  email: z.string().email(),
  password: PASSWORD_RULE,
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  // Login intentionally accepts any non-empty password — applying the new
  // rule retroactively would lock out users whose passwords were set under
  // the old "min 8 chars" rule. They can rotate via /profile when they like.
  password: z.string().min(1),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PASSWORD_RULE,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: PASSWORD_RULE,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
