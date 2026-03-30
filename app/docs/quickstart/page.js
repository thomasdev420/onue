import Link from "next/link";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import LiveProvidersPreview from "@/app/components/marketing/LiveProvidersPreview";
import { amplyVersionLabel } from "@/app/lib/amplyProductVersion";
import { snippetCurl, snippetPython, snippetTypeScript } from "@/app/lib/marketing/routeCodeSnippets";

const BASE = "https://www.useamply.com";

export const metadata = {
  title: "Quickstart | Amply",
  description: "Get an API key and your first POST /api/v1/route in under 60 seconds.",
};

export default function QuickstartPage() {
  const curl = snippetCurl(BASE);
  const ts = snippetTypeScript(BASE);
  const py = snippetPython(BASE);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <p className="text-sm font-medium text-indigo-600">Quickstart</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">First route in 60 seconds</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600">
          Release {amplyVersionLabel()}. Base URL:{" "}
          <code className="rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-sm">{BASE}/api/v1</code>
        </p>

        <ol className="mt-10 list-decimal space-y-10 pl-5 text-gray-800 marker:font-bold marker:text-indigo-600">
          <li className="pl-2">
            <strong className="text-gray-900">Get a key</strong>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Sign in to the{" "}
              <Link className="font-medium text-indigo-600 underline" href="/dashboard">
                dashboard
              </Link>{" "}
              and create an API key (shown once). For server-only keys you can also use{" "}
              <code className="font-mono text-xs">AMPLY_API_KEYS</code> — see{" "}
              <Link className="font-medium text-indigo-600 underline" href="/docs">
                docs
              </Link>
              .
            </p>
          </li>
          <li className="pl-2">
            <strong className="text-gray-900">Call POST /api/v1/route</strong>
            <p className="mt-2 text-sm text-gray-600">Pick curl, TypeScript, or Python — same payload and response.</p>

            <div className="mt-4 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">cURL</p>
                <pre className="mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                  {curl}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">TypeScript (amply-sdk)</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                  {ts}
                </pre>
                <p className="mt-2 text-xs text-gray-500">
                  <code className="font-mono">npm install amply-sdk</code> ·{" "}
                  <a
                    href="https://github.com/thomasdev420/onue/tree/main/packages/amply-sdk"
                    className="text-indigo-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source
                  </a>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Python (amply-sdk)</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                  {py}
                </pre>
                <p className="mt-2 text-xs text-gray-500">
                  <code className="font-mono">pip install amply-sdk</code> (publish from{" "}
                  <code className="font-mono">packages/amply-sdk-python</code>) ·{" "}
                  <a
                    href="https://github.com/thomasdev420/onue/tree/main/packages/amply-sdk-python"
                    className="text-indigo-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source
                  </a>
                </p>
              </div>
            </div>
          </li>
          <li className="pl-2">
            <strong className="text-gray-900">Use the response</strong>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              You get <code className="font-mono text-xs">recommended</code>, <code className="font-mono text-xs">score</code>,{" "}
              <code className="font-mono text-xs">why</code>, economics fields, and <code className="font-mono text-xs">raw_metrics</code>{" "}
              for logging. Trace with <code className="font-mono text-xs">request_id</code> and{" "}
              <code className="font-mono text-xs">compute_ms</code>.
            </p>
          </li>
        </ol>

        <section className="mt-14 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">Live provider snapshot</h2>
          <p className="mt-2 text-sm text-gray-600">
            Same data shape as <a className="text-indigo-600 underline" href="/api/v1/providers">GET /api/v1/providers</a>.
          </p>
          <div className="mt-4">
            <LiveProvidersPreview />
          </div>
        </section>

        <section className="mt-12 border-t border-gray-200/90 pt-12">
          <h2 className="text-xl font-bold text-gray-900">LangChain &amp; LlamaIndex</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Call Amply from a tool / function node with your HTTP client of choice. Example: a LangChain{" "}
            <code className="font-mono text-xs">StructuredTool</code> that POSTs JSON and returns the <code className="font-mono text-xs">why</code> string
            plus <code className="font-mono text-xs">recommended</code> as structured output for the agent.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-slate-950 p-4 font-mono text-xs text-slate-200">
            {`# Pseudocode — bind your base URL + API key from env
# tool input: task description + optional dimension / workload_type
# tool output: pass through JSON from POST /api/v1/route (or trim to recommended + why)`}
          </pre>
        </section>

        <p className="mt-12 text-center text-sm text-gray-600">
          <Link href="/docs" className="font-medium text-indigo-600 underline">
            Full documentation
          </Link>{" "}
          ·{" "}
          <Link href="/api/v1/openapi" className="font-medium text-indigo-600 underline">
            OpenAPI JSON
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
