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
