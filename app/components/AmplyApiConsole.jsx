'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';

const DEFAULT_TASK =
  'store 100k 1536 dimensional vectors with metadata filters and run 50 similarity queries';

/** Dedicated API host (FastAPI etc.): …/v1/route. Same Next app: …/api/v1/route. */
function useRoutePostUrl() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return useMemo(() => {
    const ext = process.env.NEXT_PUBLIC_AMPLY_API_BASE?.replace(/\/$/, '') || '';
    if (ext) return `${ext}/v1/route`;
    if (mounted && typeof window !== 'undefined') {
      return `${window.location.origin}/api/v1/route`;
    }
    return 'https://www.useamply.com/api/v1/route';
  }, [mounted]);
}

/** Bash-safe single-quoted string: wrap in '...' with '\'' for embedded quotes */
function bashSingleQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function buildPayload(task) {
  return {
    task: task.trim() || DEFAULT_TASK,
    dimension: 1536,
    workload_type: 'hybrid',
    filter_complexity: 'high',
  };
}

export default function AmplyApiConsole() {
  const [taskInput, setTaskInput] = useState(DEFAULT_TASK);
  const [tab, setTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [statusMeta, setStatusMeta] = useState(null);

  useEffect(() => {
    fetch('/api/v1/status')
      .then((r) => r.json())
      .then(setStatusMeta)
      .catch(() => setStatusMeta(null));
  }, []);

  const routeUrl = useRoutePostUrl();
  const payload = useMemo(() => buildPayload(taskInput), [taskInput]);
  const bodyCompact = useMemo(() => JSON.stringify(payload), [payload]);

  const curlScript = useMemo(() => {
    const d = bashSingleQuote(bodyCompact);
    return `curl -s -X POST "${routeUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d ${d}`;
  }, [routeUrl, bodyCompact]);

  const fetchScript = useMemo(() => {
    return `const res = await fetch("${routeUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    task: ${JSON.stringify(payload.task)},
    dimension: ${payload.dimension},
    workload_type: ${JSON.stringify(payload.workload_type)},
    filter_complexity: ${JSON.stringify(payload.filter_complexity)},
  }),
});
const data = await res.json();
console.log(data.recommended, data.why);`;
  }, [routeUrl, payload]);

  const pythonScript = useMemo(() => {
    const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `import requests

r = requests.post(
    "${routeUrl}",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY",
    },
    json={
        "task": "${esc(payload.task)}",
        "dimension": ${payload.dimension},
        "workload_type": "${esc(payload.workload_type)}",
        "filter_complexity": "${esc(payload.filter_complexity)}",
    },
    timeout=30,
)
r.raise_for_status()
data = r.json()
print(data["recommended"], data.get("why", ""))`;
  }, [routeUrl, payload]);

  const activeSnippet =
    tab === 'curl' ? curlScript : tab === 'fetch' ? fetchScript : pythonScript;

  const copySnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [activeSnippet]);

  return (
    <section
      id="api"
      className="mx-auto w-full max-w-4xl px-4"
      aria-labelledby="amply-api-console-heading"
    >
      <div className="amply-api-console-glow-wrap rounded-2xl bg-gradient-to-br from-[#7ba3d9] via-[#8b8bd4] to-[#5ec4d4] p-px">
        <div className="rounded-2xl bg-white p-6 sm:p-7">
          <h2
            id="amply-api-console-heading"
            className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent sm:text-xl"
          >
            Copy a request
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            <strong className="font-medium text-gray-800">POST /api/v1/route</strong> on production requires{' '}
            <code className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[0.8125rem] text-amber-950">
              Authorization: Bearer &lt;your key&gt;
            </code>
            {statusMeta?.auth_mode === 'api_key' ? (
              <span className="text-gray-700"> (this host has keys enabled).</span>
            ) : (
              <span className="text-gray-700"> (omit Bearer only if the server has no AMPLY_API_KEYS).</span>
            )}{' '}
            Replace{' '}
            <code className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[0.8125rem] font-medium text-indigo-900">
              YOUR_API_KEY
            </code>{' '}
            in the snippet.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Machine-readable contract:{' '}
            <a className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800" href="/api/v1/openapi">
              OpenAPI JSON
            </a>
            {' · '}
            <a className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800" href="/api/v1/status">
              Status &amp; diagnostics
            </a>
            {statusMeta?.version ? (
              <span className="text-gray-400"> (v{statusMeta.version})</span>
            ) : null}
          </p>

          <label htmlFor="amply-api-task" className="mt-5 block text-sm font-medium text-indigo-950/80">
            Task description
          </label>
          <textarea
            id="amply-api-task"
            rows={2}
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            spellCheck={false}
            className="mt-1.5 min-h-[4rem] w-full resize-y rounded-xl border border-indigo-100 bg-indigo-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-indigo-900/35 focus:border-cyan-300/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200/80"
            placeholder={DEFAULT_TASK}
          />

          <div className="mt-5 flex flex-col gap-3 border-t border-indigo-100/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex flex-wrap gap-1.5"
              role="tablist"
              aria-label="Snippet format"
            >
              {(['curl', 'fetch', 'python']).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    tab === id
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-violet-500/30'
                      : 'text-indigo-900/50 hover:bg-indigo-50 hover:text-indigo-900'
                  }`}
                >
                  {id === 'fetch' ? 'JavaScript' : id === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copySnippet}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition hover:brightness-110 hover:shadow-lg hover:shadow-cyan-500/20 sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 opacity-90" aria-hidden strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          </div>

          <pre
            className="mt-3 max-h-[min(50vh,380px)] overflow-auto rounded-xl border border-slate-700/80 bg-slate-950 px-4 py-3.5 text-left font-mono text-[13px] leading-relaxed text-slate-200 sm:text-sm whitespace-pre-wrap break-words shadow-inner selection:bg-cyan-500/25"
            tabIndex={0}
          >
            {activeSnippet}
          </pre>
        </div>
      </div>
    </section>
  );
}
