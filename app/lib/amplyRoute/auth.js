/**
 * Comma-separated keys; empty = no env-level keys (dev / user-key-only modes).
 * Matches AMPLY_API_KEYS in amply-api.
 */
import { validateUserApiKeySecret } from './userApiKeys';

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
 * Production defaults to requiring Bearer auth on POST /api/v1/route unless
 * AMPLY_ALLOW_ANONYMOUS_ROUTE=1 (preview / legacy only — not for public prod).
 */
export function isProductionRouteAuthStrict() {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.AMPLY_ALLOW_ANONYMOUS_ROUTE?.trim() !== '1'
  );
}

/**
 * @returns {'none' | 'api_key'}
 * `api_key` when env keys are set, AMPLY_REQUIRE_API_KEY=1, or production strict default.
 */
export function getAuthMode() {
  if (getApiKeySet().size > 0) return 'api_key';
  if (process.env.AMPLY_REQUIRE_API_KEY?.trim() === '1') return 'api_key';
  if (isProductionRouteAuthStrict()) return 'api_key';
  return 'none';
}

/**
 * @param {Request} request
 * @returns {Promise<{ ok: boolean, error?: string }>}
 * Accepts env AMPLY_API_KEYS **or** Supabase-backed user keys (amply_api_keys).
 * In production (strict), Bearer is required and must match env or DB.
 * Invalid Bearer always 401 when a token is sent.
 */
export async function verifyRouteAccess(request) {
  const envKeys = getApiKeySet();
  const mode = getAuthMode();
  const authHeader = request.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(authHeader);
  const token = m ? m[1].trim() : null;

  const dbOk = async (secret) => {
    if (!secret) return false;
    const r = await validateUserApiKeySecret(secret);
    return r.ok;
  };

  if (mode === 'api_key') {
    if (!token) {
      return { ok: false, error: 'Missing or invalid Authorization header' };
    }
    if (envKeys.size > 0 && envKeys.has(token)) {
      return { ok: true };
    }
    if (await dbOk(token)) {
      return { ok: true };
    }
    return { ok: false, error: 'Invalid API key' };
  }

  if (token) {
    if (envKeys.size > 0 && envKeys.has(token)) return { ok: true };
    if (await dbOk(token)) return { ok: true };
    return { ok: false, error: 'Invalid API key' };
  }

  return { ok: true };
}
