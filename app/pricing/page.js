import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { getStripeListingPaymentUrl } from "@/app/lib/stripeListingUrls";

export const metadata = {
  title: "Pricing | Amply",
  description:
    "Free for agent builders — unlimited fair-use routing. Providers: sponsorship and catalog listings.",
};

const SPONSOR_TIERS = [
  {
    name: "Basic listing",
    price: "$199/mo",
    bullets: [
      "Logo + one-line description on the public catalog",
      "Linked from GET /api/v1/providers with placement badge",
      "48h review after payment",
    ],
    cta: "Submit listing details",
    href: "/providers/join?tier=basic_listing",
  },
  {
    name: "Featured",
    price: "$499/mo",
    bullets: [
      "Everything in Basic",
      "Featured row on /catalog + homepage “supported by” rotation",
      "Quarterly metrics refresh collaboration",
    ],
    cta: "Submit listing details",
    href: "/providers/join?tier=featured",
    highlight: true,
  },
  {
    name: "Sponsored top-3 spotlight",
    price: "From $1.2k/mo",
    bullets: [
      "Reserved for category leaders — limited slots",
      "Co-marketing on agent-facing docs",
      "Direct line for catalog updates",
    ],
    cta: "Submit listing details",
    href: "/providers/join?tier=sponsored_top3",
  },
];

export default function PricingPage() {
  const stripeUrl = getStripeListingPaymentUrl();
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-center text-sm font-medium text-indigo-600">Pricing</p>
        <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Free for builders. Paid for providers.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-gray-600">
          Agent and developer routing API access stays <strong>free</strong>: no credit card, fair-use
          limits with abuse protection only. Companies pay for <strong>catalog placement</strong> and
          sponsorship — not for API quotas.
        </p>

        <section className="mt-16 rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 p-8 shadow-sm sm:p-10">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Developers &amp; agents — free forever
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base">
            Unlimited fair-use calls to <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">POST /api/v1/route</code>{" "}
            and <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">GET /api/v1/status</code>. We may throttle
            obvious abuse or require an API key — we do <strong>not</strong> meter normal agent workloads. No Stripe for API access.
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
            Providers &amp; infrastructure companies — get listed
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base">
            Appear where agents pick vector DBs, embeddings, and inference. Placement is labeled in the{" "}
            <Link href="/catalog" className="font-medium text-indigo-600 underline">
              public catalog
            </Link>{" "}
            and API — organic metrics and paid placement are disclosed.
          </p>

          {stripeUrl && (
            <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/90 p-6 text-center">
              <p className="text-sm font-medium text-violet-950">Provider listing — pay to get started</p>
              <p className="text-xs text-violet-900/85">
                One checkout for now. After payment,{" "}
                <Link href="/providers/join" className="font-semibold underline">
                  submit details
                </Link>{" "}
                with the <strong>same email</strong> so we can match you to the right tier.
              </p>
              <a
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-sm justify-center rounded-full bg-[#635bff] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 sm:max-w-none"
              >
                Pay with Stripe
              </a>
            </div>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {SPONSOR_TIERS.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                  t.highlight
                    ? "border-indigo-300 bg-white ring-2 ring-indigo-200"
                    : "border-gray-200 bg-white"
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                <p className="mt-2 text-2xl font-semibold text-indigo-600">{t.price}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-indigo-500" aria-hidden>
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.href}
                  className={`mt-6 inline-flex justify-center rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                    t.highlight
                      ? "bg-gradient-to-r from-[#3953e6] to-[#36aeea] text-white hover:brightness-110"
                      : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-gray-500">
            {stripeUrl ? (
              <>
                Env:{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">NEXT_PUBLIC_STRIPE_LISTING_URL</code>.
                Custom tiers or invoices:{" "}
                <a href="mailto:support@useamply.com" className="text-indigo-600 underline">
                  support@useamply.com
                </a>
                .
              </>
            ) : (
              <>
                Add one Stripe Payment Link in Vercel:{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">NEXT_PUBLIC_STRIPE_LISTING_URL</code>{" "}
                — see <code className="rounded bg-gray-100 px-1 font-mono">env.example</code>.
              </>
            )}
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-900">Optional: priority routing add-on</p>
          <p className="mt-2 text-sm text-gray-600">
            If you need dedicated capacity or private poison, that&apos;s a separate enterprise
            conversation — not required for normal API usage.
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
