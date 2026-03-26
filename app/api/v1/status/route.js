import { NextResponse } from 'next/server';
import { getAuthMode } from '@/app/lib/amplyRoute/auth';
import { benchmarkTimestampIso } from '@/app/lib/amplyRoute/benchmarkStamp';
import { loadProviders } from '@/app/lib/amplyRoute/loadProviders';
import { resolveDatabaseUrl } from '@/app/lib/amplyRoute/resolveDatabaseUrl';
import { getSupabaseServiceRole } from '@/app/services/amplySelection/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const hasDatabaseUrl = Boolean(resolveDatabaseUrl());
  const admin = getSupabaseServiceRole();
  const { source, catalog_issue, catalog_error_code, catalog_backend, catalog_freshness } =
    await loadProviders(admin);
  const rateLimitPerMin = Number(process.env.AMPLY_V1_RATE_LIMIT_PER_MIN || 0);
  return NextResponse.json(
    {
      ok: true,
      service: 'amply',
      version: '1.0.5-mvp',
      last_benchmark_at: benchmarkTimestampIso(),
      data_mode: source === 'supabase' ? 'catalog' : 'seeded',
      catalog_freshness: catalog_freshness ?? null,
      auth_mode: getAuthMode(),
      rate_limit: Number.isFinite(rateLimitPerMin) && rateLimitPerMin > 0
        ? { enabled: true, requests_per_minute_per_ip: rateLimitPerMin }
        : { enabled: false, requests_per_minute_per_ip: null },
      openapi_url: '/api/v1/openapi',
      diagnostics: {
        has_supabase_url: hasSupabaseUrl,
        has_service_role_key: hasServiceRoleKey,
        has_database_url: hasDatabaseUrl,
        catalog_backend: catalog_backend ?? null,
        catalog_issue,
        catalog_error_code,
      },
    },
    { headers: corsHeaders },
  );
}
