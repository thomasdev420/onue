/**
 * Verify GitHub Actions repository secrets exist (names only; values never printed).
 *
 * Prereq: GitHub CLI — https://cli.github.com/
 *   gh auth login
 *   gh secret list -R owner/repo   # or run from a git clone with default repo
 *
 * Usage:
 *   npm run check:gha-secrets
 *   GITHUB_REPOSITORY=owner/repo npm run check:gha-secrets
 */
import { spawnSync } from 'node:child_process';

const REQUIRED = ['AMPLY_PROD_URL', 'AMPLY_API_KEYS'];
const repo = process.env.GITHUB_REPOSITORY?.trim();

const args = ['secret', 'list', '--json', 'name'];
if (repo) {
  args.unshift('-R', repo);
}

const r = spawnSync('gh', args, { encoding: 'utf-8' });

if (r.error || r.status !== 0) {
  console.error(
    'Could not run `gh secret list`. Install the GitHub CLI, run `gh auth login`, and retry.\n',
    'Required secrets (Repository → Settings → Secrets and variables → Actions):',
    REQUIRED.join(', '),
    '\n',
    r.stderr?.trim() || r.error?.message || '',
    '\nDocs: deploy-setup.md § GitHub Actions — synthetic latency workflow',
  );
  process.exit(2);
}

let rows = [];
try {
  rows = JSON.parse(r.stdout || '[]');
} catch {
  console.error('Unexpected `gh secret list` output. Upgrade GitHub CLI.');
  process.exit(2);
}

const names = new Set(rows.map((row) => row.name).filter(Boolean));
const missing = REQUIRED.filter((n) => !names.has(n));

if (missing.length) {
  console.error(
    'Missing Actions secrets:',
    missing.join(', '),
    '\n→ GitHub: repo → Settings → Secrets and variables → Actions → New repository secret',
  );
  process.exit(1);
}

console.log('OK: required Actions secrets are defined:', REQUIRED.join(', '));
