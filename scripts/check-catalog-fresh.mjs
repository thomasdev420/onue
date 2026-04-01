/**
 * Fail if production GET /api/v1/status reports stale catalog metrics (alerting hook for CI).
 *
 *   AMPLY_PROD_URL=https://www.useamply.com npm run check:catalog-fresh
 *
 * Optional: AMPLY_CATALOG_STALE_AFTER_HOURS — not used here; server decides stale flag.
 * Optional: AMPLY_CATALOG_AGE_WARN_HOURS — if diagnostics.catalog_metrics_age_hours exceeds this,
 *   print a GitHub Actions ::warning:: (exit 0). Default: unset (no warning).
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const fromArg = process.argv[2];
const baseRaw = fromArg || process.env.AMPLY_PROD_URL;
if (!baseRaw?.trim()) {
  console.error('Usage: npm run check:catalog-fresh -- https://www.useamply.com\n  or AMPLY_PROD_URL=...');
  process.exit(1);
}

let base;
try {
  base = new URL(baseRaw.trim()).origin;
} catch {
  console.error('Invalid URL:', baseRaw);
  process.exit(1);
}

const url = `${base}/api/v1/status`;
const res = await fetch(url);
const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error('Non-JSON from', url, text.slice(0, 200));
  process.exit(1);
}

if (!res.ok || !data.ok) {
  console.error('Bad status', res.status, data);
  process.exit(1);
}

const stale = data.diagnostics?.catalog_metrics_stale === true;
const age = data.diagnostics?.catalog_metrics_age_hours;
console.error(
  JSON.stringify(
    {
      url,
      version: data.version,
      catalog_metrics_stale: stale,
      catalog_metrics_age_hours: age,
      metrics_as_of: data.catalog_freshness?.metrics_as_of,
    },
    null,
    2,
  ),
);

if (stale) {
  console.error('\nFAIL: catalog_metrics_stale=true — run catalog:sync + deploy, or fix Vercel cron.');
  process.exit(1);
}

const warnAfter = process.env.AMPLY_CATALOG_AGE_WARN_HOURS?.trim();
if (warnAfter && age != null && Number.isFinite(Number(warnAfter))) {
  const max = Number(warnAfter);
  if (age > max) {
    const msg = `catalog_metrics_age_hours=${age} exceeds AMPLY_CATALOG_AGE_WARN_HOURS=${max} (not stale yet; tighten sync if SLAs require fresher metrics)`;
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.error(`::warning::${msg}`);
    } else {
      console.error(`\nWARN: ${msg}`);
    }
  }
}

console.error('\nOK: catalog metrics are fresh.');
process.exit(0);
