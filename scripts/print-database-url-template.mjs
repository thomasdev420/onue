/**
 * Prints the Supabase Transaction pooler URI for DATABASE_URL (serverless / Vercel).
 * Does not call Supabase — no login needed. Uses NEXT_PUBLIC_SUPABASE_URL from .env.
 *
 * Usage (from repo root):
 *   node scripts/print-database-url-template.mjs
 *
 * Then replace ONLY the password part, or run:
 *   DATABASE_PASSWORD='your-db-password' node scripts/print-database-url-template.mjs
 *
 * Copy the printed line into Vercel → DATABASE_URL (Production). Redeploy.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (!publicUrl) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL in .env (e.g. https://xxxx.supabase.co)');
  process.exit(1);
}

let host;
try {
  host = new URL(publicUrl).hostname;
} catch {
  console.error('Invalid NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const m = host.match(/^([^.]+)\.supabase\.co$/i);
if (!m) {
  console.error('Expected host like YOUR_REF.supabase.co, got:', host);
  process.exit(1);
}
const ref = m[1];

// Official transaction-pooler shape for serverless (IPv4-friendly pooler path).
// See: https://supabase.com/docs/guides/database/connecting-to-postgres#pooler-transaction-mode
const dbHost = `db.${ref}.supabase.co`;
const port = 6543;
const dbName = 'postgres';
const user = 'postgres';

const pw = process.env.DATABASE_PASSWORD?.trim();
if (pw) {
  const enc = encodeURIComponent(pw);
  const uri = `postgresql://${user}:${enc}@${dbHost}:${port}/${dbName}`;
  console.log(uri);
  console.error('\n↑ Full DATABASE_URL — copy to Vercel (do not commit).');
} else {
  console.log(`postgresql://${user}:PASTE_YOUR_DB_PASSWORD_HERE@${dbHost}:${port}/${dbName}`);
  console.error(`
Replace PASTE_YOUR_DB_PASSWORD_HERE with your database password (the one for Postgres, not API keys).

If you never saved it: Supabase Dashboard → your project → left sidebar "Database"
→ look for "Database password" / "Reset database password", set a new password,
then run again:

  DATABASE_PASSWORD='your-new-password' node scripts/print-database-url-template.mjs

Or paste the password manually into the URI (special chars may need encoding — the script encodes when you use DATABASE_PASSWORD).
`);
}
