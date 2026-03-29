/**
 * Read amply_route_providers via Postgres (TCP). Bypasses Supabase PostgREST HTTP on hosts
 * where fetch() to *.supabase.co fails (e.g. some serverless IPv6 paths).
 */
import { createHash } from 'node:crypto';
import pg from 'pg';
import { maxTimestampsFromRows } from './catalogFreshness.js';
import { SEEDED_PROVIDERS } from './seed.js';

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

function getPool(connectionString) {
  const g = globalThis;
  const id = createHash('sha256').update(connectionString).digest('hex').slice(0, 24);
  const key = `__amplyRoutePgPool_${id}`;
  if (!g[key]) {
    const poolMax = Math.min(
      10,
      Math.max(1, Number.parseInt(process.env.AMPLY_PG_POOL_MAX || '3', 10) || 3),
    );
    const idleMs = Number.parseInt(process.env.AMPLY_PG_IDLE_MS || '20000', 10) || 20000;
    const connTimeout = Number.parseInt(process.env.AMPLY_PG_CONN_TIMEOUT_MS || '12000', 10) || 12000;
    g[key] = new pg.Pool({
      connectionString,
      max: poolMax,
      idleTimeoutMillis: idleMs,
      connectionTimeoutMillis: connTimeout,
      ssl: { rejectUnauthorized: false },
    });
  }
  return g[key];
}

export async function loadProvidersFromDatabaseUrl(connectionString) {
  const pool = getPool(connectionString);
  const { rows } = await pool.query(
    `SELECT id, display_name, p99_latency_ms, cost_per_1m_dims_usd,
            success_rate_last_24h, success_rate_last_7d, win_rate,
            revenue_captured_usd, missed_opportunity_usd,
            metrics_as_of, updated_at
     FROM amply_route_providers
     WHERE is_active = true
     ORDER BY id`,
  );

  if (!rows?.length) {
    return {
      providers: { ...SEEDED_PROVIDERS },
      source: 'seed',
      catalog_issue: 'empty_table',
      catalog_error_code: null,
      catalog_backend: 'postgres',
      catalog_freshness: null,
    };
  }

  const catalog_freshness = maxTimestampsFromRows(rows);
  const providers = {};
  for (const row of rows) {
    providers[row.id] = rowToProvider(row);
  }
  return {
    providers,
    source: 'supabase',
    catalog_issue: null,
    catalog_error_code: null,
    catalog_backend: 'postgres',
    catalog_freshness,
  };
}
