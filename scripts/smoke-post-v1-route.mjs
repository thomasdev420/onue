/**
 * POST /api/v1/route smoke test (dev server must be running).
 * Uses AMPLY_API_KEYS from .env if set: picks first key for Authorization.
 * Usage: npm run smoke:v1-route
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const base = (process.env.AMPLY_STATUS_URL || 'http://localhost:3000').replace(/\/$/, '');
const url = `${base}/api/v1/route`;

const keys = (process.env.AMPLY_API_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);
const headers = { 'Content-Type': 'application/json' };
if (keys.length) {
  headers.Authorization = `Bearer ${keys[0]}`;
}

const body = {
  task: 'store 100k 1536-dim vectors with metadata filters and similarity search',
  dimension: 1536,
  workload_type: 'hybrid',
  filter_complexity: 'high',
};

let res;
try {
  res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
} catch (e) {
  console.error(`Could not reach ${url} — is npm run dev running?`, e.cause?.code || e.message);
  process.exit(1);
}

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error('Non-JSON:', text.slice(0, 400));
  process.exit(1);
}

if (!res.ok) {
  console.error(JSON.stringify(data, null, 2));
  console.error(`\nHTTP ${res.status}`);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
const src = data.raw_metrics?.catalog_source;
console.error(
  `\nOK: recommended=${data.recommended} catalog_source=${src ?? 'n/a'} request_id=${data.request_id}`,
);
if (src !== 'supabase') {
  console.error('Note: catalog_source is not "supabase" — check DB + SUPABASE_SERVICE_ROLE_KEY.');
}
process.exit(0);
