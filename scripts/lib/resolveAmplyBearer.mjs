/**
 * Bearer token for scripts hitting POST /api/v1/route (and optional deploy checks).
 * Priority: AMPLY_ROUTE_BEARER_TOKEN, AMPLY_DEV_ROUTE_TOKEN, first AMPLY_API_KEYS entry.
 * Use AMPLY_* when testing user-key-only setups without server AMPLY_API_KEYS.
 */
export function resolveAmplyBearerFromEnv() {
  const single =
    process.env.AMPLY_ROUTE_BEARER_TOKEN?.trim() ||
    process.env.AMPLY_DEV_ROUTE_TOKEN?.trim() ||
    '';
  if (single) return single;
  const keys = (process.env.AMPLY_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return keys[0] || null;
}
