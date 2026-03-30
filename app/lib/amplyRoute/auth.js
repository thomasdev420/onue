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
 * @returns {'none' | 'api_key'}
 * `api_key` when env keys are set or when AMPLY_REQUIRE_API_KEY=1 (Bearer required).
 */
export function getAuthMode() {
  if (getApiKeySet().size > 0) return 'api_key';
  if (process.env.AMPLY_REQUIRE_API_KEY?.trim() === '1') return 'api_key';
  return 'none';
}

/**
 * @param {Request} request
 * @returns {Promise<{ ok: boolean, error?: string }>}
 * Accepts env AMPLY_API_KEYS **or** Supabase-backed user keys (amply_api_keys).
 * When no env keys and AMPLY_REQUIRE_API_KEY is not 1, open if no Bearer (dev).
 * Invalid Bearer always 401 when a token is sent.
 */
export async function verifyRouteAccess(request) {
  const envKeys = getApiKeySet();
  const authHeader = request.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(authHeader);
  const token = m ? m[1].trim() : null;

  const dbOk = async (secret) => {
    if (!secret) return false;
    const r = await validateUserApiKeySecret(secret);
    return r.ok;
  };

  if (envKeys.size > 0) {
    if (token && envKeys.has(token)) return { ok: true };
    if (token && (await dbOk(token))) return { ok: true };
    if (!token) return { ok: false, error: 'Missing or invalid Authorization header' };
    return { ok: false, error: 'Invalid API key' };
  }

  if (token) {
    if (await dbOk(token)) return { ok: true };
    return { ok: false, error: 'Invalid API key' };
  }

  if (process.env.AMPLY_REQUIRE_API_KEY?.trim() === '1') {
    return { ok: false, error: 'Missing or invalid Authorization header' };
  }

  return { ok: true };
}
