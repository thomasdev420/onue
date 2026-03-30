/**
 * Shows which env supplies the Bearer for verify:deploy / probes (no full secret printed).
 *
 *   npm run debug:amply-bearer
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rt = process.env.AMPLY_ROUTE_BEARER_TOKEN?.trim();
const dt = process.env.AMPLY_DEV_ROUTE_TOKEN?.trim();
const keysRaw = process.env.AMPLY_API_KEYS || '';
const keys = keysRaw
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

function describe(token) {
  if (!token) return null;
  const len = token.length;
  const kind = token.startsWith('amply_sk_')
    ? 'dashboard_user_key_shape'
    : /^[0-9a-f]+$/i.test(token) && len >= 32
      ? 'hex_like_server_secret'
      : 'other';
  return { length: len, kind };
}

let source = 'none';
let token = null;
if (rt) {
  source = 'AMPLY_ROUTE_BEARER_TOKEN';
  token = rt;
} else if (dt) {
  source = 'AMPLY_DEV_ROUTE_TOKEN';
  token = dt;
} else if (keys.length) {
  source = 'AMPLY_API_KEYS (first entry only — verify:deploy uses first)';
  token = keys[0];
}

console.error(
  JSON.stringify(
    {
      bearer_source: source,
      first_key_meta: describe(token),
      api_keys_entry_count: keys.length,
      note:
        'If bearer_source is wrong, unset AMPLY_ROUTE_BEARER_TOKEN / AMPLY_DEV_ROUTE_TOKEN so AMPLY_API_KEYS is used.',
      note2:
        'Vercel AMPLY_API_KEYS must list the raw secret(s) you send as Authorization: Bearer <secret>, not a hash.',
    },
    null,
    2,
  ),
);

