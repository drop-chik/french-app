# FrenchUp — Operational Runbook

Last updated: 2026-05-28. Author: project owner.

This is the "thing went wrong, what do I do" doc. Each section starts with
the **symptom** so you find the right one fast, then gives **immediate
mitigation** before the deeper recovery steps.

## Quick-reference

| Symptom | Section |
|---------|---------|
| Site shows blank / 500 / "Not Found" | [Frontend down](#frontend-down) |
| Login works but every other API call 500 | [API down](#api-down) |
| Login fails with 500 / DB errors | [Database down](#database-down) |
| Last deploy broke things | [Rollback a deploy](#rollback-a-deploy) |
| Need to restore data | [Restore from backup](#restore-from-backup) |
| Email verification / digest / streak reminders not arriving | [Email outage](#email-outage) |
| All users seeing stale screen after deploy | [Stale PWA cache](#stale-pwa-cache) |

---

## Frontend down

**Symptoms:** `https://french-web-two.vercel.app/` 500s, white page, or
permanent loading spinner.

### Immediate

1. Check Vercel dashboard → Project `french-web` → Deployments. If the most
   recent deployment is in `ERROR` state, the previous one is still live —
   no action needed, the old build keeps serving. If a new deploy is
   currently `BUILDING`, wait ~3 min.
2. If the latest READY deployment is broken anyway:
   ```bash
   vercel ls          # find a previous-good deployment URL
   vercel promote <prev-url> --yes
   ```
   This atomically points the production alias at the older deployment.
   Takes ~10 seconds.

### Deeper

- Check `gh run list --limit 5` — if GitHub Actions never triggered, the
  `.github/workflows/deploy.yml` may have failed before deploy step. Look
  at `gh run view <id> --log-failed`.
- If Vercel itself is down: status.vercel-status.com. There's no fix from
  our side — wait.

---

## API down

**Symptoms:** Frontend loads, but API requests fail with 502/503/timeout.
NetworkBanner appears for users.

### Immediate

1. Check Railway dashboard → Project `french-app` → service `french-app`.
   Status panel shows last deploy + current state.
2. If the latest deployment is `CRASHED` or `FAILED`:
   ```bash
   railway logs --service french-app  # see startup error
   ```
   Common culprits:
   - Bad migration (FST_ERR_SCH_SERIALIZATION_BUILD or
     `relation X already exists`): fix the migration file, push again.
   - Missing env var: check Variables tab.
3. Rollback by redeploying the previous good commit:
   ```bash
   gh api repos/drop-chik/french-app/commits | jq '.[].sha' | head -10
   # pick the previous-good SHA, then
   git push origin <sha>:main --force-with-lease
   ```
   Railway auto-redeploys the new HEAD. **Only use force-push as a last
   resort** — prefer reverting the bad commit via PR.

### Deeper

- `/health` returns 200? `curl https://french-app-production.up.railway.app/health`
- Sentry has stack trace? sentry.io → french-app project → recent issues.
- If specific endpoint fails: `railway logs --service french-app | grep <route>`.

---

## Database down

**Symptoms:** API logs show `ECONNREFUSED 127.0.0.1:5432`, or all
DB-touching endpoints 500.

### Immediate

1. Railway → service `Postgres` → Status. If degraded, no fix from our
   side; wait. If healthy, the API can't reach it — check API's
   `DATABASE_URL` env var still points at the right reference.
2. Run a quick read to confirm:
   ```bash
   railway service Postgres
   railway logs  # look for OOM / disk-full warnings
   ```

### Deeper

- Check pg_stat_activity for long-running queries that might be blocking:
  ```sql
  SELECT pid, now() - query_start AS duration, state, query
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY duration DESC
  LIMIT 10;
  ```
- Vacuum status: `SELECT relname, last_vacuum, last_autovacuum FROM
  pg_stat_user_tables ORDER BY last_autovacuum DESC LIMIT 10;`

---

## Rollback a deploy

**When:** A deploy is live and breaking things. You want the previous
version back, fast.

### Frontend (Vercel)

```powershell
$env:VERCEL_PROJECT_ID = "prj_rL5fkZ4miFHXahgNm0i0YF6WfU6M"
$env:VERCEL_ORG_ID = "team_zh4sSpQ249RQ1ai20Qlj8a67"
vercel ls                                    # find previous-good URL
vercel promote <previous-deployment-url> --yes
```

Vercel keeps every deployment immutable forever, so any previous URL is
always promotable. Promotion is atomic — no users see a half-state.

### Backend (Railway)

Railway doesn't have a "promote previous deployment" button as clean as
Vercel's. Two options:

**Option A — Revert via Git (preferred):**
```bash
git log --oneline -5
git revert <bad-sha>
git push origin main
```
This is auditable, leaves a record, and triggers a normal Railway deploy.
Takes ~3-5 min.

**Option B — Redeploy a previous SHA (faster, less clean):**
- Railway dashboard → service → Deployments tab → click the
  three-dot menu on a previous successful deployment → "Redeploy".
  Takes ~3 min.

### Database migration rollback

Drizzle migrations are forward-only by design. If a migration broke
prod, the rollback path is **a new migration that reverses it**, not
deleting the migration file. Example:

```sql
-- 0028_revert_bad_column.sql
ALTER TABLE users DROP COLUMN IF EXISTS bad_column_added_in_0027;
```

If the bad migration is **already in production**: do not edit
`0027_xxx.sql` — Drizzle's `_journal.json` already records it as
applied. Just add the reversal migration.

If the bad migration is **not yet in production** (e.g. CI smoke test
caught it): delete the migration file + the matching `_journal.json`
entry on the same branch, push the fix.

---

## Restore from backup

**Symptoms:** Data was destroyed or corrupted. We need to get a specific
table or the whole DB back to a point in time.

### Railway daily backups

Railway runs daily backups, retention 7 days by default. To restore:

1. Railway → service `Postgres` → "Backups" tab
2. Pick a backup from before the incident
3. Click "Restore" — Railway provisions a new DB from the snapshot
4. Update `DATABASE_URL` reference in the `french-app` service to
   point at the restored DB
5. Redeploy API (`railway redeploy --yes` in the french-app service)

**WARNING:** Full DB restore loses every write since the snapshot.
If only one table was affected, prefer targeted recovery:

### Targeted table recovery

1. Restore the backup to a separate temp DB (Railway lets you do
   this via dashboard without overwriting prod).
2. `pg_dump` the affected table from the temp DB:
   ```bash
   pg_dump $TEMP_DATABASE_URL -t users --data-only --inserts > users.sql
   ```
3. Edit `users.sql` to scope to the rows you actually need.
4. Apply to prod:
   ```bash
   psql $PROD_DATABASE_URL -f users.sql
   ```

### Backup retention extension

Default 7 days. To extend (recommended → 30 days):
Railway → service Postgres → Settings → Backups → "Retention" → 30 days.
This requires a paid plan tier; check current billing before.

---

## Email outage

**Symptoms:** Users report no verification email arriving, weekly digest
didn't go out, streak reminders missing.

### Verify Resend health

1. https://status.resend.com — is the provider itself OK?
2. Resend dashboard → "Logs" → filter by recent timestamp. If sends are
   firing but bouncing, the issue is recipient-side (Gmail rate-limit,
   user marked us as spam in the past).
3. API key valid?
   ```bash
   railway service french-app
   railway variables | grep RESEND_API_KEY
   # The reference should resolve to a re_... value
   ```

### From-domain not verified

We default `RESEND_FROM` to `FrenchUp <onboarding@resend.dev>` if env var
is unset. The `@resend.dev` domain only delivers to the Resend
account-owner's email — every other recipient gets nothing. Long-term
fix: verify our own domain at resend.com/domains (DNS records: SPF +
DKIM + DMARC). Until then, public email features are limited.

### Cron not firing (weekly-digest / streak-reminder)

1. Railway → cron service → "Cron Runs" tab → see Recent Executions.
   Failed runs show in red.
2. If schedule is wrong: Settings → Schedule, edit cron expression.
3. To trigger manually: "Run Now" button (uses the latest deployment).

---

## Stale PWA cache

**Symptoms:** Users on a previous version see a Not-Found / blank screen
after we deploy a new release with new routes or chunks.

### Why it happens

After a deploy, the new bundle uses different hashed chunk filenames.
Users whose browser has the old `index.html` cached by the Service
Worker still try to load `<old-hash>.js` chunks, which the new SW
doesn't have → 404 → chunk-load error.

### Defences in place

1. **`registerType: 'prompt'`** in `vite.config.ts` — new SW stays in
   "waiting" state, doesn't activate until user confirms.
2. **PWAUpdater banner** (`shared/components/PWAUpdater.tsx`) — shows
   bottom-right when SW update is pending, with a "Reload" button that
   does `SKIP_WAITING` + `location.reload()` atomically.
3. **`vite:preloadError` listener** in `main.tsx` — if a chunk 404 hits
   despite the above, the listener triggers `window.location.reload()`
   once (sessionStorage guard prevents infinite loop).
4. **Custom 404 component** in `main.tsx` — for users hitting a brand-new
   route the old SW doesn't know about; the 404 page has a "Reload"
   button that unregisters SW + clears CacheStorage + reloads.

### Manual recovery (for a specific user)

If a user reports stuck-on-old-version:

1. Ask them to Ctrl+Shift+R (hard refresh — bypasses SW cache).
2. Or DevTools → Application → Service Workers → "Unregister" + reload.
3. Or in our custom 404 page they can click "Reload" which does both.

---

## Routine maintenance

### Weekly checks (5 min)

- `gh run list --limit 10` — any failed CI runs?
- Vercel + Railway dashboards green?
- Sentry — any new issues with spikes?
- Resend logs — any unusual bounce rate?

### Monthly checks (15 min)

- DB size growing? `SELECT pg_size_pretty(pg_database_size('railway'));`
- Vacuum frequency healthy? `SELECT * FROM pg_stat_user_tables ORDER BY
  last_autovacuum DESC NULLS LAST LIMIT 10;`
- OpenAI bill within expected range? (dashboard.openai.com)
- Resend monthly send count within free tier (3000/mo)?

### Quarterly

- Rotate JWT_SECRET and JWT_REFRESH_SECRET (will log everyone out — coordinate timing).
- Review `docs/AUDIT.md` Pass 4 items for any newly applicable.
- Confirm Railway backup retention still 7 days+ and accessible.

---

## Contacts

- Resend account: <user email>
- Railway account: <user email>
- Vercel account: <user email>
- OpenAI account: <user email>
- GitHub repo owner: `drop-chik`

If we ever onboard a co-maintainer, document their channels here too.
