/**
 * Validates repo/catalog JSON for amply_route_providers (no DB imports).
 */

/**
 * @param {unknown} raw
 * @returns {{
 *   version: number,
 *   providers: Array<{
 *     id: string,
 *     display_name: string,
 *     category: string,
 *     is_active: boolean,
 *     p99_latency_ms: number,
 *     cost_per_1m_dims_usd: number,
 *     success_rate_last_24h: number,
 *     success_rate_last_7d: number,
 *     win_rate: number,
 *     revenue_captured_usd: number | null,
 *     missed_opportunity_usd: number | null,
 *   }>,
 * }}
 */
export function parseAndValidateCatalogSnapshot(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('catalog snapshot: invalid root');
  const version = Number(/** @type {{ version?: unknown }} */ (raw).version);
  if (!Number.isInteger(version) || version < 1) throw new Error('catalog snapshot: missing version');

  const providers = /** @type {{ providers?: unknown }} */ (raw).providers;
  if (!Array.isArray(providers) || providers.length === 0) {
    throw new Error('catalog snapshot: providers[] required');
  }

  const out = [];
  for (const row of providers) {
    if (!row || typeof row !== 'object') throw new Error('catalog snapshot: invalid row');
    const r = /** @type {Record<string, unknown>} */ (row);
    const id = typeof r.id === 'string' ? r.id.trim() : '';
    if (!id || id.length > 64) throw new Error(`catalog snapshot: bad id "${id}"`);
    const display_name = typeof r.display_name === 'string' ? r.display_name.trim() : '';
    if (!display_name) throw new Error(`catalog snapshot: display_name for ${id}`);

    const p99 = Number(r.p99_latency_ms);
    const cost = Number(r.cost_per_1m_dims_usd);
    const s24 = Number(r.success_rate_last_24h);
    const s7 = Number(r.success_rate_last_7d);
    const wr = Number(r.win_rate);
    if (!Number.isFinite(p99) || p99 < 0) throw new Error(`catalog snapshot: p99_latency_ms ${id}`);
    if (!Number.isFinite(cost) || cost < 0) throw new Error(`catalog snapshot: cost ${id}`);
    for (const [name, v] of /** @type {const} */ ([
      ['success_rate_last_24h', s24],
      ['success_rate_last_7d', s7],
      ['win_rate', wr],
    ])) {
      if (!Number.isFinite(v) || v < 0 || v > 1) {
        throw new Error(`catalog snapshot: ${name} for ${id}`);
      }
    }

    let rev = r.revenue_captured_usd;
    if (rev != null) {
      rev = Number(rev);
      if (!Number.isFinite(rev)) throw new Error(`catalog snapshot: revenue ${id}`);
    }
    let miss = r.missed_opportunity_usd;
    if (miss != null) {
      miss = Number(miss);
      if (!Number.isFinite(miss)) throw new Error(`catalog snapshot: missed ${id}`);
    }

    const is_active = r.is_active !== false;

    out.push({
      id,
      display_name,
      category: typeof r.category === 'string' && r.category.trim() ? r.category.trim() : 'vector_db',
      is_active,
      p99_latency_ms: p99,
      cost_per_1m_dims_usd: cost,
      success_rate_last_24h: s24,
      success_rate_last_7d: s7,
      win_rate: wr,
      revenue_captured_usd: rev,
      missed_opportunity_usd: miss,
    });
  }

  return { version, providers: out };
}
