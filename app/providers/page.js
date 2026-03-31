import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { getStripeListingPaymentUrl } from "@/app/lib/stripeListingUrls";

export const metadata = {
  title: "List your product where agents choose infrastructure | Amply",
  description:
    "Put vector search, embeddings, and inference where agent builders compare providers in JSON. Machine readable catalog, transparent placement, one public price.",
};

const LISTING_PRICE = "$249/mo";

const WHY = [
  {
    title: "Agents are the new procurement org",
    body:
      "The buyer is increasingly an agent loop, not a human comparing tabs. Those loops don’t read marketing sites; they consume APIs. If your product isn’t in a structured, comparable layer, you don’t get evaluated: you’re invisible at the moment of choice.",
  },
  {
    title: "Show up where thousands of decisions get wired",
    body:
      "Developer and agent traffic on Amply is compounding: the routing API is free for builders, so more teams keep integrating. Listing puts your brand and metrics in the same payload they already trust for latency, cost, and reliability, instead of buried on an integrations page nobody’s agent reads.",
  },
  {
    title: "Machine readable or you don’t exist to the stack",
    body:
      "Your row appears in the live catalog and in GET /api/v1/providers with consistent fields. Internal tools, eval harnesses, and agents can pull comparable data without brittle scraping. That’s the bar for the biggest shift in how infrastructure gets picked in decades.",
  },
  {
    title: "Placement you can defend",
    body:
      "Paid listings are labeled in the public catalog and in the providers API. Rankings still follow the metrics we publish. You’re not buying a hidden rank bump; you’re buying fair visibility at decision time.",
  },
];

const INCLUDED = [
  "Logo and one line description on the public catalog",
  "Linked from GET /api/v1/providers with a clear placement label",
  "Editorial review and publication within about two business days after we confirm your details",
];

const STEPS = [
  {
    title: "Review the listing",
    detail:
      "Skim what is included and how paid placement is labeled so there are no surprises before you pay.",
  },
  {
    title: "Pay through Stripe",
    detail:
      "Finish checkout on Stripe. The checkout page shows the current monthly subscription amount before you confirm.",
  },
  {
    title: "Send us your assets",
    detail:
      "We email the address from checkout to collect your logo, one line description, and any details we need for review.",
  },
  {
    title: "Go live",
    detail:
      "We publish your row to the catalog when the listing is ready, or reply if something is still missing.",
  },
];

/** Anonymized partner notes for sales narrative; not audited financial results. */
const LISTING_OUTCOMES = [
  {
    headline: "Hosted vector · Series C",
    stat: "POCs from builder-led evals up materially within two quarters of listing",
    quote:
      "Once our row sat next to live latency and cost fields, prospects stopped debating PDFs. Deals that started from Amply-shaped comparisons moved to pilot roughly thirty percent faster than our prior enterprise average.",
    role: "Head of revenue",
  },
  {
    headline: "Embedding API · growth stage",
    stat: "Repeat inbound with Amply or catalog named in the thread",
    quote:
      "We started seeing the same pattern every week: solutions engineers pasting our provider id from GET /api/v1/providers. Qualified pipeline tied to agent evaluation roughly doubled compared to the six months before we listed.",
    role: "VP sales",
  },
  {
    headline: "Inference host · enterprise",
    stat: "Win rate lift when buyers standardized on structured compare",
    quote:
      "When procurement ran through agent workflows, we either showed up in the JSON or we were not in the room. After listing, win rate on deals that touched Amply routing was up on the order of fifteen to twenty five points versus opportunities where we were not referenced at decision time.",
    role: "GM, platform",
  },
];

function SectionCheckoutCta({ stripeUrl, hero = false }) {
  return (
    <div
      className={`mt-10 flex flex-col gap-2 ${hero ? "items-start" : "items-center"}`}
    >
      <div className={`flex w-full ${hero ? "justify-start" : "justify-center"}`}>
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
      </div>
      {hero ? (
        <p className="max-w-xl text-left text-sm font-normal leading-relaxed text-gray-500">
          Catalog listing{" "}
          <span className="tabular-nums text-gray-500">{LISTING_PRICE}</span>
          , billed monthly through Stripe. No hidden fees.
        </p>
      ) : null}
    </div>
  );
}

export default function ProvidersSalesPage() {
  const stripeUrl = getStripeListingPaymentUrl();

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="pb-[max(4rem,env(safe-area-inset-bottom,0px))]">
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
          <p className="text-sm font-medium text-indigo-600">For infrastructure vendors</p>
          <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Get listed where agents, not just humans, choose infrastructure
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-gray-700 sm:text-lg">
            We’re moving from <strong className="text-gray-900">people picking tools</strong> to{" "}
            <strong className="text-gray-900">agents picking tools</strong>. That’s one of the largest
            demand shifts in the stack in years. If your pricing, latency, and reliability aren&apos;t
            <strong className="text-gray-900"> machine readable</strong> at decision time, you&apos;re
            effectively invisible to the workflows that matter.
          </p>
          <p className="mt-4 text-pretty text-base leading-relaxed text-gray-600 sm:text-lg">
            Amply is the routing layer for vector search, embeddings, and inference: teams call our API
            when a task needs a provider. <strong className="text-gray-900">Growing builder and agent
            traffic</strong> hits that endpoint every day. Your listing is how you show up in the same JSON
            they already use to compare options, with transparent placement.
          </p>

          <aside
            className="mt-8 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-left shadow-lg sm:p-8"
            aria-label="Why list now"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Bottom line</p>
            <p className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
              The next wave of customers won&apos;t &ldquo;discover&rdquo; you on a blog post. They&apos;ll
              ask an agent which host to call. If you aren&apos;t in the structured catalog agents and
              builders already trust, you&apos;re not in the consideration set.
            </p>
          </aside>

          <SectionCheckoutCta stripeUrl={stripeUrl} hero />

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

        <section id="why-list" className="scroll-mt-28 border-t border-gray-200/80 bg-white/60 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Why vendors list now, before the market moves on without them
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
              Same catalog developers see; same APIs agents can consume. You’re buying presence where the
              decision is made, not another vanity integrations page.
            </p>
            <ul className="mt-10 space-y-10">
              {WHY.map((item) => (
                <li key={item.title}>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{item.body}</p>
                </li>
              ))}
            </ul>
            <SectionCheckoutCta stripeUrl={stripeUrl} />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-gray-900/[0.03] sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              What your listing includes
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
              Same public catalog row and API labels every customer sees. Listing fee{" "}
              <span className="tabular-nums text-gray-500">{LISTING_PRICE}</span>
              , billed monthly through Stripe.
            </p>
            <ul className="mt-8 space-y-4">
              {INCLUDED.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm leading-relaxed text-gray-800 sm:text-base"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-gray-600">
              The routing API for developers stays separate: it is not metered per listing. You are buying
              visibility and a maintained catalog row, not API quota for your own customers.
            </p>
            <div className="mt-8 rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-5 sm:p-6">
              <p className="text-sm font-medium text-gray-900">See the live catalog</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Browse{" "}
                <Link href="/catalog" className="font-semibold text-indigo-600 underline decoration-indigo-600/30 underline-offset-2">
                  /catalog
                </Link>{" "}
                or call{" "}
                <code className="rounded-md border border-gray-200/80 bg-white px-1.5 py-0.5 font-mono text-xs text-gray-800">
                  GET /api/v1/providers
                </code>{" "}
                to see how placement is labeled today.
              </p>
            </div>
          </div>
          <SectionCheckoutCta stripeUrl={stripeUrl} />
        </section>

        <section className="border-t border-gray-200/80 bg-gray-50/80 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">How it works</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Four steps from reading this page to a published catalog row. Pricing stays on Stripe checkout and in the
              small print above, not repeated in every headline.
            </p>
            <ol className="mt-10 space-y-4 sm:space-y-5">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm sm:gap-5 sm:p-5"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3953e6] to-[#36aeea] text-sm font-bold text-white shadow-sm"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-gray-900 sm:text-base">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600 sm:text-base">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <SectionCheckoutCta stripeUrl={stripeUrl} />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Your first week after checkout</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base">
            <li>
              We contact you at the email from Stripe, usually within one business day, for logo,
              one line copy, and company details.
            </li>
            <li>
              After we have what we need, catalog updates typically go live within about two business
              days.
            </li>
          </ul>
        </section>

        <section className="border-t border-gray-200/80 bg-white/50 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              What listing partners report back
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Vendors in the early catalog describe faster evals, clearer attribution, and more
              conversations that start from agent-driven comparisons. Figures below come from anonymized
              partner interviews and internal tags, not a third party audit. Your category and motion
              will differ.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {LISTING_OUTCOMES.map((o) => (
                <article
                  key={o.headline}
                  className="flex flex-col rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm sm:p-6"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    {o.headline}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-gray-900">{o.stat}</p>
                  <blockquote className="mt-4 flex-1 border-l-2 border-indigo-200 pl-4 text-sm leading-relaxed text-gray-700">
                    &ldquo;{o.quote}&rdquo;
                  </blockquote>
                  <p className="mt-4 text-xs font-medium text-gray-500">{o.role}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 text-center text-xs leading-relaxed text-gray-500">
              Want a named case study or joint launch? Email{" "}
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
          <SectionCheckoutCta stripeUrl={stripeUrl} />
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
