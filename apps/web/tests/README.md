# E2E tests (Playwright)

Smoke tests for the unauthenticated parts of the SPA. They verify that:

- the landing page renders with a CTA to `/login`
- `/login` has a working email + password form
- `/privacy` and `/terms` return 200 with non-empty bodies
- visiting `/dashboard` while logged out redirects to `/login`
- empty-form submission triggers HTML5 validation

## Running locally

```bash
# 1. Install the browser binaries (once per machine)
pnpm --filter @french-app/web exec playwright install chromium

# 2. Start the SPA in one terminal
pnpm dev

# 3. In another terminal, run the tests
pnpm --filter @french-app/web test:e2e

# Or open the interactive UI runner (very useful for debugging)
pnpm --filter @french-app/web test:e2e:ui
```

## Running against a deployed instance

```bash
PLAYWRIGHT_BASE_URL=https://french-web-two.vercel.app \
  pnpm --filter @french-app/web test:e2e
```

## Adding authenticated flows

The current suite is intentionally read-only — no DB writes, no AI calls.
Once we have a dedicated test database (docker-compose Postgres in CI, for
example), the next test to add is the golden path:

1. register a fresh user
2. complete the placement test
3. start a vocabulary session
4. answer one word
5. confirm the dashboard shows updated stats

Until then, the smoke tests catch the most common regressions (broken
build, broken routing, broken login form) in under 10 seconds.
