/**
 * In-memory catalog fallback (same rows as data/amply_route_catalog.json).
 */
import catalogSnapshot from '../../../data/amply_route_catalog.json';
import { parseAndValidateCatalogSnapshot } from './catalogSnapshotSchema.js';

const { providers } = parseAndValidateCatalogSnapshot(catalogSnapshot);

/** @type {Record<string, Record<string, unknown>>} */
export const SEEDED_PROVIDERS = Object.fromEntries(
  providers.map((p) => [
    p.id,
    {
      display_name: p.display_name,
      win_rate: p.win_rate,
      p99_latency_ms: p.p99_latency_ms,
      cost_per_1m_dims_usd: p.cost_per_1m_dims_usd,
      success_rate_last_24h: p.success_rate_last_24h,
      success_rate_last_7d: p.success_rate_last_7d,
      revenue_captured_usd: p.revenue_captured_usd,
      missed_opportunity_usd: p.missed_opportunity_usd,
      catalog_listing: p.catalog_listing || 'organic',
    },
  ]),
);
