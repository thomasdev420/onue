#!/usr/bin/env node
/**
 * Create a user API key in Supabase (same contract as /dashboard/api-keys).
 * Does not open a browser — uses SUPABASE_SERVICE_ROLE_KEY from .env
 *
 * Usage (from repo root, with .env present):
 *   node scripts/create-amply-user-api-key.mjs you@email.com
 *   node scripts/create-amply-user-api-key.mjs you@email.com "CI bot"
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = process.argv[2]?.trim() || process.env.AMPLY_KEY_USER_EMAIL?.trim();
const label = process.argv[3]?.trim() || null;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env)');
  process.exit(1);
}
if (!email) {
  console.error('Usage: node scripts/create-amply-user-api-key.mjs <user-email> [label]');
  console.error('   or: AMPLY_KEY_USER_EMAIL=you@... node scripts/create-amply-user-api-key.mjs');
  process.exit(1);
}

function hashSecret(raw) {
  return createHash('sha256').update(String(raw), 'utf8').digest('hex');
}

function genKey() {
  const raw = `amply_sk_${randomBytes(24).toString('base64url')}`;
  const prefix = `${raw.slice(0, 14)}…`;
  return { raw, prefix };
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { raw, prefix } = genKey();
const key_hash = hashSecret(raw);

const { data, error } = await admin
  .from('amply_api_keys')
  .insert({
    user_id: email,
    key_hash,
    key_prefix: prefix,
    label: label || null,
  })
  .select('id, key_prefix')
  .single();

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}

console.log('\n✓ Created API key for', email);
console.log('  id:', data.id);
console.log('  prefix:', data.key_prefix);
console.log('\n--- SAVE THIS KEY (shown once) ---\n');
console.log(raw);
console.log('\n--- curl example ---');
console.log(
  `curl -s -X POST "http://localhost:3000/api/v1/route" \\\\\n  -H "Content-Type: application/json" \\\\\n  -H "Authorization: Bearer ${raw}" \\\\\n  -d '{"task":"store 100k vectors with filters"}'`,
);
console.log('');
