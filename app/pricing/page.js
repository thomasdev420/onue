import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { getListingPayLink, isListingCheckoutConfigured } from "@/app/lib/stripeListingUrls";

export const metadata = {
  title: "Pricing | Amply",
  description:
    "Free for agent builders: unlimited fair-use routing. Providers: one catalog listing price.",
};

const LISTING_PRICE = "$249/mo";

const LISTING = {
  name: "Catalog listing",
  price: LISTING_PRICE,
  bullets: [
    "Logo + one-line description on the public catalog",
    "Linked from GET /api/v1/providers with placement badge",
    "48h review after payment",
  ],
};

export default function PricingPage() {
  const listingPay = getListingPayLink();
  const checkoutReady = isListingCheckoutConfigured();
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-center text-sm font-medium text-indigo-600">Pricing</p>
        <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Free for builders. One listing price for providers.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-gray-600">
          Agent and developer routing API access stays <strong>free</strong>: no credit card, fair-use
          limits with abuse protection only. Companies pay a single monthly rate for{" "}
          <strong>catalog placement</strong>, not for API quotas.
        </p>

        <section className="mt-16 rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 p-8 shadow-sm sm:p-10">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Developers &amp; agents: free forever
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base">
            Unlimited fair-use calls to <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">POST /api/v1/route</code>{" "}
            and <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">GET /api/v1/status</code>. We may throttle
            obvious abuse or require an API key. We do <strong>not</strong> meter normal agent workloads. No Stripe for API access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/docs"
              className="inline-flex rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Read the docs
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Get an API key
            </Link>
          </div>
        </section>

        <section className="mt-16" id="providers">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Providers &amp; infrastructure companies: get listed
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base">
            Appear where agents pick vector DBs, embeddings, and inference. Placement is labeled in the{" "}
            <Link href="/catalog" className="font-medium text-indigo-600 underline">
              public catalog
            </Link>{" "}
            and API. Organic metrics and paid placement are disclosed.
          </p>

          <div className="mx-auto mt-10 max-w-lg">
            <div className="flex flex-col rounded-2xl border border-indigo-300 bg-white p-8 shadow-sm ring-2 ring-indigo-200">
              <h3 className="text-lg font-bold text-gray-900">{LISTING.name}</h3>
              <p className="mt-2 text-2xl font-semibold text-indigo-600">{LISTING.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {LISTING.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-indigo-500" aria-hidden>
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={listingPay.href}
                className="mt-6 inline-flex justify-center rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-4 py-2.5 text-center text-sm font-semibold text-white hover:brightness-110"
              >
                Get your product listed
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-gray-500">
            {checkoutReady ? (
              <>
                Env:{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">NEXT_PUBLIC_STRIPE_LISTING_URL</code>.
                Custom billing:{" "}
                <a href="mailto:support@useamply.com" className="text-indigo-600 underline">
                  support@useamply.com
                </a>
                .
              </>
            ) : (
              <>
                Add your Stripe Payment Link in Vercel:{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">NEXT_PUBLIC_STRIPE_LISTING_URL</code>{" "}
                See <code className="rounded bg-gray-100 px-1 font-mono">env.example</code>.
              </>
            )}
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-900">Optional: priority routing add-on</p>
          <p className="mt-2 text-sm text-gray-600">
            If you need dedicated capacity or private poison, that&apos;s a separate enterprise
            conversation, not required for normal API usage.
          </p>
          <a
            href="mailto:support@useamply.com?subject=Enterprise%20routing"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 underline"
          >
            Email support@useamply.com
          </a>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
