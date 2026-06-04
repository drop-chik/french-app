/**
 * Lightweight analytics shim.
 *
 * Wraps PostHog (loaded on demand when VITE_POSTHOG_KEY is set) behind
 * a stable trackEvent / identifyUser API so feature code doesn't need
 * to know whether analytics is enabled. Without the env var the calls
 * are silent no-ops, so this can ship to production without any
 * runtime cost when we haven't created a PostHog account yet.
 *
 * Events we want eventually:
 *   - word_reviewed (grade, level)
 *   - session_completed (mode, duration, words)
 *   - level_promoted (from, to)
 *   - placement_retake_started
 *   - grammar_topic_completed
 *   - listening_exercise_completed
 *   - reading_text_completed
 *   - writing_submitted (level, words, score)
 *
 * To activate in production: create a PostHog project → put the
 * "Project API Key" into VITE_POSTHOG_KEY on Vercel → redeploy.
 */
import { hasConsent } from './consent';

type PostHog = {
  init: (key: string, opts: Record<string, unknown>) => void;
  capture: (eventName: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
};

let posthog: PostHog | null = null;
let initialized = false;
let initializing: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (initialized) return;
  if (initializing) return initializing;
  // Gate on cookie consent — without explicit opt-in we never load the SDK.
  if (!hasConsent()) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) {
    initialized = true;
    return;
  }
  initializing = (async () => {
    try {
      // posthog-js is intentionally NOT a dependency yet — we adopt
      // PostHog only when VITE_POSTHOG_KEY is set. The module path is
      // built from a variable so Rollup can't statically analyse it
      // and won't try to resolve the package at build time. If the
      // dependency isn't installed at runtime, the catch below keeps
      // us as a true no-op.
      const moduleName = ['posthog', 'js'].join('-');
      const mod = await import(/* @vite-ignore */ moduleName);
      posthog = (mod.default ?? mod) as unknown as PostHog;
      posthog.init(key, {
        api_host: (import.meta.env.VITE_POSTHOG_HOST as string) ?? 'https://eu.i.posthog.com',
        capture_pageview: true,
        persistence: 'localStorage',
      });
    } catch {
      // posthog-js not installed, or network failure — stay no-op
      posthog = null;
    } finally {
      initialized = true;
      initializing = null;
    }
  })();
  return initializing;
}

export async function trackEvent(name: string, props?: Record<string, unknown>): Promise<void> {
  await ensureInit();
  posthog?.capture(name, props);
}

export async function identifyUser(id: string, props?: Record<string, unknown>): Promise<void> {
  await ensureInit();
  posthog?.identify(id, props);
}

export async function resetAnalytics(): Promise<void> {
  await ensureInit();
  posthog?.reset();
}
