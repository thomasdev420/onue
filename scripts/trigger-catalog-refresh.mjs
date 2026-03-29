/**
 * Manually invoke production (or preview) catalog sync — same as Vercel Cron:
 * GET /api/cron/catalog-refresh with Authorization: Bearer <CRON_SECRET>
 *
 *   CRON_SECRET=... npm run catalog:refresh:remote -- https://www.useamply.com
 *
 * Secret: Vercel Dashboard → Project → Settings → Environment Variables → CRON_SECRET
 * (or `vercel env pull` into a local file you do not commit).
 */
const baseRaw = process.argv[2] || process.env.AMPLY_PROD_URL;
const secret = process.env.CRON_SECRET?.trim();

if (!baseRaw?.trim()) {
  console.error('Usage: CRON_SECRET=... npm run catalog:refresh:remote -- https://www.useamply.com');
  process.exit(1);
}
if (!secret) {
  console.error('Missing CRON_SECRET (must match Vercel env for this project).');
  process.exit(1);
}

let origin;
try {
  origin = new URL(baseRaw.trim()).origin;
} catch {
  console.error('Invalid URL:', baseRaw);
  process.exit(1);
}

const url = `${origin}/api/cron/catalog-refresh`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${secret}` },
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text.slice(0, 500);
}

console.error(JSON.stringify({ url, http: res.status, body }, null, 2));

if (!res.ok) {
  console.error('\nFAIL: cron endpoint did not return 2xx.');
  process.exit(1);
}

console.error('\nOK: catalog refresh invoked. Re-check GET /api/v1/status catalog_freshness.metrics_as_of.');
process.exit(0);
