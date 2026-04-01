import Link from 'next/link';
import { getPlatformMetricsSnapshot } from '@/app/lib/amplyRoute/routeDecisionLog';

function formatInt(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

export default async function PlatformMetricsSection() {
  const m = await getPlatformMetricsSnapshot();

  const showData = m.telemetry_ready && !m.error_code;
  const d30 = m.decisions_last_30d ?? 0;
  const d7 = m.decisions_last_7d ?? 0;
  const listed = m.decisions_to_listed_providers_last_30d ?? 0;
  const pct = m.pct_decisions_to_listed_providers_last_30d;

  return (
    <section className="border-t border-gray-200/80 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
          Verifiable platform impact
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Public routing volume and share to listed providers
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          Builders and agents call the same routing API you see in the docs. Below is live telemetry from successful
          route responses — not page views — so you can see how much evaluation traffic exists and what share flows to
          paid catalog rows.{' '}
          <Link
            href="/api/v1/platform-metrics"
            className="font-semibold text-indigo-600 underline decoration-indigo-600/30 underline-offset-2"
          >
            Raw JSON
          </Link>
          .
        </p>

        {!showData ? (
          <div className="mt-8 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-5 py-4 text-sm text-amber-950">
            <p className="font-medium">Telemetry wiring in progress or database migration pending</p>
            <p className="mt-2 text-amber-900/90">
              Run <code className="rounded bg-white/80 px-1 font-mono text-xs">database_migration_amply_route_decisions.sql</code>{' '}
              against your Supabase / Postgres, then new shipments will populate counts. Existing production traffic may
              show zero until the migration is applied.
            </p>
          </div>
        ) : (
          <>
            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200/90 bg-gray-50/80 p-5 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last 30 days</dt>
                <dd className="mt-2 tabular-nums text-3xl font-bold text-gray-900">{formatInt(d30)}</dd>
                <p className="mt-1 text-sm text-gray-600">routing decisions (successful API responses)</p>
              </div>
              <div className="rounded-2xl border border-gray-200/90 bg-gray-50/80 p-5 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last 7 days</dt>
                <dd className="mt-2 tabular-nums text-3xl font-bold text-gray-900">{formatInt(d7)}</dd>
                <p className="mt-1 text-sm text-gray-600">recent momentum</p>
              </div>
              <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 shadow-sm sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
                  Share to listed providers (30d)
                </dt>
                <dd className="mt-2 flex flex-wrap items-baseline gap-3">
                  <span className="tabular-nums text-3xl font-bold text-gray-900">{formatInt(listed)}</span>
                  <span className="text-sm text-gray-600">decisions where the winner had paid placement</span>
                  {pct != null ? (
                    <span className="tabular-nums text-lg font-semibold text-indigo-800">({pct}% of 30d volume)</span>
                  ) : null}
                </dd>
              </div>
            </dl>

            {Array.isArray(m.by_category_last_30d) && m.by_category_last_30d.length > 0 ? (
              <div className="mt-10">
                <h3 className="text-sm font-bold text-gray-900">By category (30d)</h3>
                <ul className="mt-4 space-y-3">
                  {m.by_category_last_30d.map((row) => (
                    <li
                      key={row.category}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/90 bg-white px-4 py-3 text-sm"
                    >
                      <span className="font-mono text-gray-800">{row.category}</span>
                      <span className="tabular-nums text-gray-700">
                        {formatInt(row.decisions)} total
                        <span className="text-gray-500"> · </span>
                        {formatInt(row.decisions_to_listed ?? 0)} to listed
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-8 text-xs leading-relaxed text-gray-500">
              Methodology matches{' '}
              <code className="rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[11px]">GET /api/v1/platform-metrics</code>
              . Sign in to the dashboard for the partner-facing summary; per-provider drill-downs and referral reporting
              ship next.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
