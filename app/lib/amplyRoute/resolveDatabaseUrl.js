/**
 * Single place to resolve Postgres URL for the route catalog.
 * - Vercel Postgres / templates sometimes use POSTGRES_* instead of DATABASE_URL.
 * - Supabase transaction pooler (6543 / *.pooler.supabase.com) expects pgbouncer=true for node-pg.
 */
export function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.SUPABASE_DB_URL,
  ];
  for (const c of candidates) {
    const t = typeof c === 'string' ? c.trim() : '';
    if (t) return normalizeSupabasePoolerUrl(t);
  }
  return '';
}

/**
 * @param {string} urlString
 */
function normalizeSupabasePoolerUrl(urlString) {
  try {
    const u = new URL(urlString);
    const host = u.hostname.toLowerCase();
    const port = u.port || (u.protocol === 'postgresql:' || u.protocol === 'postgres:' ? '5432' : '');
    const isSupabasePooler =
      host.includes('pooler.supabase.com') ||
      (host.endsWith('.supabase.com') && port === '6543');
    if (isSupabasePooler && !u.searchParams.has('pgbouncer')) {
      u.searchParams.set('pgbouncer', 'true');
    }
    return u.toString();
  } catch {
    return urlString;
  }
}
