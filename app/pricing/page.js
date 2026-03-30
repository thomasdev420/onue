import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import PricingTable from "@/app/components/marketing/PricingTable";

export const metadata = {
  title: "Pricing | Amply",
  description: "Amply API pricing: Free, Pro, and Enterprise tiers with concrete routing call quotas for design partners.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-[#FAF9F6] to-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-gray-600">
          Concrete monthly routing quotas for design partners. Stripe checkout and automated overage billing are next — during
          the pilot we may invoice overages manually.
        </p>

        <div className="mt-12">
          <PricingTable />
        </div>

        <div className="mt-14 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center">
          <p className="font-semibold text-gray-900">Ready to integrate?</p>
          <p className="mt-2 text-sm text-gray-600">
            Start with the{" "}
            <Link href="/docs/quickstart" className="font-medium text-indigo-600 underline">
              quickstart
            </Link>
            , then open the{" "}
            <Link href="/docs" className="font-medium text-indigo-600 underline">
              full docs
            </Link>
            .
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
