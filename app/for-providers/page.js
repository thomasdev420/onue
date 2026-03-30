import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { getListingPayLink, isListingCheckoutConfigured } from "@/app/lib/stripeListingUrls";

export const metadata = {
  title: "For providers | Amply",
  description:
    "Reach every agent that routes vector, embedding, and inference workloads. Transparent catalog listings.",
};

export default function ForProvidersPage() {
  const listingPay = getListingPayLink();
  const checkoutReady = isListingCheckoutConfigured();
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-sm font-medium text-indigo-600">For infrastructure vendors</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Be in the path of agent routing decisions
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600">
          Amply exposes a fast, machine-readable API that scores providers using public metrics. Agent
          builders call it on every loop. Your customers discover you when the model chooses a vector
          DB, embedding API, or inference host, not buried in a blog post.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-indigo-600">1.</span>
            <span>
              <strong>Transparent placement.</strong> Paid listings are labeled in{" "}
              <Link href="/catalog" className="text-indigo-600 underline">
                /catalog
              </Link>{" "}
              and in <code className="font-mono text-xs">GET /api/v1/providers</code>. Organic entries
              stay metrics-only.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-indigo-600">2.</span>
            <span>
              <strong>No pay-to-win routing.</strong> Listings buy visibility and editorial support,
              not a hidden score boost. Scoring still uses the metrics we publish.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-indigo-600">3.</span>
            <span>
              <strong>Simple commercial motion.</strong> Monthly listings with Stripe (or invoice for
              larger packages). Submit once, we review within ~48h.
            </span>
          </li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={listingPay.href}
            className="inline-flex rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            {checkoutReady ? "Get your product listed" : "List your service"}
          </Link>
          <Link
            href="/pricing#providers"
            className="inline-flex rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            View pricing
          </Link>
          {checkoutReady && (
            <Link
              href="/providers/join"
              className="inline-flex rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              After checkout, submit details
            </Link>
          )}
        </div>

        <blockquote className="mt-14 rounded-2xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-700 shadow-sm">
          <p>
            &ldquo;Being in the routing catalog put us in front of agent teams who were already
            evaluating hosted vector search, clearer than another generic integration list.&rdquo;
          </p>
          <footer className="mt-3 text-xs font-medium text-gray-500">
            Vector DB partner (design partner quote; name available on request)
          </footer>
        </blockquote>
      </main>
      <MarketingFooter />
    </div>
  );
}
