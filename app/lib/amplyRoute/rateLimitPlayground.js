/**
 * Stricter per-IP limit for unauthenticated POST /api/playground (public try-it).
 * AMPLY_PLAYGROUND_RATE_LIMIT_PER_MIN — default 15. Set 0 to disable (not recommended prod).
 */

function clientKey(request) {
  const xf = request.headers.get('x-forwarded-for');
  const first = xf?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}

export function checkPlaygroundRateLimit(request) {
  const raw = process.env.AMPLY_PLAYGROUND_RATE_LIMIT_PER_MIN?.trim();
  const def = 15;
  const max = raw !== undefined && raw !== '' ? Number(raw) : def;
  if (!Number.isFinite(max) || max <= 0) {
    return { ok: true, limit: null, remaining: null, retryAfterSec: null };
  }

  const windowMs = 60_000;
  const key = `pg:${clientKey(request)}`;
  const g = globalThis;
  const mapKey = '__amplyPlaygroundRate';
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
