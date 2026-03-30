import { NextResponse } from 'next/server';
import { verifyRouteAccess } from '@/app/lib/amplyRoute/auth';
import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';
import { checkV1RouteRateLimit } from '@/app/lib/amplyRoute/rateLimitV1Route';
import {
  buildWhy,
  estimateDimUnits,
  estimatedCostUsd,
  scoreProviders,
  taskWeights,
} from '@/app/lib/amplyRoute/engine';
import { loadProviders } from '@/app/lib/amplyRoute/loadProviders';
import { resolveDatabaseUrl } from '@/app/lib/amplyRoute/resolveDatabaseUrl';
import { withV1TraceHeaders } from '@/app/lib/amplyRoute/v1TraceHeaders';
import { getSupabaseServiceRole } from '@/app/services/amplySelection/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
};

const FILTER = new Set(['low', 'medium', 'high']);
const WORKLOAD = new Set(['insert_heavy', 'query_heavy', 'hybrid']);

function traceHeaders(requestId, t0) {
  return withV1TraceHeaders(corsHeaders, {
    requestId,
    computeMs: performance.now() - t0,
  });
}

function badRequest(message, requestId, t0) {
  return NextResponse.json(
    { detail: message, request_id: requestId },
    { status: 400, headers: traceHeaders(requestId, t0) },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  const requestId = crypto.randomUUID();
  const t0 = performance.now();

  const rl = checkV1RouteRateLimit(request);
  if (!rl.ok) {
    amplyLog({
      level: 'warn',
      msg: 'v1.route.rate_limited',
      request_id: requestId,
      compute_ms: Math.round(performance.now() - t0),
    });
    return NextResponse.json(
      { detail: 'Too many requests', retry_after_sec: rl.retryAfterSec, request_id: requestId },
      {
        status: 429,
        headers: {
          ...traceHeaders(requestId, t0),
          ...(rl.retryAfterSec != null ? { 'Retry-After': String(rl.retryAfterSec) } : {}),
        },
      },
    );
  }

  const auth = await verifyRouteAccess(request);
  if (!auth.ok) {
    amplyLog({
      level: 'warn',
      msg: 'v1.route.unauthorized',
      request_id: requestId,
      compute_ms: Math.round(performance.now() - t0),
    });
    return NextResponse.json(
      { detail: auth.error, request_id: requestId },
      { status: 401, headers: traceHeaders(requestId, t0) },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: 'Invalid JSON body', request_id: requestId },
      { status: 400, headers: traceHeaders(requestId, t0) },
    );
  }

  const task = typeof body.task === 'string' ? body.task.trim() : '';
  if (!task || task.length > 8000) {
    return badRequest('task is required (1 to 8000 characters)', requestId, t0);
  }

  const budgetUsd = Number(body.budget_usd ?? 0.01);
  if (Number.isNaN(budgetUsd) || budgetUsd < 0) {
    return badRequest('budget_usd must be a number >= 0', requestId, t0);
  }

  const latencyTargetMs = Number(body.latency_target_ms ?? 200);
  if (Number.isNaN(latencyTargetMs) || latencyTargetMs < 0) {
    return badRequest('latency_target_ms must be a number >= 0', requestId, t0);
  }

  let dimension = body.dimension;
  if (dimension != null) {
    dimension = Number(dimension);
    if (!Number.isInteger(dimension) || dimension < 1 || dimension > 65536) {
      return badRequest('dimension must be an integer 1 to 65536 when provided', requestId, t0);
    }
  }

  let filterComplexity = body.filter_complexity;
  if (filterComplexity != null) {
    filterComplexity = String(filterComplexity).toLowerCase();
    if (!FILTER.has(filterComplexity)) {
      return badRequest('filter_complexity must be low, medium, or high', requestId, t0);
    }
  }

  let workloadType = body.workload_type;
  if (workloadType != null) {
    workloadType = String(workloadType).toLowerCase();
    if (!WORKLOAD.has(workloadType)) {
      return badRequest('workload_type must be insert_heavy, query_heavy, or hybrid', requestId, t0);
    }
  }

  const hasDb = Boolean(resolveDatabaseUrl());
  const admin = hasDb ? null : getSupabaseServiceRole();
  const { providers, source, catalog_backend, catalog_freshness } = await loadProviders(admin);

  const { winner, composite, components } = scoreProviders(providers, {
    budgetUsd,
    latencyTargetMs,
    workloadType,
    filterComplexity,
  });

  const ranked = Object.entries(composite).sort((a, b) => b[1] - a[1]);
  const runnerUp = ranked.length > 1 ? ranked[1][0] : null;

  const dimUnits = estimateDimUnits(task, dimension, workloadType);
  const { costUsd, basis } = estimatedCostUsd(providers, winner, dimUnits);
  const wrow = providers[winner];
  const why = buildWhy(providers, winner, runnerUp, dimension, workloadType);

  const allProviders = {};
  for (const pid of Object.keys(providers)) {
    const row = providers[pid];
    allProviders[pid] = {
      composite_score: Math.round(composite[pid] * 1e4) / 1e4,
      components: Object.fromEntries(
        Object.entries(components[pid]).map(([k, v]) => [k, Math.round(v * 1e4) / 1e4]),
      ),
      p99_latency_ms: row.p99_latency_ms,
      cost_per_1m_dims_usd: row.cost_per_1m_dims_usd,
      success_rate_last_24h: row.success_rate_last_24h,
      success_rate_last_7d: row.success_rate_last_7d,
      win_rate: row.win_rate,
      revenue_captured_usd: row.revenue_captured_usd,
      missed_opportunity_usd: row.missed_opportunity_usd,
    };
  }

  const rawMetrics = {
    all_providers: allProviders,
    weights: taskWeights(workloadType, filterComplexity),
    dim_units_estimate: Math.round(dimUnits * 100) / 100,
    cost_quote_dim_units: basis,
    budget_usd: budgetUsd,
    latency_target_ms: latencyTargetMs,
    catalog_source: source,
    catalog_backend: catalog_backend ?? null,
    catalog_freshness: catalog_freshness ?? null,
  };

  const computeMs = performance.now() - t0;
  const computeRounded = Math.round(computeMs);

  const payload = {
    recommended: winner,
    score: Math.round(composite[winner] * 1e4) / 1e4,
    estimated_cost_usd: costUsd,
    expected_p99_latency_ms: Math.trunc(wrow.p99_latency_ms),
    success_rate_last_24h: Number(wrow.success_rate_last_24h),
    success_rate_last_7d: Number(wrow.success_rate_last_7d),
    why,
    raw_metrics: rawMetrics,
    request_id: requestId,
    compute_ms: computeRounded,
  };

  amplyLog({
    level: 'info',
    msg: 'v1.route.ok',
    request_id: requestId,
    compute_ms: computeRounded,
    catalog_backend: catalog_backend ?? null,
    catalog_source: source,
    recommended: winner,
  });

  return NextResponse.json(payload, {
    headers: withV1TraceHeaders(corsHeaders, { requestId, computeMs }),
  });
}
