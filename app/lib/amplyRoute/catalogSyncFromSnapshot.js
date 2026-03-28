/**
 * Upsert amply_route_providers from a validated snapshot.
 * Sets metrics_as_of / updated_at to NOW() on each run.
 */
import pg from 'pg';

export { parseAndValidateCatalogSnapshot } from './catalogSnapshotSchema.js';

/**
 * @param {string} connectionString
 * @param {ReturnType<typeof parseAndValidateCatalogSnapshot>} parsed
 */
export async function syncCatalogProviders(connectionString, parsed) {
  const { version, providers } = parsed;

  const pool = new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 25_000,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  let upserted = 0;
  try {
    await client.query('BEGIN');

    const sql = `
      INSERT INTO amply_route_providers (
        id, display_name, category, is_active,
        p99_latency_ms, cost_per_1m_dims_usd,
        success_rate_last_24h, success_rate_last_7d, win_rate,
        revenue_captured_usd, missed_opportunity_usd,
        metrics_as_of, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9,
        $10, $11,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        category = EXCLUDED.category,
        is_active = EXCLUDED.is_active,
        p99_latency_ms = EXCLUDED.p99_latency_ms,
        cost_per_1m_dims_usd = EXCLUDED.cost_per_1m_dims_usd,
        success_rate_last_24h = EXCLUDED.success_rate_last_24h,
        success_rate_last_7d = EXCLUDED.success_rate_last_7d,
        win_rate = EXCLUDED.win_rate,
        revenue_captured_usd = EXCLUDED.revenue_captured_usd,
        missed_opportunity_usd = EXCLUDED.missed_opportunity_usd,
        metrics_as_of = NOW(),
        updated_at = NOW()`;

    for (const p of providers) {
      await client.query(sql, [
        p.id,
        p.display_name,
        p.category,
        p.is_active,
        p.p99_latency_ms,
        p.cost_per_1m_dims_usd,
        p.success_rate_last_24h,
        p.success_rate_last_7d,
        p.win_rate,
        p.revenue_captured_usd,
        p.missed_opportunity_usd,
      ]);
      upserted += 1;
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }

  return { upserted, snapshot_version: version };
}
