import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "Terms of Service | Amply",
  description: "Amply Terms of Service: developer API usage and provider listings.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-2xl px-5 py-12 text-gray-600 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Amply Terms of Service</h1>
        <p className="mb-6 text-sm leading-relaxed">
          These Terms govern use of the websites, APIs, and related services operated by Amply
          (&ldquo;Amply,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) at <strong>useamply.com</strong> and
          subdomains (&ldquo;Services&rdquo;). By accessing or using the Services you agree to these Terms,
          our <Link href="/privacy-policy" className="text-indigo-600 underline">Privacy Policy</Link>, and{" "}
          <Link href="/acceptable-use" className="text-indigo-600 underline">Acceptable Use Policy</Link>.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">1. Two audiences</h2>
        <ul className="mb-4 ml-5 list-disc space-y-2 text-sm">
          <li>
            <strong>Developers &amp; agents</strong> may use the <strong>routing API</strong>{" "}
            (<code className="font-mono text-xs">/api/v1/*</code>) under the free, fair-use model described
            below. No payment is required for ordinary integration and testing.
          </li>
          <li>
            <strong>Providers &amp; companies</strong> may purchase <strong>catalog placement</strong>,{" "}
            sponsorship, or other commercial packages. Those relationships are subject to separate order
            forms, invoices, or checkout flows and may include additional confidentiality or SLA terms.
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">2. Free developer / agent use</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We provide <strong>no-fee access</strong> to the routing API for building and running agents, subject
          to fair use and the Acceptable Use Policy. We may require registration, API keys, or rate limits to
          protect reliability. We may change technical limits or require upgraded paths for abuse, but we do
          not charge <em>per-call metered fees</em> for standard developer usage as described on our{" "}
          <Link href="/pricing" className="text-indigo-600 underline">Pricing</Link> page unless we notify you
          in advance of a materially different commercial model.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">3. Provider listings &amp; payments</h2>
        <p className="mb-4 text-sm leading-relaxed">
          Paid <strong>catalog listings</strong> and sponsorships are <strong>visibility and go-to-market</strong>{" "}
          products. They do <strong>not</strong>, by themselves, guarantee inclusion in any particular routing
          outcome. Scoring is explained in our documentation and uses metrics we publish. Placement type is
          labeled in the <Link href="/catalog" className="text-indigo-600 underline">public catalog</Link> and
          API. Fees, renewals, and taxes are as stated at checkout or in an order form. Unless otherwise
          stated, listing fees are <strong>non-refundable</strong> after we begin fulfillment (e.g. review
          or publication), except where required by law.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">4. Accounts &amp; API keys</h2>
        <p className="mb-4 text-sm leading-relaxed">
          You are responsible for credentials and for activity under your account. Do not share service-role
          or production secrets in client-side code.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">5. Intellectual property</h2>
        <p className="mb-4 text-sm leading-relaxed">
          The Services, brand, and documentation are owned by Amply or licensors. You receive a limited,
          non-exclusive licence to use the APIs as intended. Feedback you give us may be used without
          restriction.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">6. Disclaimers</h2>
        <p className="mb-4 text-sm leading-relaxed">
          THE SERVICES ARE PROVIDED &ldquo;AS IS.&rdquo; ROUTING RECOMMENDATIONS ARE INFORMATIONAL; YOU ARE
          RESPONSIBLE FOR YOUR PRODUCTION CHOICES AND THIRD-PARTY CONTRACTS. See also our{" "}
          <Link href="/sla" className="text-indigo-600 underline">SLA summary</Link> for availability targets.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">7. Limitation of liability</h2>
        <p className="mb-4 text-sm leading-relaxed">
          To the maximum extent permitted by law, Amply is not liable for indirect, consequential, special,
          or punitive damages, or for loss of profits, data, or goodwill.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">8. Changes &amp; termination</h2>
        <p className="mb-4 text-sm leading-relaxed">
          We may modify these Terms; we will post updates here. Continued use after changes constitutes
          acceptance. We may suspend access for material breach or operational necessity.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">9. Contact</h2>
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
