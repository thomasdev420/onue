/**
 * Production / preview check: GET /api/v1/status + GET /api/v1/platform-metrics + POST /api/v1/route.
 *
 * Usage:
 *   npm run verify:deploy -- https://your-app.vercel.app
 *   AMPLY_PROD_URL=https://your-app.vercel.app npm run verify:deploy
 *
 * If AMPLY_API_KEYS is set in .env, sends Bearer (first key) on POST.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveAmplyBearerFromEnv } from './lib/resolveAmplyBearer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath =
  process.env.DOTENV_CONFIG_PATH?.trim() || path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const fromArg = process.argv[2];
const fromEnv = process.env.AMPLY_PROD_URL;
const baseRaw = fromArg || fromEnv;

if (!baseRaw?.trim()) {
  console.error(
    'Missing deployment URL.\n',
    '  npm run verify:deploy -- https://your-app.vercel.app\n',
    '  or: AMPLY_PROD_URL=https://... npm run verify:deploy',
  );
  process.exit(1);
}

let base;
try {
  const u = new URL(baseRaw.trim());
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('bad protocol');
  base = `${u.origin}`;
} catch {
  console.error('Invalid URL:', baseRaw);
  process.exit(1);
}

if (base.startsWith('http://') && !base.includes('localhost')) {
  console.error('Use https:// for production (got http).');
  process.exit(1);
}

const routeBearer = resolveAmplyBearerFromEnv();

function authHeaders(extra = {}) {
  const h = { ...extra };
  if (routeBearer) h.Authorization = `Bearer ${routeBearer}`;
  return h;
}

// --- GET /api/v1/status ---
const statusUrl = `${base}/api/v1/status`;
let statusRes;
try {
  statusRes = await fetch(statusUrl);
} catch (e) {
  console.error(`GET ${statusUrl} failed:`, e.cause?.code || e.message);
  process.exit(1);
}
const statusText = await statusRes.text();
let statusJson;
try {
  statusJson = JSON.parse(statusText);
} catch {
  console.error('Status response is not JSON. First 500 chars:\n', statusText.slice(0, 500));
  if (/DEPLOYMENT_NOT_FOUND|could not be found on Vercel/i.test(statusText)) {
    console.error(
      '\nThis usually means the URL is wrong or the project was never deployed.',
      '\nUse your real host from Vercel → Deployments (e.g. https://your-project.vercel.app),',
      '\nnot the placeholder YOUR_ACTUAL_DOMAIN.',
    );
  }
  process.exit(1);
}

console.log('GET /api/v1/status\n', JSON.stringify(statusJson, null, 2));

if (!statusRes.ok) {
  console.error(`\nHTTP ${statusRes.status} on status`);
  process.exit(1);
}

const reqIdHdr = statusRes.headers.get('x-amply-request-id');
const computeHdr = statusRes.headers.get('x-amply-compute-ms');
if (
  typeof statusJson.request_id !== 'string' ||
  !/^[0-9a-f-]{36}$/i.test(statusJson.request_id)
) {
  console.error('\nFAIL: GET /api/v1/status JSON missing valid request_id (deploy API tracing).');
  process.exit(1);
}
if (typeof statusJson.compute_ms !== 'number' || !Number.isFinite(statusJson.compute_ms)) {
  console.error('\nFAIL: GET /api/v1/status JSON missing compute_ms (deploy API tracing).');
  process.exit(1);
}
if (!reqIdHdr || reqIdHdr !== statusJson.request_id) {
  console.error(
    '\nFAIL: X-Amply-Request-Id header missing or does not match JSON request_id.',
    '\n  header:',
    reqIdHdr,
    '\n  json:',
    statusJson.request_id,
  );
  process.exit(1);
}
if (computeHdr == null || String(Math.round(Number(computeHdr))) !== String(statusJson.compute_ms)) {
  console.error(
    '\nFAIL: X-Amply-Compute-Ms header missing or does not match JSON compute_ms.',
    '\n  header:',
    computeHdr,
    '\n  json:',
    statusJson.compute_ms,
  );
  process.exit(1);
}

if (statusJson.data_mode !== 'catalog') {
  const d = statusJson.diagnostics;
  console.error(
    `\nFAIL: data_mode is "${statusJson.data_mode}", expected "catalog".`,
    '\nSee diagnostics above (has_supabase_url / has_service_role_key / catalog_issue).',
  );
  if (d?.catalog_issue === 'no_admin_client') {
    if (!d.has_database_url && !d.has_service_role_key) {
      console.error(
        '\n→ Set DATABASE_URL (Postgres URI, recommended on Vercel) or SUPABASE_SERVICE_ROLE_KEY for REST.',
      );
    } else if (!d.has_service_role_key) {
      console.error(
        '\n→ Production is missing SUPABASE_SERVICE_ROLE_KEY (or it is empty).',
        '\n  Vercel → Settings → Environment Variables → Production → add it, no space after =, redeploy.',
      );
    } else if (!d.has_supabase_url) {
      console.error('\n→ Production is missing NEXT_PUBLIC_SUPABASE_URL.');
    } else {
      console.error('\n→ Both env vars set but admin client null — check for typos in variable names.');
    }
  } else if (d?.catalog_issue === 'query_failed') {
    console.error('→ Catalog query failed:', d.catalog_error_code || 'unknown');
    console.error(
      '  If using REST: wrong key or table missing. Prefer DATABASE_URL (Postgres) on Vercel — see .env.example.',
    );
  } else if (d?.catalog_issue === 'empty_table') {
    console.error('→ Table amply_route_providers has no active rows in this Supabase project.');
  }
  process.exit(1);
}

if (statusJson.diagnostics?.catalog_metrics_stale) {
  console.error(
    '\nWARN: catalog metrics are stale vs AMPLY_CATALOG_STALE_AFTER_HOURS (see diagnostics.catalog_metrics_*). Refresh: deploy-setup.md § Catalog automation (ETL).',
  );
  if (process.env.AMPLY_VERIFY_FAIL_ON_STALE === '1') {
    console.error('\nFAIL: AMPLY_VERIFY_FAIL_ON_STALE=1 (treat stale catalog as deploy error).');
    process.exit(1);
  }
}

// --- GET /api/v1/platform-metrics (public JSON; must not 404 on production) ---
const pmUrl = `${base}/api/v1/platform-metrics`;
let pmRes;
try {
  pmRes = await fetch(pmUrl);
} catch (e) {
  console.error(`GET ${pmUrl} failed:`, e.cause?.code || e.message);
  process.exit(1);
}
const pmText = await pmRes.text();
let pmJson;
try {
  pmJson = JSON.parse(pmText);
} catch {
  console.error(
    `GET /api/v1/platform-metrics returned non-JSON (HTTP ${pmRes.status}). First 500 chars:\n`,
    pmText.slice(0, 500),
  );
  if (pmRes.status === 404) {
    console.error(
      '\n→ HTTP 404: this route is missing from the deployment.',
      '\n  Fix: Vercel → Project → confirm Production is built from `main` with `app/api/v1/platform-metrics/route.js`, then Redeploy.',
    );
  }
  process.exit(1);
}

console.log('\nGET /api/v1/platform-metrics\n', JSON.stringify(pmJson, null, 2));

if (!pmRes.ok) {
  console.error(`\nFAIL: HTTP ${pmRes.status} on platform-metrics`);
  if (pmRes.status === 404) {
    console.error(
      '→ Redeploy Production from latest Git (see app/api/v1/platform-metrics/route.js).',
    );
  }
  process.exit(1);
}

if (pmJson.ok !== true) {
  console.error('\nFAIL: GET /api/v1/platform-metrics JSON ok !== true');
  process.exit(1);
}
if (typeof pmJson.decisions_last_30d !== 'number' || !Number.isFinite(pmJson.decisions_last_30d)) {
  console.error('\nFAIL: platform-metrics missing numeric decisions_last_30d');
  process.exit(1);
}
if (typeof pmJson.request_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(pmJson.request_id)) {
  console.error('\nFAIL: platform-metrics missing valid request_id');
  process.exit(1);
}

if (pmJson.error_code === 'telemetry_migration_pending' || pmJson.error_code === 'rpc_failed') {
  console.error(
    '\nWARN: platform-metrics DB function/table may be missing — run database_migration_amply_route_decisions.sql in Supabase (see deploy-setup.md § Routing telemetry). Counts may be zero until migration + traffic.',
  );
  if (process.env.AMPLY_VERIFY_FAIL_ON_TELEMETRY === '1') {
    console.error('\nFAIL: AMPLY_VERIFY_FAIL_ON_TELEMETRY=1');
    process.exit(1);
  }
}

// --- POST /api/v1/route ---
const routeUrl = `${base}/api/v1/route`;
const body = {
  task: 'store 100k 1536-dim vectors with metadata filters and similarity search',
  dimension: 1536,
  workload_type: 'hybrid',
  filter_complexity: 'high',
};

let routeRes;
try {
  routeRes = await fetch(routeUrl, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
} catch (e) {
  console.error(`POST ${routeUrl} failed:`, e.cause?.code || e.message);
  process.exit(1);
}

const routeText = await routeRes.text();
let routeJson;
try {
  routeJson = JSON.parse(routeText);
} catch {
  console.error('Route non-JSON:', routeText.slice(0, 400));
  process.exit(1);
}

console.log('\nPOST /api/v1/route\n', JSON.stringify(routeJson, null, 2));

if (!routeRes.ok) {
  console.error(`\nHTTP ${routeRes.status} on route`);
  if (routeJson.detail) console.error('Detail:', routeJson.detail);
  if (routeRes.status === 401) {
    if (!routeBearer) {
      console.error(
        'Hint: no Bearer in env. Set AMPLY_API_KEYS (first key is used), or AMPLY_ROUTE_BEARER_TOKEN / AMPLY_DEV_ROUTE_TOKEN (must match a Production key or dashboard user key).',
      );
    } else {
      console.error(
        'Hint: Bearer was sent but rejected. Local token must match Vercel Production → AMPLY_API_KEYS (comma-separated) or a valid amply_api_keys row.',
        '\n  Fix: copy Production AMPLY_API_KEYS into .env, or set AMPLY_ROUTE_BEARER_TOKEN to the exact key string (no extra quotes/spaces).',
      );
    }
  }
  process.exit(1);
}

const src = routeJson.raw_metrics?.catalog_source;
if (src !== 'supabase') {
  console.error(`\nFAIL: raw_metrics.catalog_source is "${src}", expected "supabase".`);
  process.exit(1);
}

console.error('\nOK: production checks passed (status + platform-metrics + catalog + route from Supabase).');
process.exit(0);
