import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";

export const metadata = {
  title: "Pricing | Amply",
  description: "Amply API pricing: Free, Pro, and Enterprise tiers for agent routing at scale.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-gray-600">
          Transparent tiers for teams routing agent traffic through Amply. Start free; scale when your call volume grows.
        </p>

        <div className="mt-12 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90">
                <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6"> </th>
                <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6">Free</th>
                <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6">Pro</th>
                <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900 sm:px-6">API calls / month</td>
                <td className="px-4 py-3.5 sm:px-6">Included free tier</td>
                <td className="px-4 py-3.5 sm:px-6">Higher limits + burst</td>
                <td className="px-4 py-3.5 sm:px-6">Custom volume &amp; commits</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900 sm:px-6">Support</td>
                <td className="px-4 py-3.5 sm:px-6">Community &amp; docs</td>
                <td className="px-4 py-3.5 sm:px-6">Email (business hours)</td>
                <td className="px-4 py-3.5 sm:px-6">Dedicated + Slack</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900 sm:px-6">SLA</td>
                <td className="px-4 py-3.5 sm:px-6">Best effort</td>
                <td className="px-4 py-3.5 sm:px-6">Standard</td>
                <td className="px-4 py-3.5 sm:px-6">Custom (99.9%+)</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900 sm:px-6">Deployment</td>
                <td className="px-4 py-3.5 sm:px-6">Amply Cloud</td>
                <td className="px-4 py-3.5 sm:px-6">Amply Cloud</td>
                <td className="px-4 py-3.5 sm:px-6">VPC, SSO, audit logs</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-sm leading-relaxed text-gray-600">
          Exact call allowances and Pro pricing are finalized with billing integration.{" "}
          <Link href="/about" className="font-medium text-indigo-600 underline">
            Talk to us
          </Link>{" "}
          for Enterprise and design-partner terms.
        </p>

        <div className="mt-14 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center">
          <p className="font-semibold text-gray-900">Ready to integrate?</p>
          <p className="mt-2 text-sm text-gray-600">
            Get a key from the dashboard and follow the{" "}
            <Link href="/docs" className="font-medium text-indigo-600 underline">
              docs
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
