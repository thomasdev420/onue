# Vercel Deployment Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### Essential Variables (Required for AI functionality)
```
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### Supabase Configuration (Required for data persistence)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables (For full functionality)
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Optional: OAuth for a third-party short-form video platform (env names kept for compatibility)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/tiktok/callback
```

## How to Add Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings, then Environment Variables
4. Add each variable with the correct name and value
5. Redeploy your project

## Common Issues:

1. **AI not working**: Missing `OPENAI_API_KEY`
2. **Authentication errors**: Missing `NEXTAUTH_SECRET` or incorrect `NEXTAUTH_URL`
3. **Data not saving**: Missing Supabase credentials
4. **Web scraping failing**: Missing OpenAI API key (used for content analysis)

## Testing:

After setting environment variables, test these endpoints:
- `/api/ai-chat` - Should return AI responses
- `/api/scrape-website` - Should scrape and analyze websites
- `/api/generate-slides` - Should generate slide content

---

## Amply API v1 (production) — latency and SLO semantics

The public API (`/api/v1/status`, `/api/v1/route`) exposes two different timing concepts:

| Measure | What it is | Where you see it |
|--------|------------|------------------|
| **Wall RTT** | Full round-trip from the **client** (curl, GitHub Actions runner, browser) until the HTTP response finishes. Includes DNS, TLS, distance to the **edge**, and jitter. | `scripts/synthetic-probe.mjs` output: `wall_p50_ms`, `wall_p95_ms`, etc. |
| **Server compute** | Time spent **inside** the Node.js handler after the request reached the function (catalog load, scoring). Does not include your network leg to Vercel. | JSON **`compute_ms`**, response header **`X-Amply-Compute-Ms`**, and probe fields `compute_p95_ms` when headers are present. |

**Product bar (~200 ms):** Use **server compute** (`compute_ms` / `X-Amply-Compute-Ms`, e.g. `compute_p95_ms` in the synthetic probe) as the primary SLO for “fast agent path.” **Wall p95** from a **GitHub-hosted runner** (typically US) can sit around **~200–250 ms** without indicating a regression—compare **compute p95** across deploys. For wall RTT comparable to users in another region, run `npm run probe:synthetic` from a machine in that region.

**Optional tuning:** To pin where serverless functions run, set **`regions`** in `vercel.json` (e.g. `"iad1"` for US East, `"lhr1"` for London). That trades **consistent** compute placement against **global** client RTT; leave unset to use Vercel defaults.

---

## GitHub Actions — synthetic latency workflow

The workflow **Synthetic API latency** (`.github/workflows/synthetic-latency.yml`) runs on a schedule and on **workflow_dispatch**. It needs these **repository secrets** (not environment secrets):

1. Open the repo on GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Confirm both exist:

| Secret | Example / notes |
|--------|-----------------|
| **`AMPLY_PROD_URL`** | `https://www.useamply.com` (origin only, no trailing path) |
| **`AMPLY_API_KEYS`** | Same comma-separated value as **Vercel** → Project → Environment Variables → `AMPLY_API_KEYS` (first key is used for `POST /api/v1/route`). |

If either secret is missing, the workflow **fails** with an explicit error (no silent skip). After adding secrets, re-run the workflow from the **Actions** tab (**Run workflow**) to verify.

**Local check (optional):** with [GitHub CLI](https://cli.github.com/) installed and authenticated:

```bash
gh auth login
npm run check:gha-secrets
# Monorepo / non-default remote:
GITHUB_REPOSITORY=owner/repo npm run check:gha-secrets
```

---

## Catalog automation (ETL) — keep `metrics_as_of` live

**Source of truth:** `data/amply_route_catalog.json` (versioned metrics + IDs). The in-memory fallback seed and routing engine read the same shapes.

### Apply to production Postgres

1. **On deploy (Vercel):** `vercel.json` registers **`GET /api/cron/catalog-refresh`** on a schedule. **Hobby (free) plans only allow at most once per day**; this repo uses **`0 9 * * *`** (≈09:00 UTC daily). **Pro** allows more frequent crons (e.g. every few hours). The **Observability → Cron Jobs** table may look **empty or redacted on Hobby**; that does not stop the route from working—use **`curl`** (below) to run it anytime.  
2. **Env on Vercel:** set **`CRON_SECRET`** (opaque string, e.g. `openssl rand -hex 24`). Vercel sends `Authorization: Bearer <CRON_SECRET>` when the cron runs.  
3. **`DATABASE_URL`** (or pooler URL) must already be set so the handler can upsert `amply_route_providers`.

**Manual / CI (same logic as cron):**

```bash
# .env with DATABASE_URL
npm run catalog:sync
```

This upserts all rows from the JSON and sets **`metrics_as_of`** / **`updated_at`** to **`NOW()`**.

**Alert when prod is stale:** GitHub Actions workflow **`catalog-freshness.yml`** (schedule + `workflow_dispatch`) runs **`npm run check:catalog-fresh`** against **`AMPLY_PROD_URL`**. Add that repository secret; a red run means **`catalog_metrics_stale`** is still true (fix cron, run `catalog:sync`, or ship new JSON).

**Strict deploy verify (optional):** `AMPLY_VERIFY_FAIL_ON_STALE=1 npm run verify:deploy -- https://…` fails if stale.

### Editing metrics honestly

1. Update numbers in **`data/amply_route_catalog.json`** (and bump **`version`** if you track releases).  
2. Commit, deploy, and either wait for cron or run **`npm run catalog:sync`** against production DB.  
3. Replace the snapshot with **real pipeline output** when you have automated ingestion; keep calling **`syncCatalogProviders`** (or the SQL you generate) so **`metrics_as_of`** advances.

### Legacy one-off (timestamps only, same numbers)

`scripts/sql/refresh-catalog-metrics-as-of.sql` — Supabase SQL editor; use only when you intentionally keep row values but need to clear staleness after review.

### Status fields

**`GET /api/v1/status`** includes **`diagnostics.catalog_metrics_age_hours`**, **`catalog_metrics_stale`** (vs **`AMPLY_CATALOG_STALE_AFTER_HOURS`**, default **24**), and **`catalog_metrics_stale_after_hours`**.