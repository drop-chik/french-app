# API types (auto-generated)

`openapi.types.ts` is regenerated from the running API's `/docs/json` endpoint.
Don't edit it by hand — it'll just be overwritten.

## Re-generate

```bash
# from prod (works from anywhere, no local API needed)
pnpm --filter @french-app/web api:types:prod

# from a locally running API (pnpm dev in apps/api)
pnpm --filter @french-app/web api:types
```

## Using the types

Each path is typed by HTTP method. To extract the response type for a given
endpoint, use the `paths` interface:

```ts
import type { paths } from './openapi.types';

// Response shape of GET /achievements/xp
type XpSummary = paths['/achievements/xp']['get']['responses']['200']['content']['application/json'];

// Request body shape of POST /words/{id}/answer
type AnswerBody = paths['/words/{id}/answer']['post']['requestBody']['content']['application/json'];
```

This catches API mismatches at compile time. If the backend rename a field, the
build fails — not the user's session.

## Workflow

Until the API stabilises, regenerate after any route schema change:

1. Update the schema in `apps/api/src/modules/.../*.routes.ts`
2. Push and wait for Railway to deploy (~3 min)
3. Run `pnpm --filter @french-app/web api:types:prod`
4. Commit the regenerated file

Long-term we should wire this into CI so the types are always in sync with
the live API.
