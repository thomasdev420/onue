/**
 * Verifies GET /api/v1/status (expects data_mode: catalog when DB + service role work).
 * Run from repo root with dev server up: npm run check:v1-status
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const base = (process.env.AMPLY_STATUS_URL || 'http://localhost:3000').replace(/\/$/, '');
const url = `${base}/api/v1/status`;

let res;
try {
  res = await fetch(url);
} catch (e) {
  console.error(`Could not reach ${url} (${e.cause?.code || e.message}).`);
  console.error('Start the app: npm run dev');
  process.exit(1);
}
const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error('Non-JSON response:', text.slice(0, 500));
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));

if (!res.ok) {
  console.error(`\nHTTP ${res.status}`);
  process.exit(1);
}

if (data.data_mode !== 'catalog') {
  console.error(
    `\nExpected data_mode "catalog", got "${data.data_mode}".`,
    '\n- Is npm run dev running?',
    '\n- Set SUPABASE_SERVICE_ROLE_KEY in .env and restart dev.',
    '\n- Run database_setup_amply_route.sql in this Supabase project.',
  );
  process.exit(1);
}

console.error('\nOK: data_mode is catalog (Supabase catalog is wired).');
process.exit(0);
