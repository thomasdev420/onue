import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "Availability & SLA | Amply",
  description: "Public API availability targets for Amply routing.",
};

export default function SlaPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-5 py-12 text-gray-700 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Availability &amp; SLA summary</h1>
        <p className="mb-6 text-sm leading-relaxed">
          This page summarizes <strong>target availability</strong> for the{" "}
          <strong>public routing API</strong> (<code className="font-mono text-xs">/api/v1/status</code>,{" "}
          <code className="font-mono text-xs">/api/v1/route</code>,{" "}
          <code className="font-mono text-xs">/api/v1/providers</code>) on Amply production. It does not
          constitute a separate contract unless you have a signed enterprise agreement.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">Target: 99.9% monthly uptime</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We target <strong>at least 99.9% uptime</strong> per calendar month for the public v1 endpoints,
          excluding scheduled maintenance announced in advance, force majeure, or issues in third-party
          infrastructure (cloud, DNS, your network). Uptime is measured from our hosting provider and
          synthetic probes (e.g.{" "}
          <code className="font-mono text-xs">npm run probe:synthetic</code> / GitHub Actions workflows).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">Latency</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We design routing so typical <strong>server-side compute</strong> for{" "}
          <code className="font-mono text-xs">POST /api/v1/route</code> stays within a{" "}
          <strong>~200 ms</strong> product bar on warm infrastructure; end-to-end HTTP time includes your
          network and cold starts. See <Link href="/docs" className="text-indigo-600 underline">docs</Link> and{" "}
          <Link href="/api/v1/status" className="text-indigo-600 underline">live status</Link>.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">Status</h2>
        <p className="mb-4 text-sm leading-relaxed">
          Operational visibility: <a href="/api/v1/status" className="text-indigo-600 underline">GET /api/v1/status</a>.
        </p>

        <p className="mt-12 text-xs text-gray-500">Last updated: March 30, 2026</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
