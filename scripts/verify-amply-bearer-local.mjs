#!/usr/bin/env node
/**
 * Checks that the Bearer you use for probe / verify:deploy exists in YOUR Supabase
 * `amply_api_keys` table (same DB Vercel uses when validating user keys).
 *
 * Usage (repo root, .env with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
 *   npm run amply:verify-bearer
 *
 * Resolves token like verify:deploy: AMPLY_ROUTE_BEARER_TOKEN → AMPLY_DEV_ROUTE_TOKEN → first AMPLY_API_KEYS.
 */
import dotenv from 'dotenv';
import path from 'path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { resolveAmplyBearerFromEnv } from './lib/resolveAmplyBearer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath =
  process.env.DOTENV_CONFIG_PATH?.trim() || path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const bearer = resolveAmplyBearerFromEnv();

function hashSecret(raw) {
  return createHash('sha256').update(String(raw), 'utf8').digest('hex');
}

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env).');
  process.exit(1);
}

if (!bearer) {
  console.error(
    'No Bearer material found. Set one of:',
    'AMPLY_ROUTE_BEARER_TOKEN, AMPLY_DEV_ROUTE_TOKEN, or AMPLY_API_KEYS in .env',
  );
  process.exit(1);
}

if (!bearer.startsWith('amply_sk_')) {
  console.log(
    'OK (skip DB): Bearer is not a user key prefix — treated as server secret from AMPLY_API_KEYS.',
    'Validation on Vercel is env AMPLY_API_KEYS; ensure Production has the same raw secret (not a hash).',
  );
  process.exit(0);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const keyHash = hashSecret(bearer);
const { data, error } = await admin
  .from('amply_api_keys')
  .select('id, user_id, key_prefix, revoked_at, created_at')
  .eq('key_hash', keyHash)
  .maybeSingle();

if (error) {
  console.error('Supabase query error:', error.message);
  process.exit(1);
}

if (!data) {
  console.error('NOT FOUND: this exact secret is not in amply_api_keys for project:', url.replace(/^https:\/\//, '').replace(/\..*$/, '…'));
  console.error('Fix: create a key in Dashboard → API keys, paste the full amply_sk_… secret into AMPLY_ROUTE_BEARER_TOKEN, save .env.');
  console.error('If you created the key against a different Supabase project than NEXT_PUBLIC_SUPABASE_URL here, prod will also return Invalid API key.');
  process.exit(1);
}

if (data.revoked_at) {
  console.error('REVOKED at', data.revoked_at, '- create a new key and update .env');
  process.exit(1);
}

console.log('OK: Bearer matches an active row in amply_api_keys.');
console.log(
  JSON.stringify(
    {
      user_id: data.user_id,
      key_prefix: data.key_prefix,
      id: data.id,
      supabase_project_ref: url.split('//')[1]?.split('.')[0] ?? null,
    },
    null,
    2,
  ),
);
console.log(
  '\nIf POST https://your-prod-host/api/v1/route still returns Invalid API key:',
  'Vercel → Production env must use this SAME Supabase project:',
  url,
  '\n(same NEXT_PUBLIC_SUPABASE_URL host + SUPABASE_SERVICE_ROLE_KEY for that project).',
);
process.exit(0);
