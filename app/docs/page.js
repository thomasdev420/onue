import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import { AMPLY_PRODUCT_VERSION, amplyVersionLabel } from "@/app/lib/amplyProductVersion";

export const metadata = {
  title: "Documentation | Amply",
  description:
    "Amply routing API: authentication, endpoints, OpenAPI, and SDK roadmap for agent integrations.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">
        <p className="text-sm font-medium text-indigo-600">Developer documentation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Amply API
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600">
          Current release:{" "}
          <code className="rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-sm">{amplyVersionLabel()}</code> — aligned
          with <a className="font-medium text-indigo-600 underline" href="/api/v1/status">GET /api/v1/status</a>.
        </p>

        <nav
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-700 shadow-sm"
          aria-label="On this page"
        >
          <p className="font-semibold text-gray-900">On this page</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 marker:text-indigo-500">
            <li>
              <a className="hover:text-indigo-700" href="#overview">
                Overview
              </a>
            </li>
            <li>
              <a className="hover:text-indigo-700" href="#auth">
                Authentication
              </a>
            </li>
            <li>
              <a className="hover:text-indigo-700" href="#endpoints">
                Endpoints
              </a>
            </li>
            <li>
              <a className="hover:text-indigo-700" href="#openapi">
                OpenAPI
              </a>
            </li>
            <li>
              <Link className="hover:text-indigo-700" href="/docs/quickstart">
                Quickstart
              </Link>
            </li>
            <li>
              <a className="hover:text-indigo-700" href="#sdks">
                SDKs
              </a>
            </li>
            <li>
              <a className="hover:text-indigo-700" href="#limits">
                Limits & errors
              </a>
            </li>
          </ul>
        </nav>

        <section id="overview" className="scroll-mt-28 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            Amply exposes a single decision endpoint: you send a natural-language <strong>task</strong> (plus optional
            workload hints), and receive a ranked recommendation with economics, latency signals, and a machine-readable{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-[0.9em]">why</code>. Integrate from any stack with{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-[0.9em]">fetch</code>,{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-[0.9em]">curl</code>, or the official SDKs (v0.1) below. Start with
            the{" "}
            <Link className="font-medium text-indigo-600 underline" href="/docs/quickstart">
              quickstart guide
            </Link>
            .
          </p>
          <p className="mt-4 leading-relaxed text-gray-700">
            Base URL (production): <code className="break-all rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">https://www.useamply.com/api/v1</code>
          </p>
        </section>

        <section id="auth" className="scroll-mt-28 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">Authentication</h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            Send a Bearer token on <code className="font-mono text-sm">POST /api/v1/route</code>:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-slate-950 p-4 font-mono text-sm text-slate-200">
            Authorization: Bearer YOUR_API_KEY
          </pre>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-gray-700">
            <li>
              <strong>User keys</strong> — Sign in and create keys in the{" "}
              <Link className="font-medium text-indigo-600 underline" href="/dashboard/api-keys">
                dashboard
              </Link>
              . Requires Supabase + <code className="font-mono text-xs">database_setup_amply_api_keys.sql</code> applied.
              Secrets are stored as SHA-256 only; the full key is shown once at creation.
            </li>
            <li>
              <strong>Server keys</strong> — Comma-separated <code className="font-mono text-xs">AMPLY_API_KEYS</code>{" "}
              (ops / shared secrets). If set, every request must present a valid env key <em>or</em> a valid user key.
            </li>
            <li>
              <strong>Require Bearer</strong> — Set <code className="font-mono text-xs">AMPLY_REQUIRE_API_KEY=1</code> to
              reject anonymous requests when you have no <code className="font-mono text-xs">AMPLY_API_KEYS</code> (e.g.
              production with user keys only).
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            If nothing requires auth (local dev), requests without <code className="font-mono">Authorization</code> may
            still succeed. Check{" "}
            <a className="font-medium text-indigo-600" href="/api/v1/status">
              /api/v1/status
            </a>{" "}
            for <code className="font-mono">auth_mode</code> and{" "}
            <code className="font-mono">diagnostics.user_api_keys_store_ready</code>.
          </p>
        </section>

        <section id="endpoints" className="scroll-mt-28 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">Endpoints</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/90">
                  <th className="px-4 py-3 font-semibold text-gray-900">Method</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Path</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="px-4 py-3 font-mono text-indigo-600">POST</td>
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">/api/v1/route</td>
                  <td className="px-4 py-3">Recommend a provider for a task</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-indigo-600">GET</td>
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">/api/v1/status</td>
                  <td className="px-4 py-3">Health, version, auth mode, catalog diagnostics</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-indigo-600">GET</td>
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">/api/v1/openapi</td>
                  <td className="px-4 py-3">OpenAPI 3 JSON document</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-indigo-600">GET</td>
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">/api/v1/providers</td>
                  <td className="px-4 py-3">Public provider snapshot</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="openapi" className="scroll-mt-28 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">OpenAPI</h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            The machine-readable contract lives at{" "}
            <a className="font-medium text-indigo-600 underline" href="/api/v1/openapi">
              /api/v1/openapi
            </a>
            . Import it into Postman, Insomnia, or codegen tools. Spec version matches{" "}
            <code className="rounded bg-gray-100 px-1 font-mono">{AMPLY_PRODUCT_VERSION}</code>.
          </p>
        </section>

        <section id="sdks" className="scroll-mt-28 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">SDKs (v0.1)</h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            Thin official clients around <code className="rounded bg-gray-100 px-1 font-mono text-sm">POST /api/v1/route</code>. Source
            lives in the monorepo; publish to npm/PyPI when you&apos;re ready. Same examples as the{" "}
            <Link className="font-medium text-indigo-600 underline" href="/docs/quickstart">
              quickstart
            </Link>
            .
          </p>
          <ul className="mt-4 space-y-3 rounded-xl border border-indigo-200/90 bg-indigo-50/40 p-5 text-sm leading-relaxed text-gray-800">
            <li>
              <strong>JavaScript / TypeScript</strong> — package name <code className="font-mono">amply-sdk</code>
              <br />
              <code className="mt-1 inline-block text-xs">npm install amply-sdk</code> ·{" "}
              <a
                className="font-medium text-indigo-600 underline"
                href="https://github.com/thomasdev420/onue/tree/main/packages/amply-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                packages/amply-sdk
              </a>
            </li>
            <li>
              <strong>Python</strong> — package name <code className="font-mono">amply-sdk</code> (stdlib HTTP)
              <br />
              <code className="mt-1 inline-block text-xs">pip install amply-sdk</code> (after publish) ·{" "}
              <a
                className="font-medium text-indigo-600 underline"
                href="https://github.com/thomasdev420/onue/tree/main/packages/amply-sdk-python"
                target="_blank"
                rel="noopener noreferrer"
              >
                packages/amply-sdk-python
              </a>
            </li>
          </ul>
        </section>

        <section id="limits" className="scroll-mt-28 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">Limits & errors</h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            Optional per-IP rate limits may be enabled via{" "}
            <code className="font-mono text-sm">AMPLY_V1_RATE_LIMIT_PER_MIN</code>. When active, expect{" "}
            <code className="font-mono">429</code> responses. Invalid or missing auth returns{" "}
            <code className="font-mono">401</code> if API keys are required.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Operational status: <a href="/api/v1/status">/api/v1/status</a> ·{" "}
            <Link className="font-medium text-indigo-600" href="/pricing">
              Pricing & quotas
            </Link>
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
