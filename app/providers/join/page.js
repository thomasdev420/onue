import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import Link from "next/link";
import { getStripeListingPaymentUrl } from "@/app/lib/stripeListingUrls";
import ProviderJoinForm from "./ProviderJoinForm";

const LISTING_PRICE = "$249/mo";

export const metadata = {
  title: "List your service | Amply",
  description: "Submit provider details for catalog review, $249/mo listing, transparent placement.",
};

export default function ProviderJoinPage() {
  const stripeUrl = getStripeListingPaymentUrl();
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-sm font-medium text-indigo-600">Provider onboarding</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          List your service
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          One catalog listing at <strong>$249/mo</strong>.{" "}
          {stripeUrl
            ? "Checkout is only via Stripe. Open the secure payment page, then complete the form below with the same email."
            : "We'll follow up with payment instructions, then you can submit the details here."}{" "}
          We&apos;ll update{" "}
          <Link href="/catalog" className="text-indigo-600 underline">the catalog</Link> within ~48h after
          confirmation. Metrics used for routing stay auditable; see{" "}
          <Link href="/for-providers" className="text-indigo-600 underline">
            For providers
          </Link>
          .
        </p>
        {stripeUrl && (
          <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50/90 p-6 text-center">
            <p className="text-sm font-medium text-violet-950">Pay {LISTING_PRICE} on Stripe first</p>
            <a
              href={stripeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full max-w-md justify-center rounded-full bg-[#635bff] px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
            >
              Open Stripe checkout
            </a>
            <p className="mt-3 text-xs text-violet-900/85">Then use the same email in the form below.</p>
          </div>
        )}
        <div className="mt-10">
          <ProviderJoinForm />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
