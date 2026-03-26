/**
 * Comma-separated keys; empty = no auth (dev). Matches AMPLY_API_KEYS in amply-api (pydantic AMPLY_ prefix).
 */
export function getApiKeySet() {
  const raw = process.env.AMPLY_API_KEYS || '';
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
  );
}

/**
 * @param {Request} request
 * @returns {{ ok: boolean, error?: string }}
 */
export function verifyBearer(request) {
  const keys = getApiKeySet();
  if (keys.size === 0) return { ok: true };

  const auth = request.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return { ok: false, error: 'Missing or invalid Authorization header' };
  const token = m[1].trim();
  if (!keys.has(token)) return { ok: false, error: 'Invalid API key' };
  return { ok: true };
}
