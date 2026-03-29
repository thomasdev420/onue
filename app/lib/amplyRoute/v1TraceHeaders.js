/**
 * @param {Record<string, string>} base
 * @param {{ requestId?: string | null, computeMs?: number | null }} opts
 */
export function withV1TraceHeaders(base, { requestId, computeMs }) {
  const out = { ...base };
  if (requestId) {
    out['X-Amply-Request-Id'] = requestId;
  }
  if (computeMs != null && Number.isFinite(computeMs)) {
    out['X-Amply-Compute-Ms'] = String(Math.max(0, Math.round(computeMs)));
  }
  return out;
}
