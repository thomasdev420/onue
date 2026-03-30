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

### Optional — provider listings (one Stripe Payment Link + Calendly)
Create **one Payment link** in [Stripe Dashboard](https://dashboard.stripe.com) (e.g. listing deposit or default tier) → copy the `https://buy.stripe.com/...` URL. In Vercel → **Environment Variables** (Production + Preview if needed):

```
NEXT_PUBLIC_STRIPE_LISTING_URL=https://buy.stripe.com/...
NEXT_PUBLIC_CALENDLY_PROVIDER_URL=https://calendly.com/your-org/...
```

(Optional legacy: **`NEXT_PUBLIC_STRIPE_LISTING_BASIC_URL`** is still read if **`NEXT_PUBLIC_STRIPE_LISTING_URL`** is empty.)

Redeploy after saving — **`NEXT_PUBLIC_*`** is baked in at build time. **`/pricing`** and **`/providers/join`** show **Pay with Stripe** when the URL is set.

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

**Measure p95 (local or CI):** Scripts honor **`DOTENV_CONFIG_PATH`** so you can point at a file from **`vercel env pull`** (production secrets) without editing `.env`:

```bash
vercel env pull .env.vercel.pull --environment=production --yes
DOTENV_CONFIG_PATH=.env.vercel.pull npm run probe:synthetic:p95 -- https://www.useamply.com
# Optional hard gate on server compute (not wall RTT):
DOTENV_CONFIG_PATH=.env.vercel.pull AMPLY_PROBE_FAIL_COMPUTE_P95_MS=200 npm run probe:synthetic -- https://www.useamply.com

npm run amply:verify-bearer
npm run probe:synthetic:p95 -- https://www.useamply.com
```

(`.env*` is gitignored — do not commit `.env.vercel.pull`.)

---

## Observability — `amplyLog` and log drains

API routes use **`app/lib/amplyRoute/amplyLog.js`**: one **JSON object per line** on `stdout` when **`AMPLY_LOG_STRUCTURED`** is unset or `1`. Vercel captures function logs; attach a **log drain** (Datadog, Axiom, Grafana Loki, etc.) to that stream for retention, alerts, and dashboards.

**Typical fields (filter / group in your SIEM):**

| Field | Use |
|--------|-----|
| `ts` | ISO timestamp |
| `svc` | always `amply` |
| `msg` | e.g. `v1.status`, `v1.route`, `v1.route.unauthorized`, `v1.route.rate_limited`, `amply.server_route.http_error` |
| `level` | `info` \| `warn` \| `error` |
| `request_id` | Correlate with JSON responses and **`X-Amply-Request-Id`** |
| `compute_ms` | Server-side handler time (SLO / error budgets) |
| `data_mode`, `catalog_backend`, `catalog_issue` | Catalog path health |

**SLO / error budgets:** Chart **`compute_ms`** from **`msg` ∈ `v1.status`, `v1.route`** (success paths) as **p95/p99**; count **`v1.route.unauthorized`**, **`v1.route.rate_limited`**, **`amply.server_route.*`** for auth / client / upstream failures. Wall RTT is **not** in these lines — use **`npm run probe:synthetic`** or edge APM for client-to-edge latency.

**Human-readable local logs:** Set **`AMPLY_LOG_STRUCTURED=0`** in `.env` for multi-line console output while debugging.

### Vercel — attach a log drain (Row 6)

Vercel does not define drains in `vercel.json`; configure in the dashboard or [Vercel Drains API](https://vercel.com/docs/drains).

1. **Vercel** → your **project** → **Settings** → **Log Drains** (or **Observability** → drains, depending on UI).
2. **Add drain** → choose destination (**Datadog**, **Axiom**, **Grafana Cloud / Loki**, **HTTP endpoint**, etc.).
3. Filter scope: **this project**, environment **Production** (and **Preview** if needed).
4. In your sink, build charts:
   - **p95 / p99** of **`compute_ms`** where **`msg`** is `v1.status` or `v1.route` (JSON parse each log line).
   - **Counters** on **`msg`** = `v1.route.unauthorized`, `v1.route.rate_limited`, `v1.route` with **`level`** = `warn` / `error`.

Query examples depend on the vendor (e.g. Axiom: `['svc'] == 'amply' and ['msg'] == 'v1.route'`).

### E2E: `Invalid API key` on `POST /api/v1/route`

1. **User key (`amply_sk_…`):** Run **`npm run amply:verify-bearer`** — confirms the secret exists in **`amply_api_keys`** for **`NEXT_PUBLIC_SUPABASE_URL`** in your `.env`. If **NOT FOUND**, create a key in **Dashboard → API keys** and paste the **full** secret into **`AMPLY_ROUTE_BEARER_TOKEN`** (same project Vercel uses). If **REVOKED**, create a new key.
2. **Server key:** No row in Supabase — **`AMPLY_API_KEYS`** on **Vercel Production** must include the **same raw** comma-separated secret you send as **`Authorization: Bearer …`** (never paste the SHA-256 hash).
3. **Full chain:** **`npm run amply:e2e -- https://www.useamply.com`** (verify-bearer + **`verify:deploy`**). With pulled prod env: **`DOTENV_CONFIG_PATH=.env.vercel.pull npm run amply:e2e -- https://www.useamply.com`**.
4. **`amply:verify-bearer` OK but prod POST still 401:** Production is almost certainly using a **different Supabase project** than your local `.env`. In **Vercel → Settings → Environment Variables → Production**, set **`NEXT_PUBLIC_SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** to the **same** project where **`amply_api_keys`** contains your row (same hostname as in `amply:verify-bearer` output). Redeploy.
5. **`AMPLY_API_KEYS` set on Vercel:** Clients may authenticate with a **server** secret that appears **literally** in that comma-separated list, **or** with an **`amply_sk_…`** user key **only if** Supabase validation can see **`amply_api_keys`** for that project. A 64-character hex value in **`AMPLY_API_KEYS`** is valid **only** if you intentionally use that exact string as **`Authorization: Bearer …`** (prefer generating server keys with **`openssl rand -hex 32`** and rotating if exposed).

---

## GitHub Actions — secrets checklist (complete in GitHub UI)

Do this once so **scheduled jobs are real**, not failing every run.

1. GitHub → **your repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret | Required for | Value source |
|--------|----------------|--------------|
| **`AMPLY_PROD_URL`** | **Synthetic API latency** (`.github/workflows/synthetic-latency.yml`) **and** **Catalog freshness** (`.github/workflows/catalog-freshness.yml`) | Production origin only, e.g. `https://www.useamply.com` (no path). |
| **`AMPLY_API_KEYS`** | **Synthetic API latency** (so `POST /api/v1/route` is probed) | **Comma-separated** server secrets **or** a **single** full **`amply_sk_…`** user key (same Supabase project as production). Prefer matching **Vercel** if you use env server keys. |
| **`AMPLY_ROUTE_BEARER_TOKEN`** | Optional alternative to **`AMPLY_API_KEYS`** for Actions | Same value as local `.env` user key; if set, `scripts/synthetic-probe.mjs` prefers it over **`AMPLY_API_KEYS`**. |

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

0. **Listing disclosure column (one-time):** run `database_migration_amply_route_catalog_listing.sql` so `GET /api/v1/providers` and `/catalog` can return `catalog_listing` (`organic` vs paid tiers). New installs: `database_setup_amply_route.sql` already includes the column.

1. **On deploy (Vercel):** `vercel.json` registers **`GET /api/cron/catalog-refresh`** on a schedule. **Hobby (free) plans only allow at most once per day**; this repo uses **`0 9 * * *`** (≈09:00 UTC daily). **Pro** allows more frequent crons (e.g. every few hours). The **Observability → Cron Jobs** table may look **empty or redacted on Hobby**; that does not stop the route from working—use **`curl`** (below) to run it anytime.  
2. **Env on Vercel:** set **`CRON_SECRET`** (opaque string, e.g. `openssl rand -hex 24`). Vercel sends `Authorization: Bearer <CRON_SECRET>` when the cron runs.  
3. **`DATABASE_URL`** (or pooler URL) must already be set so the handler can upsert `amply_route_providers`.

**Manual / CI (same logic as cron):**

```bash
# Hit the deployed cron route (uses snapshot in the running build; needs CRON_SECRET)
CRON_SECRET='…' npm run catalog:refresh:remote -- https://www.useamply.com

# Or upsert from your machine (.env with DATABASE_URL) using the same JSON as the app
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