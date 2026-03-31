import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "Changelog | Amply",
  description: "What shipped recently on the Amply routing API and site.",
};

const ENTRIES = [
  {
    date: "2026-03-29",
    title: "SDKs v0.1 (JS + Python)",
    body: "Published minimal clients for POST /api/v1/route in packages/amply-sdk and packages/amply-sdk-python. Docs and homepage tabs match the same examples.",
  },
  {
    date: "2026-03-29",
    title: "Public playground",
    body: "Homepage try-it box calls /api/playground with server-side keys and per-IP rate limits — no key in the browser.",
  },
  {
    date: "2026-03-29",
    title: "Pricing clarity",
    body: "Concrete design-partner quotas (10k free / 100k Pro) and overage copy on the homepage pricing table.",
  },
  {
    date: "2026-03-29",
    title: "Status tracing",
    body: "GET /api/v1/status returns request_id, compute_ms, catalog staleness diagnostics, and trace headers for APM-friendly logs.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Changelog</h1>
        <p className="mt-3 text-sm text-gray-600">
          High-level product notes. For API details see{" "}
          <Link href="/docs" className="font-medium text-indigo-600 underline">
            docs
          </Link>{" "}
          and{" "}
          <a href="/api/v1/status" className="font-medium text-indigo-600 underline">
            /api/v1/status
          </a>{" "}
          (<code className="font-mono text-xs">version</code>).
        </p>
        <ul className="mt-10 space-y-10">
          {ENTRIES.map((e) => (
            <li key={e.date + e.title} className="border-b border-gray-200 pb-10 last:border-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{e.date}</p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">{e.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{e.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-sm text-gray-500">
          Roadmap: Stripe metering, regional routing hints, and deeper LangChain helpers —{" "}
          <a href="mailto:support@useamply.com" className="font-medium text-indigo-600 underline">
            tell us what you need
          </a>
          .
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
