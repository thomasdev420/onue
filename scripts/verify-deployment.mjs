/**
 * Production / preview check: GET /api/v1/status + POST /api/v1/route.
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

const keys = (process.env.AMPLY_API_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

function authHeaders(extra = {}) {
  const h = { ...extra };
  if (keys.length) h.Authorization = `Bearer ${keys[0]}`;
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

if (statusJson.data_mode !== 'catalog') {
  const d = statusJson.diagnostics;
  console.error(
    `\nFAIL: data_mode is "${statusJson.data_mode}", expected "catalog".`,
    '\nSee diagnostics above (has_supabase_url / has_service_role_key / catalog_issue).',
  );
  if (d?.catalog_issue === 'no_admin_client') {
    if (!d.has_service_role_key) {
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
    console.error('→ Supabase query failed:', d.catalog_error_code || 'unknown');
    console.error('  Wrong key for this project, or table missing (run database_setup_amply_route.sql).');
  } else if (d?.catalog_issue === 'empty_table') {
    console.error('→ Table amply_route_providers has no active rows in this Supabase project.');
  }
  process.exit(1);
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
  if (keys.length === 0 && routeRes.status === 401) {
    console.error('Hint: set AMPLY_API_KEYS on Vercel and add the same key to local .env for this script.');
  }
  process.exit(1);
}

const src = routeJson.raw_metrics?.catalog_source;
if (src !== 'supabase') {
  console.error(`\nFAIL: raw_metrics.catalog_source is "${src}", expected "supabase".`);
  process.exit(1);
}

console.error('\nOK: production checks passed (catalog + route from Supabase).');
process.exit(0);
