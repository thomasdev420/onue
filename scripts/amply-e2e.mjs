#!/usr/bin/env node
/**
 * 1) npm run amply:verify-bearer — Bearer exists in local .env Supabase amply_api_keys
 * 2) npm run verify:deploy — same URL
 *
 * Usage:
 *   npm run amply:e2e -- https://www.useamply.com
 *   AMPLY_PROD_URL=https://www.useamply.com npm run amply:e2e
 *
 * Prod env file (after `vercel env pull .env.vercel.pull --environment=production --yes`):
 *   DOTENV_CONFIG_PATH=.env.vercel.pull npm run amply:e2e -- https://www.useamply.com
 */
import { spawnSync } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const url = process.argv[2]?.trim() || process.env.AMPLY_PROD_URL?.trim();
if (!url) {
  console.error('Usage: npm run amply:e2e -- https://www.useamply.com\n  or AMPLY_PROD_URL=… npm run amply:e2e');
  process.exit(1);
}

function run(nodeArgs) {
  return spawnSync('node', nodeArgs, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

let r = run([path.join(__dirname, 'verify-amply-bearer-local.mjs')]);
if (r.status !== 0) process.exit(r.status ?? 1);

r = run([path.join(__dirname, 'verify-deployment.mjs'), url]);
process.exit(r.status ?? 1);
