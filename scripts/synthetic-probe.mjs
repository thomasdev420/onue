/**
 * Synthetic latency probe from your network (e.g. GitHub Actions) to production.
 * Measures wall RTT and, when present, X-Amply-Compute-Ms (server-side work).
 *
 * Usage:
 *   npm run probe:synthetic -- https://www.useamply.com
 *   AMPLY_PROBE_ITERATIONS=40 AMPLY_PROBE_WARMUP=1 npm run probe:synthetic -- https://...
 *
 * Optional:
 *   Bearer: AMPLY_ROUTE_BEARER_TOKEN / AMPLY_DEV_ROUTE_TOKEN / first AMPLY_API_KEYS (see scripts/lib/resolveAmplyBearer.mjs)
 *   AMPLY_PROBE_ITERATIONS (default 40)
 *   AMPLY_PROBE_ROUTE_MINIMAL=1 — small JSON body (lower upload / parse cost; same catalog path)
 *   AMPLY_PROBE_FAIL_COMPUTE_P95_MS — exit 1 if server compute p95 exceeds this (optional; SLO bar applies to server work)
 *   AMPLY_PROBE_FAIL_WALL_P95_MS — exit 1 if wall RTT p95 exceeds this (optional; includes your network + edge)
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
const baseRaw = fromArg || process.env.AMPLY_PROD_URL;
if (!baseRaw?.trim()) {
  console.error(
    'Usage: npm run probe:synthetic -- https://www.useamply.com\n',
    '  or set AMPLY_PROD_URL',
  );
  process.exit(1);
}

let base;
try {
  const u = new URL(baseRaw.trim());
  base = u.origin;
} catch {
  console.error('Invalid URL:', baseRaw);
  process.exit(1);
}

const routeBearer = resolveAmplyBearerFromEnv();

const iterations = Math.max(
  5,
  parseInt(process.env.AMPLY_PROBE_ITERATIONS || '40', 10) || 40,
);
const skipWarmup = process.env.AMPLY_PROBE_WARMUP === '0';
const failComputeP95 = process.env.AMPLY_PROBE_FAIL_COMPUTE_P95_MS
  ? Number(process.env.AMPLY_PROBE_FAIL_COMPUTE_P95_MS)
  : null;
const failWallP95 = process.env.AMPLY_PROBE_FAIL_WALL_P95_MS
  ? Number(process.env.AMPLY_PROBE_FAIL_WALL_P95_MS)
  : null;

function authHeaders(extra = {}) {
  const h = { ...extra };
  if (routeBearer) h.Authorization = `Bearer ${routeBearer}`;
  return h;
}

const routeBodyFull = JSON.stringify({
  task: 'store 100k 1536-dim vectors with metadata filters and similarity search',
  dimension: 1536,
  workload_type: 'hybrid',
  filter_complexity: 'high',
});

const routeBodyMinimal = JSON.stringify({
  task: 'latency_probe',
});

const routeBody =
  process.env.AMPLY_PROBE_ROUTE_MINIMAL?.trim() === '1' ? routeBodyMinimal : routeBodyFull;

/** Linear interpolation (R8), common for p95 / p99 latency reports. */
function percentile(sorted, p) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const k = (sorted.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return sorted[f];
  return sorted[f] + (sorted[c] - sorted[f]) * (k - f);
}

async function timedFetch(url, init = {}) {
  const t0 = performance.now();
  const res = await fetch(url, init);
  const wallMs = performance.now() - t0;
  const computeHdr = res.headers.get('x-amply-compute-ms');
  const reqId = res.headers.get('x-amply-request-id');
  let computeMs = computeHdr != null && computeHdr !== '' ? Number(computeHdr) : null;
  if (!Number.isFinite(computeMs)) computeMs = null;

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (computeMs == null && ct.includes('application/json')) {
    try {
      const text = await res.clone().text();
      const j = JSON.parse(text);
      if (typeof j.compute_ms === 'number' && Number.isFinite(j.compute_ms)) {
        computeMs = j.compute_ms;
      }
    } catch {
      /* ignore */
    }
  }

  return { res, wallMs, computeMs, reqId };
}

function r4(n) {
  return n != null && Number.isFinite(n) ? Math.round(n) : n;
}

function summarize(name, wallArr, computeArr) {
  const w = [...wallArr].sort((a, b) => a - b);
  const c = computeArr.filter((x) => x != null && Number.isFinite(x));
  const cs = [...c].sort((a, b) => a - b);
  const row = {
    n: w.length,
    wall_p50_ms: r4(percentile(w, 50)),
    wall_p95_ms: r4(percentile(w, 95)),
    wall_p99_ms: r4(percentile(w, 99)),
    wall_min_ms: r4(w[0]),
    wall_max_ms: r4(w[w.length - 1]),
    compute_p50_ms: cs.length ? r4(percentile(cs, 50)) : null,
    compute_p95_ms: cs.length ? r4(percentile(cs, 95)) : null,
    compute_p99_ms: cs.length ? r4(percentile(cs, 99)) : null,
  };
  console.log(`\n--- ${name} ---`);
  console.log(JSON.stringify(row, null, 2));
  return row;
}

let coldStatusWall = null;
let coldRouteWall = null;

if (!skipWarmup) {
  const s0 = await timedFetch(`${base}/api/v1/status`);
  coldStatusWall = s0.wallMs;
  if (routeBearer) {
    const r0 = await timedFetch(`${base}/api/v1/route`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: routeBody,
    });
    coldRouteWall = r0.wallMs;
    if (!r0.res.ok) {
      const body = await r0.res.text().then((t) => t.slice(0, 300));
      console.error('Warmup route failed', r0.res.status, body);
      if (r0.res.status === 401) {
        console.error(
          '\nHint: Bearer rejected. Set AMPLY_ROUTE_BEARER_TOKEN to a key production accepts, or copy Vercel Production → AMPLY_API_KEYS (first comma-separated secret) into .env.\n' +
            '  Run: node scripts/debug-amply-bearer-env.mjs\n',
        );
      }
      process.exit(1);
    }
  }
}

const statusWalls = [];
const statusCompute = [];
for (let i = 0; i < iterations; i++) {
  const { res, wallMs, computeMs } = await timedFetch(`${base}/api/v1/status`);
  if (!res.ok) {
    console.error('status failed', res.status);
    process.exit(1);
  }
  statusWalls.push(wallMs);
  if (computeMs != null) statusCompute.push(computeMs);
}

let routeWalls = [];
let routeCompute = [];
if (!routeBearer) {
  console.warn(
    '\n(no Bearer — skipping POST /api/v1/route; set AMPLY_ROUTE_BEARER_TOKEN or AMPLY_API_KEYS in .env)\n',
  );
} else {
  routeWalls = [];
  routeCompute = [];
  for (let i = 0; i < iterations; i++) {
    const { res, wallMs, computeMs } = await timedFetch(`${base}/api/v1/route`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: routeBody,
    });
    if (!res.ok) {
      console.error('route failed', res.status, await res.text().then((t) => t.slice(0, 300)));
      process.exit(1);
    }
    routeWalls.push(wallMs);
    if (computeMs != null) routeCompute.push(computeMs);
  }
}

console.log('\n=== Amply synthetic probe ===');
console.log('base:', base);
console.log('iterations (per endpoint):', iterations);
console.log('route body:', process.env.AMPLY_PROBE_ROUTE_MINIMAL?.trim() === '1' ? 'minimal' : 'full');
if (!skipWarmup) {
  console.log(
    'cold_start_hint: first request wall RTT (includes DNS/TLS/Vercel cold start if any):',
    {
      status_wall_ms: coldStatusWall != null ? Math.round(coldStatusWall) : null,
      route_wall_ms: coldRouteWall != null ? Math.round(coldRouteWall) : null,
    },
  );
}

const st = summarize('GET /api/v1/status', statusWalls, statusCompute);
let rt = null;
if (routeBearer) {
  rt = summarize('POST /api/v1/route', routeWalls, routeCompute);
}

const sloMs = 200;
if (rt?.compute_p95_ms != null) {
  console.log(
    `\n--- SLO check (~${sloMs}ms server compute on POST /route) ---\npost /api/v1/route compute_p95_ms=${rt.compute_p95_ms} → ${rt.compute_p95_ms <= sloMs ? 'within' : 'above'} ${sloMs}ms bar (same-region probe recommended; Vercel iad1 vs DB region adds RTT to wall_ms)`,
  );
}
if (st.compute_p95_ms != null) {
  console.log(
    `GET /api/v1/status compute_p95_ms=${st.compute_p95_ms} → ${st.compute_p95_ms <= sloMs ? 'within' : 'above'} ${sloMs}ms bar`,
  );
}

const machine = {
  base,
  iterations,
  cold_start_wall_ms: !skipWarmup
    ? {
        status: coldStatusWall != null ? Math.round(coldStatusWall) : null,
        route: coldRouteWall != null ? Math.round(coldRouteWall) : null,
      }
    : null,
  status: st,
  route: rt,
  probed_at: new Date().toISOString(),
  slo_reference: {
    product_bar_200ms_applies_to: 'server_compute (compute_ms / X-Amply-Compute-Ms), not necessarily wall RTT',
    wall_ms_includes:
      'DNS, TLS, client_to_edge_rtt, cold_start_jitter — GitHub Actions runners are often US-based',
    compare_across_deploys: 'compute_p95_ms',
    vercel_region_default: 'iad1 (see vercel.json); align DB pooler region where possible',
    catalog_cache:
      'Warm instances may cache PG catalog reads (AMPLY_CATALOG_CACHE_MS); compute_p95 can reflect cache hits',
    payload: process.env.AMPLY_PROBE_ROUTE_MINIMAL?.trim() === '1' ? 'minimal' : 'full',
  },
};
console.log('\n--- machine ---');
console.log(JSON.stringify(machine));

console.log(
  '\nSLO note: ~200ms bar targets server compute (compute_p95_ms when present). wall_p95_ms includes your network to Vercel; see deploy-setup.md § Amply API v1 latency.',
);

if (failComputeP95 != null && Number.isFinite(failComputeP95)) {
  const bad =
    (st.compute_p95_ms != null && st.compute_p95_ms > failComputeP95) ||
    (rt?.compute_p95_ms != null && rt.compute_p95_ms > failComputeP95);
  if (bad) {
    console.error(
      `\nFAIL: server compute p95 exceeds AMPLY_PROBE_FAIL_COMPUTE_P95_MS=${failComputeP95}`,
    );
    process.exit(1);
  }
}

if (failWallP95 != null && Number.isFinite(failWallP95)) {
  const bad =
    (st.wall_p95_ms != null && st.wall_p95_ms > failWallP95) ||
    (rt?.wall_p95_ms != null && rt.wall_p95_ms > failWallP95);
  if (bad) {
    console.error(
      `\nFAIL: wall RTT p95 exceeds AMPLY_PROBE_FAIL_WALL_P95_MS=${failWallP95} (GitHub runner region vs Vercel affects this).`,
    );
    process.exit(1);
  }
}

process.exit(0);
