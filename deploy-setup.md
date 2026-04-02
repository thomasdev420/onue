# Vercel Deployment Setup

## Production API hardening (routing)

After deploy, **`POST /api/v1/route`** behaves as follows:

- **Production (default):** Bearer auth is **required** unless **`AMPLY_ALLOW_ANONYMOUS_ROUTE=1`** (use only for private preview; not for public production).
- **Keys:** Set **`AMPLY_API_KEYS`** (comma-separated server keys) and/or Supabase **`NEXT_PUBLIC_SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** so **dashboard user keys** (`amply_api_keys`) work.
- **Rate limit:** **`AMPLY_V1_RATE_LIMIT_PER_MIN`** defaults to **120** per client IP in production when unset. Set **`AMPLY_V1_RATE_LIMIT_PER_MIN=0`** to turn off (not recommended on the public internet).

**`GET /api/v1/status`** includes **`diagnostics.route_auth_production_strict`**, **`allow_anonymous_route_env`**, and **`user_api_keys_store_ready`** for quick checks.

Dashboard and **`/api/user/*`** (except dev) require a **NextAuth** session via **`middleware.js`** when **`NEXTAUTH_SECRET`** is set.

---

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

### Optional — provider listings (one Stripe Payment Link)
Create **one Payment link** in [Stripe Dashboard](https://dashboard.stripe.com) → copy the `https://buy.stripe.com/...` URL. In Vercel → **Environment Variables** (Production + Preview if needed):

```
NEXT_PUBLIC_STRIPE_LISTING_URL=https://buy.stripe.com/...
```

(Optional legacy: **`NEXT_PUBLIC_STRIPE_LISTING_BASIC_URL`** is still read if **`NEXT_PUBLIC_STRIPE_LISTING_URL`** is empty.)

Redeploy after saving — **`NEXT_PUBLIC_*`** is baked in at build time. **`/providers`** (and homepage **`/#pricing`**) link to checkout when the URL is set. Legacy **`/providers/join`** redirects to **`/providers`**. **`/pricing`** redirects to **`/#pricing`**.

### Optional — Stripe webhook (listing notifications)

In Stripe → **Developers** → **Webhooks** → add endpoint:

`https://<useamply.com>/api/webhooks/stripe-listing`

Subscribe to at least **`checkout.session.completed`** and **`invoice.paid`** (subscriptions). Copy the **Signing secret** (`whsec_…`).

Vercel env (server only, never `NEXT_PUBLIC_`):

```
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_live_...   # or sk_test_…; used by the Stripe SDK for signature verification setup
```

Optional email ping via [Resend](https://resend.com) (same envelope as other transactional mail):

```
RESEND_API_KEY=re_...
RESEND_FROM=Amply <listings@your-domain.com>
LISTING_NOTIFY_EMAIL=you@your-company.com
```

Without Resend, events still appear as structured **`stripe_listing_webhook`** lines in Vercel logs. Fulfillment checklist: **`docs/operations/PROVIDER_LISTING_FULFILLMENT.md`**.

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

**Compute region:** This repo sets **`"regions": ["iad1"]`** in **`vercel.json`** (US East) for more **stable** latency from US probes and shorter cold paths vs. bouncing regions. **EU-heavy users** may see higher RTT; switch to **`"lhr1"`** or remove **`regions`** if that fits your audience better. **`GET /api/v1/status`** includes **`diagnostics.amply_catalog_cache_ms`** (effective in-process catalog TTL from **`AMPLY_CATALOG_CACHE_MS`**, clamped 0–120000) so you can confirm cache tuning in production without reading server logs.

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

**CI actions:** Workflows use **`actions/checkout@v5`** and **`actions/setup-node@v5`** (action runtime on Node 24 per upstream; your app still runs **`npm ci` / `node-version: '20'`** to match `package.json` engines).

### Git — large binary slipped into history (e.g. `node-installer.pkg`)

`node-installer.pkg` is **gitignored** so it is not re-added. If GitHub still warns on push, the blob remains in **old commits**. Removing it **rewrites history** — everyone must **`git fetch --all`** / reclone; you must **`git push --force`** every remote that had the old history (coordinate if both **`onue`** and **`amply`** share that history).

Optional fix (after `brew install git-filter-repo` or pip install):

```bash
git filter-repo --path node-installer.pkg --invert-paths
git push --force amply main   # example: only if you intend to rewrite that remote
```

Only do this when you understand force-push impact.

---

## Catalog automation (ETL) — keep `metrics_as_of` live

**Source of truth:** `data/amply_route_catalog.json` (versioned metrics + IDs). The in-memory fallback seed and routing engine read the same shapes.

### Apply to production Postgres

0. **Listing disclosure column (one-time):** run `database_migration_amply_route_catalog_listing.sql` so `GET /api/v1/providers` and `/catalog` can return `catalog_listing` (`organic` vs paid tiers). New installs: `database_setup_amply_route.sql` already includes the column.

0b. **Routing telemetry (one-time, provider transparency):** run **`database_migration_amply_route_decisions.sql`** in the same Postgres / Supabase project. This creates **`amply_route_decisions`** (one row per successful **`POST /api/v1/route`**) and the **`amply_route_platform_metrics()`** helper used by **`GET /api/v1/platform-metrics`**, **`/providers`** (impact section), and **`/dashboard/listing-impact`**. Optional request body field **`referral_tag`** is stored for future attribution reports.

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

**Alert when prod is stale:** GitHub Actions workflow **`catalog-freshness.yml`** (schedule + `workflow_dispatch`) runs **`npm run check:catalog-fresh`** against **`AMPLY_PROD_URL`**. Add that repository secret; a red run means **`catalog_metrics_stale`** is still true (fix cron, run `catalog:sync`, or ship new JSON). The workflow sets **`AMPLY_CATALOG_AGE_WARN_HOURS=12`**: if **`catalog_metrics_age_hours`** is above that but not yet “stale,” the job prints a **warning** (still green) so you can tighten sync before SLAs bite.

**Synthetic latency CI:** **`synthetic-latency.yml`** uses **`AMPLY_PROBE_ROUTE_MINIMAL=1`** (smaller POST body for stable **`compute_p95_ms`**), uploads **`probe-log.txt`** as a workflow artifact, and runs from a **GitHub-hosted US runner** (compare **`compute_p95_ms`** across deploys; wall RTT still includes runner↔edge distance).

**Strict deploy verify (optional):** `AMPLY_VERIFY_FAIL_ON_STALE=1 npm run verify:deploy -- https://…` fails if stale.

**Platform metrics route:** `npm run verify:deploy -- https://…` also **GETs `/api/v1/platform-metrics`** and fails if the response is not **HTTP 200** with JSON (`ok`, `decisions_last_30d`, `request_id`). If you see **404**, Production is not running a build that includes `app/api/v1/platform-metrics/route.js` — **redeploy** from the linked Git branch. If JSON loads but `error_code` hints at a missing DB function, run **`database_migration_amply_route_decisions.sql`** in Supabase. Optional: `AMPLY_VERIFY_FAIL_ON_TELEMETRY=1` treats telemetry migration errors as a hard failure.

**Latency / SLO:** A single **`GET /api/v1/status`** `compute_ms` can spike (cold start, cache); do **not** use it alone as proof of the ~200ms server bar. Use **`npm run probe:synthetic:p95`** (or CI) and compare **`compute_p95`** on **`POST /api/v1/route`** to the product goal; wall RTT includes your network to Vercel.

### Editing metrics honestly

1. Update numbers in **`data/amply_route_catalog.json`** (and bump **`version`** if you track releases).  
2. Commit, deploy, and either wait for cron or run **`npm run catalog:sync`** against production DB.  
3. Replace the snapshot with **real pipeline output** when you have automated ingestion; keep calling **`syncCatalogProviders`** (or the SQL you generate) so **`metrics_as_of`** advances.

### Legacy one-off (timestamps only, same numbers)

`scripts/sql/refresh-catalog-metrics-as-of.sql` — Supabase SQL editor; use only when you intentionally keep row values but need to clear staleness after review.

### Status fields

**`GET /api/v1/status`** includes **`diagnostics.catalog_metrics_age_hours`**, **`catalog_metrics_stale`** (vs **`AMPLY_CATALOG_STALE_AFTER_HOURS`**, default **24**), and **`catalog_metrics_stale_after_hours`**.