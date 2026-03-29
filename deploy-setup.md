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

**Compute region:** This repo sets **`"regions": ["iad1"]`** in **`vercel.json`** (US East) for more **stable** latency from US probes and shorter cold paths vs. bouncing regions. **EU-heavy users** may see higher RTT; switch to **`"lhr1"`** or remove **`regions`** if that fits your audience better.

---

## GitHub Actions — secrets checklist (complete in GitHub UI)

Do this once so **scheduled jobs are real**, not failing every run.

1. GitHub → **your repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret | Required for | Value source |
|--------|----------------|--------------|
| **`AMPLY_PROD_URL`** | **Synthetic API latency** (`.github/workflows/synthetic-latency.yml`) **and** **Catalog freshness** (`.github/workflows/catalog-freshness.yml`) | Production origin only, e.g. `https://www.useamply.com` (no path). |
| **`AMPLY_API_KEYS`** | **Synthetic API latency** only (so `POST /api/v1/route` is probed) | Same **comma-separated** string as **Vercel** → Project → **Environment Variables** → **`AMPLY_API_KEYS`**. |

2. **Actions** tab → run **Synthetic API latency** → **Run workflow** once; confirm green.
3. **Actions** tab → run **Catalog freshness check** → **Run workflow** once; confirm green.

Workflows **fail fast** if a required secret is missing (no silent skip).

**Local check (optional):** [GitHub CLI](https://cli.github.com/) + `npm run check:gha-secrets` (verifies secret **names** exist — see `deploy-setup.md` § Catalog automation for `gh auth login`).

```bash
gh auth login
npm run check:gha-secrets
GITHUB_REPOSITORY=owner/repo npm run check:gha-secrets   # if not default remote
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