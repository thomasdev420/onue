import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import Link from "next/link";
import ProviderJoinForm from "./ProviderJoinForm";

export const metadata = {
  title: "List your service | Amply",
  description: "Submit provider details for catalog review — sponsorship tiers and transparent placement.",
};

export default async function ProviderJoinPage({ searchParams }) {
  const sp = await searchParams;
  const tierRaw = typeof sp?.tier === "string" ? sp.tier : "";
  const initialTier = ["basic_listing", "featured", "sponsored_top3"].includes(tierRaw)
    ? tierRaw
    : "unsure";

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-sm font-medium text-indigo-600">Provider onboarding</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          List your service
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          Tell us who you are and which tier you want. We&apos;ll follow up with payment (Stripe) or an
          invoice, then update <Link href="/catalog" className="text-indigo-600 underline">the catalog</Link>{" "}
          within ~48h after confirmation. Metrics used for routing stay auditable — see{" "}
          <Link href="/for-providers" className="text-indigo-600 underline">
            For providers
          </Link>
          .
        </p>
        <div className="mt-10">
          <ProviderJoinForm initialTier={initialTier} />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
