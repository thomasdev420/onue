import { SEEDED_PROVIDERS } from './seed.js';
import { loadProvidersFromDatabaseUrl } from './loadCatalogPg.js';

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
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl) {
    try {
      return await loadProvidersFromDatabaseUrl(dbUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        providers: { ...SEEDED_PROVIDERS },
        source: 'seed',
        catalog_issue: 'query_failed',
        catalog_error_code: `pg:${msg.slice(0, 100)}`,
        catalog_backend: 'postgres',
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
    };
  }

  const { data, error } = await admin
    .from('amply_route_providers')
    .select(
      'id, display_name, p99_latency_ms, cost_per_1m_dims_usd, success_rate_last_24h, success_rate_last_7d, win_rate, revenue_captured_usd, missed_opportunity_usd',
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
    };
  }

  if (!data?.length) {
    return {
      providers: { ...SEEDED_PROVIDERS },
      source: 'seed',
      catalog_issue: 'empty_table',
      catalog_error_code: null,
      catalog_backend: 'rest',
    };
  }

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
  };
}
