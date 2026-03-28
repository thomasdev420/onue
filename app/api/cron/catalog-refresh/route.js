import { NextResponse } from 'next/server';
import catalogSnapshot from '../../../../data/amply_route_catalog.json';
import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';
import { parseAndValidateCatalogSnapshot, syncCatalogProviders } from '@/app/lib/amplyRoute/catalogSyncFromSnapshot';
import { resolveDatabaseUrl } from '@/app/lib/amplyRoute/resolveDatabaseUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron: GET with Authorization: Bearer <CRON_SECRET> (set in project env; Vercel injects when cron fires).
 * Manual: same header, or run `npm run catalog:sync` with DATABASE_URL.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    amplyLog({ level: 'error', msg: 'cron.catalog_refresh.misconfigured', detail: 'CRON_SECRET' });
    return NextResponse.json({ ok: false, detail: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    amplyLog({ level: 'warn', msg: 'cron.catalog_refresh.unauthorized' });
    return NextResponse.json({ ok: false, detail: 'Unauthorized' }, { status: 401 });
  }

  const dbUrl = resolveDatabaseUrl();
  if (!dbUrl) {
    amplyLog({ level: 'error', msg: 'cron.catalog_refresh.no_database_url' });
    return NextResponse.json({ ok: false, detail: 'DATABASE_URL not configured' }, { status: 503 });
  }

  const t0 = performance.now();
  let result;
  try {
    const parsed = parseAndValidateCatalogSnapshot(catalogSnapshot);
    result = await syncCatalogProviders(dbUrl, parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    amplyLog({ level: 'error', msg: 'cron.catalog_refresh.failed', error: msg.slice(0, 300) });
    return NextResponse.json({ ok: false, detail: msg.slice(0, 200) }, { status: 500 });
  }

  const ms = Math.round(performance.now() - t0);
  amplyLog({
    level: 'info',
    msg: 'cron.catalog_refresh.ok',
    upserted: result.upserted,
    snapshot_version: result.snapshot_version,
    compute_ms: ms,
  });

  return NextResponse.json({
    ok: true,
    upserted: result.upserted,
    snapshot_version: result.snapshot_version,
    compute_ms: ms,
  });
}
