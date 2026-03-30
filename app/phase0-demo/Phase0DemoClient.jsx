'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJson(jsonStr) {
  const esc = escapeHtml(jsonStr);
  return esc.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+\.?\d*([eE][+\-]?\d+)?)/g,
    (m) => {
      let cls = 'text-amber-300';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'text-sky-300' : 'text-emerald-300';
      else if (/true|false/.test(m)) cls = 'text-violet-300';
      else if (m === 'null') cls = 'text-slate-400';
      return `<span class="${cls}">${m}</span>`;
    },
  );
}

export default function Phase0DemoClient() {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [jsonRaw, setJsonRaw] = useState(null);

  const run = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    setJsonRaw(null);

    try {
      const res = await fetch('/api/phase0', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: '{}',
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 280) || `HTTP ${res.status}`);
      }
      if (!res.ok || data.error) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setJsonRaw(JSON.stringify(data, null, 2));
      setStatus('success');
    } catch (e) {
      setErrorMessage(e?.message || String(e));
      setStatus('error');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-4 py-10 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-sm text-gray-500">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-800">
            ← Back to home
          </Link>
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Amply Phase 0
        </h1>
        <p className="mt-2 text-pretty text-sm text-gray-600 sm:text-base">
          Runs the live Pinecone pipeline via{' '}
          <code className="rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-xs">POST /api/phase0</code>
          . Requires <code className="font-mono text-xs">PINECONE_API_KEY</code> in{' '}
          <code className="font-mono text-xs">.env</code>.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={status === 'loading'}
            className="rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Running…' : 'Run Phase 0'}
          </button>
          <span className="text-xs text-gray-500">
            Index <span className="font-mono">ampley-demo</span> · 100 vectors · 10 queries
          </span>
        </div>

        {status === 'success' && (
          <section
            className="mt-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/80 to-white p-4 shadow-sm sm:p-5"
            aria-live="polite"
          >
            <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-emerald-800">Status</h2>
            <p className="mt-1 text-sm text-gray-800">
              <span className="font-semibold text-emerald-800">Success.</span> HTTP 200, live Pinecone pipeline
              completed. See JSON below.
            </p>
          </section>
        )}

        {status === 'error' && (
          <section
            className="mt-6 rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50/80 to-white p-4 shadow-sm sm:p-5"
            aria-live="assertive"
          >
            <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-red-800">Status</h2>
            <p className="mt-1 text-sm text-gray-800">
              <span className="font-semibold text-red-800">Failed.</span>{' '}
              <span className="text-red-900/90">{errorMessage}</span>
            </p>
          </section>
        )}

        {jsonRaw && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-gray-500">Response JSON</h2>
            <pre
              className="mt-3 max-h-[min(70vh,520px)] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200 sm:text-xs"
              tabIndex={0}
            >
              <code dangerouslySetInnerHTML={{ __html: highlightJson(jsonRaw) }} />
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
