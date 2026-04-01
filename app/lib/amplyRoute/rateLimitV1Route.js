/**
 * Sliding-window rate limit for POST /api/v1/route (per serverless instance).
 * Production: defaults to 120 req/min per client IP when env unset (set AMPLY_V1_RATE_LIMIT_PER_MIN=0 to disable).
 * Non-production: unset or 0 = disabled unless AMPLY_V1_RATE_LIMIT_PER_MIN is set positive.
 * For global limits use Vercel Firewall, Upstash, etc.
 */

function clientKey(request) {
  const xf = request.headers.get('x-forwarded-for');
  const first = xf?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}

export function resolveV1RouteMaxPerMinute() {
  const raw = process.env.AMPLY_V1_RATE_LIMIT_PER_MIN?.trim();
  if (raw === '0') return 0;
  if (raw !== undefined && raw !== '') {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  if (process.env.NODE_ENV === 'production') {
    return 120;
  }
  return 0;
}

/** For GET /api/v1/status (keep in sync with checkV1RouteRateLimit). */
export function getV1RouteRateLimitSummary() {
  const max = resolveV1RouteMaxPerMinute();
  if (!Number.isFinite(max) || max <= 0) {
    return { enabled: false, requests_per_minute_per_ip: null };
  }
  return { enabled: true, requests_per_minute_per_ip: max };
}

export function checkV1RouteRateLimit(request) {
  const max = resolveV1RouteMaxPerMinute();
  if (!Number.isFinite(max) || max <= 0) {
    return { ok: true, limit: null, remaining: null, retryAfterSec: null };
  }

  const windowMs = 60_000;
  const key = clientKey(request);
  const g = globalThis;
  const mapKey = '__amplyV1RouteRate';
  if (!g[mapKey]) g[mapKey] = new Map();
  const buckets = g[mapKey];
  const now = Date.now();
  let arr = buckets.get(key);
  if (!arr) {
    arr = [];
    buckets.set(key, arr);
  }
  const pruned = arr.filter((t) => now - t < windowMs);
  if (pruned.length >= max) {
    const oldest = pruned[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { ok: false, limit: max, remaining: 0, retryAfterSec };
  }
  pruned.push(now);
  buckets.set(key, pruned);
  return { ok: true, limit: max, remaining: max - pruned.length, retryAfterSec: null };
}
