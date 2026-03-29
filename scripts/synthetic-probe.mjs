/**
 * Synthetic latency probe from your network (e.g. GitHub Actions) to production.
 * Measures wall RTT and, when present, X-Amply-Compute-Ms (server-side work).
 *
 * Usage:
 *   npm run probe:synthetic -- https://www.useamply.com
 *   AMPLY_PROBE_ITERATIONS=40 AMPLY_PROBE_WARMUP=1 npm run probe:synthetic -- https://...
 *
 * Optional:
 *   AMPLY_API_KEYS — Bearer for POST /api/v1/route (comma-separated; first key used)
 *   AMPLY_PROBE_ITERATIONS (default 30)
 *   AMPLY_PROBE_FAIL_COMPUTE_P95_MS — exit 1 if server compute p95 exceeds this (optional)
 *   AMPLY_PROBE_FAIL_WALL_P95_MS — exit 1 if wall RTT p95 exceeds this on status or route (optional)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

const keys = (process.env.AMPLY_API_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const iterations = Math.max(
  5,
  parseInt(process.env.AMPLY_PROBE_ITERATIONS || '30', 10) || 30,
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
  if (keys.length) h.Authorization = `Bearer ${keys[0]}`;
  return h;
}

const routeBody = JSON.stringify({
  task: 'store 100k 1536-dim vectors with metadata filters and similarity search',
  dimension: 1536,
  workload_type: 'hybrid',
  filter_complexity: 'high',
});

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function timedFetch(url, init = {}) {
  const t0 = performance.now();
  const res = await fetch(url, init);
  const wallMs = performance.now() - t0;
  const computeHdr = res.headers.get('x-amply-compute-ms');
  const reqId = res.headers.get('x-amply-request-id');
  const computeMs = computeHdr != null && computeHdr !== '' ? Number(computeHdr) : null;
  return { res, wallMs, computeMs: Number.isFinite(computeMs) ? computeMs : null, reqId };
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
  if (keys.length) {
    const r0 = await timedFetch(`${base}/api/v1/route`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: routeBody,
    });
    coldRouteWall = r0.wallMs;
    if (!r0.res.ok) {
      console.error('Warmup route failed', r0.res.status, await r0.res.text().then((t) => t.slice(0, 200)));
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
if (!keys.length) {
  console.warn('\n(no AMPLY_API_KEYS — skipping POST /api/v1/route probe; set key for full stats)\n');
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
if (keys.length) {
  rt = summarize('POST /api/v1/route', routeWalls, routeCompute);
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
