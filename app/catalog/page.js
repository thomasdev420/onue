"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { getListingPayLink } from "@/app/lib/stripeListingUrls";

const LISTING_LABELS = {
  organic: { label: "Organic", className: "bg-slate-100 text-slate-800" },
  basic_listing: { label: "Basic listing", className: "bg-blue-50 text-blue-800" },
  featured: { label: "Featured", className: "bg-indigo-50 text-indigo-800" },
  sponsored_top3: { label: "Sponsored spotlight", className: "bg-amber-50 text-amber-900" },
};

export default function CatalogPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const listingPay = useMemo(() => getListingPayLink(), []);

  const load = useCallback(async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/v1/providers`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load catalog");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-sm font-medium text-indigo-600">Public catalog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Routing catalog &amp; placement disclosure
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          Every row below matches <code className="font-mono text-xs">GET /api/v1/providers</code>.
          <strong> Placement</strong> shows whether a provider is organic (metrics only) or on a paid
          listing tier. <strong>Benchmark freshness</strong> comes from the same timestamps Amply uses for
          staleness in <code className="font-mono text-xs">GET /api/v1/status</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {listingPay.external ? (
            <a
              href={listingPay.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Pay with Stripe to get listed
            </a>
          ) : (
            <Link
              href={listingPay.href}
              className="inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              List your service
            </Link>
          )}
          {listingPay.external && (
            <Link
              href="/providers/join"
              className="inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Submit details after paying
            </Link>
          )}
          <a
            href="/api/v1/providers"
            className="inline-flex rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Raw JSON
          </a>
        </div>

        {err && (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {err}
          </p>
        )}

        {data?.catalog_freshness && (
          <p className="mt-8 text-sm text-gray-600">
            <span className="font-medium text-gray-800">Catalog metrics as of:</span>{" "}
            <time dateTime={data.catalog_freshness.metrics_as_of}>
              {data.catalog_freshness.metrics_as_of}
            </time>{" "}
            (row <code className="font-mono text-xs">updated_at</code> aligned for routing freshness).
          </p>
        )}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90">
                <th className="px-4 py-3 font-semibold text-gray-900 sm:px-6">Provider</th>
                <th className="px-4 py-3 font-semibold text-gray-900 sm:px-6">Placement</th>
                <th className="px-4 py-3 font-semibold text-gray-900 sm:px-6">p99 latency (ms)</th>
                <th className="px-4 py-3 font-semibold text-gray-900 sm:px-6">$/1M dims</th>
                <th className="px-4 py-3 font-semibold text-gray-900 sm:px-6">Live score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.providers ?? []).map((p) => {
                const listing = p.catalog_listing || "organic";
                const meta = LISTING_LABELS[listing] ?? LISTING_LABELS.organic;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {p.display_name}
                      <span className="mt-0.5 block font-mono text-xs text-gray-400">{p.id}</span>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">{p.placement_disclosure}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 sm:px-6">{p.p99_latency_ms}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 sm:px-6">
                      {p.cost_per_1m_dims_usd}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 sm:px-6">
                      {p.live_composite_score != null ? p.live_composite_score : "n/a"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!data?.providers?.length && !err && (
            <p className="p-8 text-center text-gray-500">Loading catalog…</p>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
