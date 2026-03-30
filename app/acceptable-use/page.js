import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "Acceptable Use Policy | Amply",
  description: "Fair use, anti-abuse, and catalog integrity for Amply.",
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-5 py-12 text-gray-700 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Acceptable Use Policy</h1>
        <p className="mb-6 text-sm leading-relaxed">
          This Acceptable Use Policy (&ldquo;AUP&rdquo;) applies to all users of Amply Services. It supplements
          the <Link href="/terms-of-service" className="text-indigo-600 underline">Terms of Service</Link>.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">1. Fair use of free API access</h2>
        <p className="mb-4 text-sm leading-relaxed">
          Free developer access is for <strong>building and running legitimate agent workloads</strong>. You
          may not use the API in ways that degrade service for others, including excessive automated load,
          credential stuffing, or attempts to bypass rate limits or authentication.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">2. No catalog manipulation</h2>
        <p className="mb-4 text-sm leading-relaxed">
          You may not falsify metrics, impersonate providers, or attempt to coerce routing outcomes through
          undisclosed side channels. Provider metrics must be accurate to the best of your knowledge when
          submitted for editorial review. Paid placement is <strong>disclosed in the catalog</strong>. You
          may not misrepresent organic vs sponsored placement.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">3. Competitive &amp; scraper conduct</h2>
        <p className="mb-4 text-sm leading-relaxed">
          Automated scraping of marketing pages or bulk export of the provider catalog for competitive
          redistribution may be restricted; prefer documented APIs. Competitive services may use the public
          API in good faith subject to this AUP and rate limits.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">4. Security &amp; law</h2>
        <p className="mb-4 text-sm leading-relaxed">
          No probing for vulnerabilities without permission, no malware, no unlawful content or activity.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">5. Enforcement</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We may throttle, suspend, or terminate access for violations. Repeat abuse may result in permanent
          blocks across keys and accounts.
        </p>

        <p className="mt-12 text-xs text-gray-500">Last updated: March 30, 2026</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
