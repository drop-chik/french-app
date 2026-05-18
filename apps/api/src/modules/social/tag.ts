import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users } from '../../db/schema/index.js';

// Slug = first name-word, lowercased, ASCII-only, max 20 chars. Falls back
// to "user" when the name has nothing usable (e.g. only emoji / Cyrillic).
function slugify(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const cleaned = first.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned.length >= 2 ? cleaned.slice(0, 20) : 'user';
}

function rand4(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, '0');
}

/**
 * Generate a collision-free public @tag like `kraid-7f2a`. The 4-char base36
 * suffix gives ~1.6M combinations per slug, so a clash is rare — but we still
 * probe the DB and retry, falling back to a longer suffix in the worst case.
 */
export async function generateUniqueTag(db: DB, name: string): Promise<string> {
  const slug = slugify(name);
  for (let i = 0; i < 6; i++) {
    const candidate = `${slug}-${rand4()}`;
    const clash = await db.query.users.findFirst({
      where: eq(users.tag, candidate),
      columns: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${slug}-${rand4()}${rand4()}`;
}
