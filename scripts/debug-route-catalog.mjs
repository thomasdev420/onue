/**
 * Verifies service role can read amply_route_providers (no Next server needed).
 * Usage: npm run debug:route-catalog
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env');
  process.exit(1);
}
if (!key || !String(key).trim()) {
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY is empty.\n',
    'Supabase → Project Settings → API Keys → copy Secret (sb_secret_...) or Legacy → service_role.\n',
    'Paste it after SUPABASE_SERVICE_ROLE_KEY= in .env (no quotes, no space after =).',
  );
  process.exit(1);
}

const admin = createClient(url, key.trim(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error } = await admin
  .from('amply_route_providers')
  .select('id')
  .eq('is_active', true)
  .order('id');

if (error) {
  console.error('Supabase error:', error.message);
  console.error('Hint: wrong key for this project, or table missing (run database_setup_amply_route.sql).');
  process.exit(1);
}

if (!rows?.length) {
  console.error('No active rows in amply_route_providers — run database_setup_amply_route.sql');
  process.exit(1);
}

console.error('OK: service role reads catalog. ids:', rows.map((r) => r.id).join(', '));
process.exit(0);
