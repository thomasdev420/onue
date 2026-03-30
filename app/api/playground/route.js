import { NextResponse } from 'next/server';
import { checkPlaygroundRateLimit } from '@/app/lib/amplyRoute/rateLimitPlayground';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_TASK = 2000;

function publicOrigin() {
  const o = process.env.AMPLY_PUBLIC_ORIGIN?.trim();
  if (o) return o.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return '';
}

function serverRouteKey() {
  const a = process.env.AMPLY_PLAYGROUND_API_KEY?.trim();
  if (a) return a;
  const list = (process.env.AMPLY_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return list[0] || '';
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  const rl = checkPlaygroundRateLimit(request);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, detail: 'Too many playground requests. Try again shortly.', retry_after_sec: rl.retryAfterSec },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          ...(rl.retryAfterSec != null ? { 'Retry-After': String(rl.retryAfterSec) } : {}),
        },
      },
    );
  }

  const apiKey = serverRouteKey();
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, detail: 'Playground is not configured (server API key).' },
      { status: 503, headers: corsHeaders },
    );
  }

  const origin = publicOrigin();
  if (!origin) {
    return NextResponse.json(
      { ok: false, detail: 'AMPLY_PUBLIC_ORIGIN is not set (required for playground proxy).' },
      { status: 503, headers: corsHeaders },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, detail: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
  }

  const task = typeof body.task === 'string' ? body.task.trim() : '';
  if (!task || task.length > MAX_TASK) {
    return NextResponse.json(
      { ok: false, detail: `task required (1–${MAX_TASK} characters)` },
      { status: 400, headers: corsHeaders },
    );
  }

  const forward = {
    task,
    budget_usd: Number(body.budget_usd ?? 0.01),
    latency_target_ms: Number(body.latency_target_ms ?? 200),
  };
  if (body.dimension != null) forward.dimension = Number(body.dimension);
  if (body.workload_type != null) forward.workload_type = String(body.workload_type);
  if (body.filter_complexity != null) forward.filter_complexity = String(body.filter_complexity);

  const routeUrl = `${origin}/api/v1/route`;

  const t0 = performance.now();

  let res;
  try {
    res = await fetch(routeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(forward),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, detail: `Upstream fetch failed: ${msg.slice(0, 200)}` },
      { status: 502, headers: corsHeaders },
    );
  }

  const wallMs = Math.round(performance.now() - t0);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, detail: `Bad response from route (${res.status})`, raw: text.slice(0, 300) },
      { status: 502, headers: corsHeaders },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        ok: false,
        detail: typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`,
        upstream_status: res.status,
        ...data,
      },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      playground_wall_ms: wallMs,
      recommended: data.recommended,
      score: data.score,
      why: data.why,
      expected_p99_latency_ms: data.expected_p99_latency_ms,
      estimated_cost_usd: data.estimated_cost_usd,
      compute_ms: data.compute_ms,
      request_id: data.request_id,
    },
    { headers: corsHeaders },
  );
}
