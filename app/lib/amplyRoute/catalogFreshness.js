/**
 * @param {Array<Record<string, unknown>>} rows
 * @returns {{ metrics_as_of: string | null, row_updated_at: string | null }}
 */
export function maxTimestampsFromRows(rows) {
  let metricsAsOf = null;
  let rowUpdated = null;
  for (const row of rows) {
    const m = row.metrics_as_of;
    const u = row.updated_at;
    if (m != null) {
      const iso = m instanceof Date ? m.toISOString() : String(m);
      if (!metricsAsOf || iso > metricsAsOf) metricsAsOf = iso;
    }
    if (u != null) {
      const iso = u instanceof Date ? u.toISOString() : String(u);
      if (!rowUpdated || iso > rowUpdated) rowUpdated = iso;
    }
  }
  return { metrics_as_of: metricsAsOf, row_updated_at: rowUpdated };
}

/**
 * @param {{ metrics_as_of?: string | null } | null | undefined} catalogFreshness
 * @param {number} maxAgeHours — metrics older than this are marked stale (default aligns with 24h “live” copy)
 */
export function catalogMetricsStaleness(catalogFreshness, maxAgeHours) {
  const threshold =
    Number.isFinite(maxAgeHours) && maxAgeHours > 0 ? maxAgeHours : 24;
  const raw = catalogFreshness?.metrics_as_of;
  if (!raw) {
    return {
      catalog_metrics_age_hours: null,
      catalog_metrics_stale: false,
      catalog_metrics_stale_after_hours: threshold,
    };
  }
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) {
    return {
      catalog_metrics_age_hours: null,
      catalog_metrics_stale: false,
      catalog_metrics_stale_after_hours: threshold,
    };
  }
  const ageHours = (Date.now() - t) / 3600000;
  return {
    catalog_metrics_age_hours: Math.round(ageHours * 10) / 10,
    catalog_metrics_stale: ageHours > threshold,
    catalog_metrics_stale_after_hours: threshold,
  };
}
