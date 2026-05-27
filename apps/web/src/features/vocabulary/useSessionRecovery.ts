import { useEffect, useState, useCallback } from 'react';

/**
 * Lightweight session recovery for the vocabulary flow. Persists the last
 * non-menu mode the user opened, plus when it started. On next page mount,
 * surface a banner "you had an unfinished session, continue?" if it was
 * recent enough.
 *
 * Why minimal: real "resume from word N" requires lifting per-mode state
 * (FlashcardMode tracks its own index internally) up to VocabularyPage and
 * persisting every grade. Big refactor for marginal win — SRS surfaces the
 * same cards anyway, the user lost ~0 progress. This banner is the 80/20:
 * the user just clicks "Continue", lands back on Smart Session, and the
 * SRS planner reissues whatever was due. Zero data loss in practice.
 *
 * Storage shape:
 *   { mode: ActiveMode, startedAt: number }
 *
 * Cleanup triggers (caller responsibility):
 *   - `clearRecovery()` when the user reaches the menu OR completes a session
 *   - `recordModeStart(mode)` whenever activeMode flips to a non-menu mode
 *
 * Expiry: 30 minutes. Anything older is silently dropped on read —
 * "session you started 2 days ago" isn't a useful prompt.
 */
const STORAGE_KEY = 'frenchup:vocab-session';
const EXPIRY_MS = 30 * 60 * 1000; // 30 min

export interface RecoverySnapshot {
  mode: string;
  startedAt: number;
  /** Minutes since startedAt, rounded down. Convenience for the banner copy. */
  minutesAgo: number;
}

function readRaw(): { mode: string; startedAt: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as { mode?: unknown }).mode !== 'string' ||
      typeof (parsed as { startedAt?: unknown }).startedAt !== 'number'
    ) return null;
    return parsed as { mode: string; startedAt: number };
  } catch {
    // private mode / quota exceeded / corrupt JSON — fall through
    return null;
  }
}

function writeRaw(value: { mode: string; startedAt: number } | null): void {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export function useVocabSessionRecovery() {
  const [snapshot, setSnapshot] = useState<RecoverySnapshot | null>(null);

  // Compute snapshot on mount only — banner shows once per page visit.
  useEffect(() => {
    const raw = readRaw();
    if (!raw) return;
    const age = Date.now() - raw.startedAt;
    if (age > EXPIRY_MS || age < 0) {
      writeRaw(null);
      return;
    }
    setSnapshot({
      mode: raw.mode,
      startedAt: raw.startedAt,
      minutesAgo: Math.floor(age / 60_000),
    });
  }, []);

  const recordModeStart = useCallback((mode: string) => {
    if (mode === 'menu' || mode === 'complete') {
      writeRaw(null);
      return;
    }
    writeRaw({ mode, startedAt: Date.now() });
  }, []);

  const clearRecovery = useCallback(() => {
    writeRaw(null);
    setSnapshot(null);
  }, []);

  const dismissBanner = useCallback(() => {
    // Just hide the banner — don't wipe storage. If the user reloads after
    // dismissing, banner won't reappear because the timestamp check on
    // mount catches stale (>30min) entries; the snapshot itself stays
    // until recordModeStart overwrites it.
    setSnapshot(null);
  }, []);

  return { snapshot, recordModeStart, clearRecovery, dismissBanner };
}
