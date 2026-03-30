import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { getStripeListingPaymentUrl } from "@/app/lib/stripeListingUrls";

export const metadata = {
  title: "Get your product listed | Amply",
  description:
    "Put your vector, embedding, or inference product where agents and developers choose infrastructure. Machine-readable catalog and transparent placement.",
};

const LISTING_PRICE = "$249/mo";

const WHY = [
  {
    title: "Show up at decision time",
    body:
      "Amply sits in the routing path: builders call our API when a task needs a vector database, embedding model, or host. A listing puts your name next to live metrics, not just a static integrations page.",
  },
  {
    title: "Built for machines, not only humans",
    body:
      "Your entry is exposed in structured catalog and provider APIs, so agents and internal tools can pull comparable fields without scraping your site.",
  },
  {
    title: "Placement you can defend",
    body:
      "Paid listings are labeled in the public catalog and in GET /api/v1/providers. Routing scores still follow the metrics we publish. You are not buying a hidden rank bump.",
  },
];

const INCLUDED = [
  "Logo and one-line description on the public catalog",
  "Linked from GET /api/v1/providers with a clear placement label",
  "Editorial review and publication within about two business days after we confirm your details",
];

const STEPS = [
  "Review what is included and how placement works on this page.",
  "Complete secure checkout with Stripe (monthly subscription at the price shown on the checkout page).",
  "We email you at the address from checkout to collect what we need for the listing and answer questions.",
  "We publish to the catalog or reply if anything is still missing for the review.",
];

export default function ProvidersSalesPage() {
  const stripeUrl = getStripeListingPaymentUrl();

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
          <p className="text-sm font-medium text-indigo-600">For infrastructure vendors</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Get your product listed where agents pick infrastructure
          </h1>
          <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
            Amply is a routing layer for vector search, embeddings, and inference. When teams integrate
            us, your listing can appear alongside the same signals they use to compare providers: latency,
            cost hints, and published benchmarks. One public price:{" "}
            <strong className="text-gray-900">{LISTING_PRICE}</strong> for catalog placement, billed through
            Stripe.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {stripeUrl ? (
              <a
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center rounded-full bg-[#635bff] px-7 py-3.5 text-center text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              >
                Continue to secure checkout
              </a>
            ) : (
              <a
                href="mailto:support@useamply.com?subject=Catalog%20listing"
                className="inline-flex justify-center rounded-full bg-gray-900 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
              >
                Email to get listed
              </a>
            )}
            <Link
              href="/for-providers"
              className="inline-flex justify-center text-sm font-medium text-indigo-600 underline underline-offset-2 sm:px-3"
            >
              How Amply treats providers
            </Link>
          </div>

          {!stripeUrl && (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
              Live checkout is not wired in this environment. Use email above or{" "}
              <a href="mailto:support@useamply.com" className="font-semibold underline">
                support@useamply.com
              </a>
              .
            </p>
          )}
        </section>

        <section className="border-t border-gray-200/80 bg-white/60 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Why teams list on Amply</h2>
            <ul className="mt-10 space-y-10">
              {WHY.map((item) => (
                <li key={item.title}>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">What {LISTING_PRICE} includes</h2>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
            {INCLUDED.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="text-indigo-500" aria-hidden>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-gray-600">
            The routing API for developers stays separate: it is not metered per listing. You are buying
            visibility and a maintained catalog row, not API quota for your own customers.
          </p>
          <div className="mt-8 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 to-white p-6 sm:p-8">
            <p className="text-sm font-medium text-gray-900">See the live catalog</p>
            <p className="mt-2 text-sm text-gray-600">
              Browse{" "}
              <Link href="/catalog" className="font-semibold text-indigo-600 underline">
                /catalog
              </Link>{" "}
              or call{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-gray-800">
                GET /api/v1/providers
              </code>{" "}
              to see how placement is labeled today.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-200/80 bg-gray-50/80 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How it works</h2>
            <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base">
              {STEPS.map((step) => (
                <li key={step} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Your first week after checkout</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base">
            <li>
              We contact you at the email from Stripe, usually within one business day, for logo,
              one-line copy, and company details.
            </li>
            <li>
              After we have what we need, catalog updates typically go live within about two business
              days.
            </li>
          </ul>
        </section>

        <section className="border-t border-gray-200/80 bg-white/50 py-12 sm:py-14">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Case studies</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              We are lining up the first public write-ups with teams shipping on Amply. If you want
              co-marketing or a named story, email{" "}
              <a href="mailto:support@useamply.com" className="font-semibold text-indigo-600 underline">
                support@useamply.com
              </a>
              .
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ready to list?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 sm:text-base">
            Questions about categories, bulk deals, or custom billing:{" "}
            <a href="mailto:support@useamply.com" className="font-semibold text-indigo-600 underline">
              support@useamply.com
            </a>
            .
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {stripeUrl ? (
              <a
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-sm justify-center rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 sm:w-auto"
              >
                Continue to secure checkout
              </a>
            ) : (
              <a
                href="mailto:support@useamply.com?subject=Catalog%20listing"
                className="inline-flex w-full max-w-sm justify-center rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 sm:w-auto"
              >
                Email to get listed
              </a>
            )}
            <Link
              href="/pricing"
              className="text-sm font-medium text-indigo-600 underline underline-offset-2"
            >
              Full pricing page
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
