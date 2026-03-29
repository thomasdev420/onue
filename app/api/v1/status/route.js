import { NextResponse } from 'next/server';
import { AMPLY_PRODUCT_VERSION } from '@/app/lib/amplyProductVersion';
import { getAuthMode } from '@/app/lib/amplyRoute/auth';
import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';
import { benchmarkTimestampIso } from '@/app/lib/amplyRoute/benchmarkStamp';
import { loadProviders } from '@/app/lib/amplyRoute/loadProviders';
import { catalogMetricsStaleness } from '@/app/lib/amplyRoute/catalogFreshness';
import { resolveDatabaseUrl } from '@/app/lib/amplyRoute/resolveDatabaseUrl';
import { withV1TraceHeaders } from '@/app/lib/amplyRoute/v1TraceHeaders';
import { getSupabaseServiceRole } from '@/app/services/amplySelection/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const t0 = performance.now();

  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const dbUrl = resolveDatabaseUrl();
  const hasDatabaseUrl = Boolean(dbUrl);
  // Skip Supabase JS client when Postgres catalog path is available (faster cold/hot status).
  const admin = hasDatabaseUrl ? null : getSupabaseServiceRole();
  const { source, catalog_issue, catalog_error_code, catalog_backend, catalog_freshness } =
    await loadProviders(admin);
  const computeMs = performance.now() - t0;
  const computeRounded = Math.round(computeMs);

  const rateLimitPerMin = Number(process.env.AMPLY_V1_RATE_LIMIT_PER_MIN || 0);
  const staleHours = Number.parseInt(process.env.AMPLY_CATALOG_STALE_AFTER_HOURS || '24', 10) || 24;
  const staleness = catalogMetricsStaleness(catalog_freshness, staleHours);

  amplyLog({
    level: 'info',
    msg: 'v1.status',
    request_id: requestId,
    compute_ms: computeRounded,
    data_mode: source === 'supabase' ? 'catalog' : 'seeded',
    catalog_backend: catalog_backend ?? null,
    catalog_issue: catalog_issue ?? null,
    catalog_metrics_stale: staleness.catalog_metrics_stale,
  });

  return NextResponse.json(
    {
      ok: true,
      service: 'amply',
      version: AMPLY_PRODUCT_VERSION,
      last_benchmark_at: benchmarkTimestampIso(),
      data_mode: source === 'supabase' ? 'catalog' : 'seeded',
      catalog_freshness: catalog_freshness ?? null,
      auth_mode: getAuthMode(),
      rate_limit:
        Number.isFinite(rateLimitPerMin) && rateLimitPerMin > 0
          ? { enabled: true, requests_per_minute_per_ip: rateLimitPerMin }
          : { enabled: false, requests_per_minute_per_ip: null },
      openapi_url: '/api/v1/openapi',
      request_id: requestId,
      compute_ms: computeRounded,
      diagnostics: {
        has_supabase_url: hasSupabaseUrl,
        has_service_role_key: hasServiceRoleKey,
        has_database_url: hasDatabaseUrl,
        catalog_backend: catalog_backend ?? null,
        catalog_issue,
        catalog_error_code,
        catalog_metrics_age_hours: staleness.catalog_metrics_age_hours,
        catalog_metrics_stale: staleness.catalog_metrics_stale,
        catalog_metrics_stale_after_hours: staleness.catalog_metrics_stale_after_hours,
      },
    },
    { headers: withV1TraceHeaders(corsHeaders, { requestId, computeMs }) },
  );
}
