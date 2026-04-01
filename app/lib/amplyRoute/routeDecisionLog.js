/**
 * Record successful /api/v1/route outcomes and read public aggregates (provider transparency).
 */
import { amplyLog } from './amplyLog.js';
import { resolveDatabaseUrl } from './resolveDatabaseUrl.js';
import { getAmplyRoutePgPool } from './loadCatalogPg.js';
import { getSupabaseServiceRole } from '@/app/services/amplySelection/supabaseAdmin';

const ORGANIC = 'organic';

export function isPaidCatalogListing(catalogListing) {
  return String(catalogListing || ORGANIC) !== ORGANIC;
}

/** @param {unknown} raw */
export function normalizeReferralTag(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.length > 64) return null;
  if (!/^[a-zA-Z0-9._:@/-]+$/.test(s)) return null;
  return s;
}

/**
 * Fire-and-forget safe: logs on failure; never throws to caller.
 * @param {object} p
 * @param {string} p.recommendedProviderId
 * @param {string} p.category
 * @param {string} p.catalogListing
 * @param {string} p.requestId uuid string
 * @param {string | null} p.referralTag
 */
export async function recordRouteDecision(p) {
  const {
    recommendedProviderId,
    category,
    catalogListing,
    requestId,
    referralTag,
  } = p;
  const listing = String(catalogListing || ORGANIC);
  const isPaid = isPaidCatalogListing(listing);
  const cat = typeof category === 'string' && category.trim() ? category.trim() : 'vector_db';

  const dbUrl = resolveDatabaseUrl();
  if (dbUrl) {
    try {
      const pool = getAmplyRoutePgPool(dbUrl);
      await pool.query(
        `INSERT INTO public.amply_route_decisions
         (recommended_provider_id, category, catalog_listing, is_paid_listing, request_id, referral_tag)
         VALUES ($1, $2, $3, $4, $5::uuid, $6)`,
        [recommendedProviderId, cat, listing, isPaid, requestId, referralTag],
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      amplyLog({
        level: 'warn',
        msg: 'route_decision.pg_insert_failed',
        detail: msg.slice(0, 200),
      });
    }
    return;
  }

  const admin = getSupabaseServiceRole();
  if (!admin) return;

  try {
    const { error } = await admin.from('amply_route_decisions').insert({
      recommended_provider_id: recommendedProviderId,
      category: cat,
      catalog_listing: listing,
      is_paid_listing: isPaid,
      request_id: requestId,
      referral_tag: referralTag,
    });
    if (error) {
      amplyLog({
        level: 'warn',
        msg: 'route_decision.rest_insert_failed',
        code: error.code,
        detail: (error.message || '').slice(0, 200),
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    amplyLog({
      level: 'warn',
      msg: 'route_decision.rest_insert_failed',
      detail: msg.slice(0, 200),
    });
  }
}

/** @returns {Promise<object>} */
export async function getPlatformMetricsSnapshot() {
  const asOf = new Date().toISOString();
  const empty = {
    telemetry_ready: false,
    decisions_last_7d: 0,
    decisions_last_30d: 0,
    decisions_to_listed_providers_last_30d: 0,
    pct_decisions_to_listed_providers_last_30d: null,
    by_category_last_30d: [],
    error_code: null,
    as_of: asOf,
  };

  const dbUrl = resolveDatabaseUrl();
  try {
    if (dbUrl) {
      const pool = getAmplyRoutePgPool(dbUrl);
      const { rows } = await pool.query(
        'SELECT public.amply_route_platform_metrics() AS payload',
      );
      const payload = rows[0]?.payload;
      if (!payload || typeof payload !== 'object') return { ...empty, error_code: 'no_payload' };
      return shapeMetrics(/** @type {Record<string, unknown>} */ (payload), asOf);
    }

    const admin = getSupabaseServiceRole();
    if (!admin) return { ...empty, error_code: 'no_db' };

    const { data, error } = await admin.rpc('amply_route_platform_metrics');
    if (error) {
      return {
        ...empty,
        error_code: error.code || 'rpc_failed',
      };
    }
    if (!data || typeof data !== 'object') return { ...empty, error_code: 'no_payload' };
    return shapeMetrics(/** @type {Record<string, unknown>} */ (data), asOf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('does not exist')) {
      amplyLog({
        level: 'warn',
        msg: 'platform_metrics.snapshot_failed',
        detail: msg.slice(0, 200),
      });
    }
    return {
      ...empty,
      error_code: msg.includes('does not exist') ? 'telemetry_migration_pending' : 'query_exception',
    };
  }
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} asOf
 */
function shapeMetrics(raw, asOf) {
  const d7 = Number(raw.decisions_last_7d) || 0;
  const d30 = Number(raw.decisions_last_30d) || 0;
  const listed = Number(raw.decisions_to_listed_providers_last_30d) || 0;
  const pct =
    d30 > 0 ? Math.round((listed / d30) * 1000) / 10 : null;

  const byCat = Array.isArray(raw.by_category_last_30d) ? raw.by_category_last_30d : [];

  return {
    telemetry_ready: true,
    decisions_last_7d: d7,
    decisions_last_30d: d30,
    decisions_to_listed_providers_last_30d: listed,
    pct_decisions_to_listed_providers_last_30d: pct,
    by_category_last_30d: byCat,
    error_code: null,
    as_of: asOf,
  };
}
