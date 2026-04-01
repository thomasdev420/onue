import Link from 'next/link';
import { getPlatformMetricsSnapshot } from '@/app/lib/amplyRoute/routeDecisionLog';

export const metadata = {
  title: 'Listing impact | Amply',
  description: 'Platform routing telemetry: volume and share to listed providers.',
};

function formatInt(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

export default async function ListingImpactPage() {
  const m = await getPlatformMetricsSnapshot();
  const showData = m.telemetry_ready && !m.error_code;
  const d30 = m.decisions_last_30d ?? 0;
  const d7 = m.decisions_last_7d ?? 0;
  const listed = m.decisions_to_listed_providers_last_30d ?? 0;
  const pct = m.pct_decisions_to_listed_providers_last_30d;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Listing impact</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Same public telemetry as the provider page, plus room for your per-provider dashboards as we link Stripe / catalog
        identities to your row. Questions:{' '}
        <a href="mailto:support@useamply.com" className="font-semibold text-indigo-600 underline">
          support@useamply.com
        </a>
        .
      </p>

      {!showData ? (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Metrics not available yet</p>
          <p className="mt-1 text-amber-900/90">
            {m.error_code
              ? `Snapshot error: ${m.error_code}. If the telemetry table is new, run database_migration_amply_route_decisions.sql in Supabase.`
              : 'Run the telemetry migration on your database, then successful route responses will populate totals.'}
          </p>
        </div>
      ) : (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Decisions (30d)</dt>
            <dd className="mt-1 tabular-nums text-2xl font-bold text-gray-900">{formatInt(d30)}</dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Decisions (7d)</dt>
            <dd className="mt-1 tabular-nums text-2xl font-bold text-gray-900">{formatInt(d7)}</dd>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-indigo-800">To listed providers (30d)</dt>
            <dd className="mt-1 tabular-nums text-2xl font-bold text-gray-900">
              {formatInt(listed)}
              {pct != null ? (
                <span className="ml-2 text-base font-semibold text-indigo-800">({pct}%)</span>
              ) : null}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50/80 p-5">
        <p className="text-sm font-medium text-gray-900">Coming next</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
          <li>Per-provider wins, category rank, and optional referral_tag breakdowns from POST /api/v1/route.</li>
          <li>Account ↔ catalog row linking so you see only your traffic.</li>
          <li>
            Documented <code className="rounded bg-white px-1 font-mono text-xs">?ref=amply</code> patterns for landing
            pages you control.
          </li>
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/providers" className="font-semibold text-indigo-600 underline">
            Provider program →
          </Link>
        </p>
      </div>
    </div>
  );
}
