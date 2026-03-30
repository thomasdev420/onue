import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "Privacy Policy | Amply",
  description: "How Amply collects and uses information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-5 py-12 text-gray-700 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mb-6 text-sm leading-relaxed">
          Amply respects your privacy. This policy describes what we collect, why, and your rights. It
          applies alongside our{" "}
          <Link href="/terms-of-service" className="text-indigo-600 underline">Terms of Service</Link>.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">1. Information we collect</h2>
        <ul className="mb-4 ml-5 list-disc space-y-2 text-sm">
          <li>
            <strong>Account &amp; auth:</strong> e.g. email, name, when you sign in (including OAuth
            profiles).
          </li>
          <li>
            <strong>API &amp; product use:</strong> request metadata, keys (hashed for user keys), rate-limit
            counters, and operational logs, including structured logs for support and abuse prevention.
          </li>
          <li>
            <strong>Provider leads:</strong> when you submit the &ldquo;List your service&rdquo; form, we
            process company name, email, product name, and optional message for sales and fulfillment.
          </li>
          <li>
            <strong>Technical data:</strong> IP, user agent, approximate region via edge/CDN headers where
            applicable.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">2. How we use information</h2>
        <ul className="mb-4 ml-5 list-disc space-y-2 text-sm">
          <li>Provide and operate the Services (routing API, dashboard, catalog).</li>
          <li>Billing and fulfillment for provider listings.</li>
          <li>Security, fraud prevention, and compliance with law.</li>
          <li>Product analytics in aggregate form where possible.</li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">3. Sharing</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We use infrastructure vendors (e.g. hosting, database, email) as processors. We do not sell your
          personal information. We may disclose data if required by law or to protect rights and safety.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">4. Retention</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We retain data as long as needed for the purposes above and legal obligations. Provider lead data may
          be kept for the commercial relationship plus a reasonable period.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">5. Your rights</h2>
        <p className="mb-4 text-sm leading-relaxed">
          Depending on jurisdiction you may have rights to access, correct, delete, or object. Contact us
          below. EU/UK users may lodge a complaint with a supervisory authority.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">6. Children</h2>
        <p className="mb-4 text-sm leading-relaxed">
          Services are not directed at children under 13 (or higher age where required).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">7. Changes</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We may update this policy; material changes will be posted here with an updated date.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">8. Contact</h2>
        <p className="mb-4 text-sm leading-relaxed">
          <a href="mailto:support@useamply.com" className="text-indigo-600 underline">
            support@useamply.com
          </a>
        </p>

        <p className="mt-12 text-xs text-gray-500">Last updated: March 30, 2026</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
