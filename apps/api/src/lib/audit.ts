import type { DB } from '../db/index.js';
import { auditLog } from '../db/schema/index.js';

/**
 * Standard `action` discriminator values. New ones are fine — the column
 * is a free-form varchar — but using these constants keeps queries and
 * dashboards consistent across the codebase.
 */
export const AuditAction = {
  AdminUserUpdate:        'admin.user.update',
  AdminUserResetProgress: 'admin.user.reset_progress',
  SelfAccountDelete:      'self.account.delete',
  // Future: 'admin.user.delete', 'admin.role.grant', 'admin.role.revoke'.
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

export interface AuditEntry {
  /** UUID of the user who triggered the action. NULL for system/cron. */
  actorUserId: string | null;
  action: AuditActionValue;
  /** UUID of the user the action was performed on. May equal actor for self-service. */
  targetUserId: string | null;
  /** Arbitrary payload — keep it small (<2KB), structured, JSON-safe. */
  metadata?: Record<string, unknown>;
}

/**
 * Insert one row into `audit_log`. Designed to be a fire-and-forget
 * extra alongside the actual mutation:
 *
 *   await updateUser(db, ...)
 *   await logAuditEvent(db, { ... })
 *
 * Errors are swallowed — a failed audit insert MUST NOT roll back the
 * real action it's recording. The error is logged via console.error so
 * Sentry / Railway logs still surface it; this is the right trade-off
 * for an observability table that fails open.
 */
export async function logAuditEvent(db: DB, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      targetUserId: entry.targetUserId,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    // Don't propagate — better to lose the audit row than fail the
    // user-facing action that succeeded a moment ago.
    console.error('[audit] failed to write audit row', {
      action: entry.action,
      target: entry.targetUserId,
      err: err instanceof Error ? err.message : err,
    });
  }
}
