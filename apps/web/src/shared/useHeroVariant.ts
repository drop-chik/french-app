import { useEffect, useState } from 'react';

const KEY = 'frenchup:hero-variant';

/**
 * Read & persist the landing hero variant: 'pos' (default) vs 'neg'
 * (the negative-frame "Stop practicing your mistakes" copy).
 *
 * Switching:
 *   /?neg=1   → force negative frame, persist
 *   /?neg=0   → force positive frame, persist
 *   no param  → whatever was last persisted (default 'pos')
 *
 * Lightweight by design — no analytics or feature-flag service in
 * play yet. When we adopt PostHog feature flags, this stays as the
 * canonical 'which variant am I rendering' hook; only the resolver
 * changes from URL/localStorage to the flag SDK.
 */
export type HeroVariant = 'pos' | 'neg';

function readUrl(): HeroVariant | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const v = p.get('neg');
  if (v === '1') return 'neg';
  if (v === '0') return 'pos';
  return null;
}

function readStored(): HeroVariant {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === 'neg' ? 'neg' : 'pos';
  } catch {
    return 'pos';
  }
}

export function useHeroVariant(): HeroVariant {
  const [variant, setVariant] = useState<HeroVariant>(() => readUrl() ?? readStored());
  useEffect(() => {
    const fromUrl = readUrl();
    if (fromUrl) {
      try { localStorage.setItem(KEY, fromUrl); } catch { /* private */ }
      setVariant(fromUrl);
    }
  }, []);
  return variant;
}
