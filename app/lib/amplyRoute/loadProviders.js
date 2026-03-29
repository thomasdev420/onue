import { maxTimestampsFromRows } from './catalogFreshness.js';
import { SEEDED_PROVIDERS } from './seed.js';
import { loadProvidersFromDatabaseUrl } from './loadCatalogPg.js';
import { resolveDatabaseUrl } from './resolveDatabaseUrl.js';

const CACHE_MS_RAW = parseInt(process.env.AMPLY_CATALOG_CACHE_MS ?? '20000', 10);
const PG_CACHE_MS = Number.isFinite(CACHE_MS_RAW)
  ? Math.max(0, Math.min(CACHE_MS_RAW, 120_000))
  : 20_000;

/** In-process cache: cuts repeated PG round-trips on warm serverless (reduces wall RTT tail). */
async function loadProvidersFromDatabaseUrlCached(dbUrl) {
  if (PG_CACHE_MS <= 0) {
    return loadProvidersFromDatabaseUrl(dbUrl);
  }
  const g = globalThis;
  const slot = g.__amplyProvidersPgCache;
  const now = Date.now();
  if (slot && slot.url === dbUrl && now - slot.t < PG_CACHE_MS) {
    return slot.val;
  }
  const val = await loadProvidersFromDatabaseUrl(dbUrl);
  g.__amplyProvidersPgCache = { url: dbUrl, t: now, val };
  return val;
}

function rowToProvider(row) {
  return {
    display_name: row.display_name,
    win_rate: Number(row.win_rate),
    p99_latency_ms: Number(row.p99_latency_ms),
    cost_per_1m_dims_usd: Number(row.cost_per_1m_dims_usd),
    success_rate_last_24h: Number(row.success_rate_last_24h),
    success_rate_last_7d: Number(row.success_rate_last_7d),
    revenue_captured_usd:
      row.revenue_captured_usd != null ? Number(row.revenue_captured_usd) : null,
    missed_opportunity_usd:
      row.missed_opportunity_usd != null ? Number(row.missed_opportunity_usd) : null,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} admin
 */
export async function loadProviders(admin) {
  const dbUrl = resolveDatabaseUrl();
  if (dbUrl) {
    try {
      return await loadProvidersFromDatabaseUrlCached(dbUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        providers: { ...SEEDED_PROVIDERS },
        source: 'seed',
        catalog_issue: 'query_failed',
        catalog_error_code: `pg:${msg.slice(0, 100)}`,
        catalog_backend: 'postgres',
        catalog_freshness: null,
      };
    }
  }

  if (!admin) {
    return {
      providers: { ...SEEDED_PROVIDERS },
      source: 'seed',
      catalog_issue: 'no_admin_client',
      catalog_error_code: null,
      catalog_backend: 'none',
      catalog_freshness: null,
    };
  }

  const { data, error } = await admin
    .from('amply_route_providers')
    .select(
      'id, display_name, p99_latency_ms, cost_per_1m_dims_usd, success_rate_last_24h, success_rate_last_7d, win_rate, revenue_captured_usd, missed_opportunity_usd, metrics_as_of, updated_at',
    )
    .eq('is_active', true)
    .order('id');

  if (error) {
    return {
      providers: { ...SEEDED_PROVIDERS },
      source: 'seed',
      catalog_issue: 'query_failed',
      catalog_error_code: error.code || String(error.message || 'unknown').slice(0, 80),
      catalog_backend: 'rest',
      catalog_freshness: null,
    };
  }

  if (!data?.length) {
    return {
      providers: { ...SEEDED_PROVIDERS },
      source: 'seed',
      catalog_issue: 'empty_table',
      catalog_error_code: null,
      catalog_backend: 'rest',
      catalog_freshness: null,
    };
  }

  const catalog_freshness = maxTimestampsFromRows(data);
  const providers = {};
  for (const row of data) {
    providers[row.id] = rowToProvider(row);
  }
  return {
    providers,
    source: 'supabase',
    catalog_issue: null,
    catalog_error_code: null,
    catalog_backend: 'rest',
    catalog_freshness,
  };
}
