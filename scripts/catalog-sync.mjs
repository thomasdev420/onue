/**
 * Apply data/amply_route_catalog.json to Postgres (same as Vercel cron).
 *
 *   npm run catalog:sync
 *
 * Requires DATABASE_URL (or POSTGRES_URL / SUPABASE_DB_URL) in .env
 */
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseAndValidateCatalogSnapshot } from '../app/lib/amplyRoute/catalogSnapshotSchema.js';
import { syncCatalogProviders } from '../app/lib/amplyRoute/catalogSyncFromSnapshot.js';
import { resolveDatabaseUrl } from '../app/lib/amplyRoute/resolveDatabaseUrl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = resolveDatabaseUrl();
if (!dbUrl) {
  console.error('Missing DATABASE_URL (or POSTGRES_URL / SUPABASE_DB_URL).');
  process.exit(1);
}

const snapPath = path.join(__dirname, '..', 'data', 'amply_route_catalog.json');
const raw = JSON.parse(readFileSync(snapPath, 'utf8'));
const parsed = parseAndValidateCatalogSnapshot(raw);

console.error('Applying catalog snapshot version', parsed.version, '→', dbUrl.replace(/:[^:@/]+@/, ':****@'));

const result = await syncCatalogProviders(dbUrl, parsed);
console.error('OK: upserted', result.upserted, 'rows (snapshot_version', result.snapshot_version + ')');
