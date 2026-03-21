'use client';

import { useState } from 'react';
import { Target, Loader2, Play, Link as LinkIcon } from 'lucide-react';

export default function SelectionEnginePage() {
  const [url, setUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [canonical, setCanonical] = useState(null);
  const [latest, setLatest] = useState(null);

  async function handleIntake(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLatest(null);
    try {
      const res = await fetch('/api/amply/selection/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || 'Intake failed');
      setProductId(data.productId);
      setCanonical(data.canonical);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    if (!productId) return;
    setError('');
    setScanning(true);
    try {
      const res = await fetch(`/api/amply/selection/products/${productId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setLatest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function refreshProduct() {
    if (!productId) return;
    try {
      const res = await fetch(`/api/amply/selection/products/${productId}`);
      const data = await res.json();
      if (res.ok) {
        setCanonical(data.product?.canonical_jsonb || null);
        if (data.latestScan) {
          setLatest({
            visibilityScore: data.latestScan.visibility_score,
            selectionScore: data.latestScan.selection_score,
            fromDb: true,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
          <Target size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Selection Engine</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-lg leading-relaxed">
            The mission: when ChatGPT-style assistants <span className="font-semibold text-gray-900">pick a product</span>, it should be
            yours. Ingest your URL, run simulated queries, and see <span className="font-semibold text-violet-700">visibility</span> vs{' '}
            <span className="font-semibold text-emerald-700">selection</span> scores.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleIntake} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Product / store URL</label>
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                required
                placeholder="https://yourstore.com/products/..."
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Ingest URL
            </button>
          </div>
        </form>

        {productId ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
            <span className="text-xs font-mono text-gray-500">Product ID: {productId}</span>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50"
            >
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run selection scan
            </button>
            <button
              type="button"
              onClick={refreshProduct}
              className="text-sm text-indigo-600 hover:underline"
            >
              Refresh from DB
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {canonical ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Canonical product (LLM)</h2>
          <pre className="mt-3 overflow-x-auto text-xs text-gray-800">{JSON.stringify(canonical, null, 2)}</pre>
        </div>
      ) : null}

      {latest ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <p className="text-xs font-semibold uppercase text-emerald-800">Visibility score</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">
              {latest.visibilityScore ?? latest.visibility_score ?? 'N/A'}
            </p>
            <p className="mt-2 text-xs text-emerald-800/80">How often assistants mention you across simulated queries</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
            <p className="text-xs font-semibold uppercase text-violet-800">Selection score</p>
            <p className="mt-1 text-3xl font-bold text-violet-900">
              {latest.selectionScore ?? latest.selection_score ?? 'N/A'}
            </p>
            <p className="mt-2 text-xs text-violet-800/80">How often you&apos;re picked as the top / best option</p>
          </div>
          {latest.summary?.runs ? (
            <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 mb-2">Run detail</p>
              <ul className="space-y-2 text-xs text-gray-700">
                {latest.summary.runs.map((r, i) => (
                  <li key={i} className="border-b border-gray-100 pb-2 last:border-0">
                    <span className="font-mono text-[10px] text-gray-400">{r.provider}</span>{' '}
                    {r.skipped ? <span className="text-amber-600">skipped</span> : null}
                    {!r.skipped ? (
                      <>
                        {' '}
                        mention: <strong>{String(r.mentioned)}</strong>, top pick:{' '}
                        <strong>{String(r.selectedAsBest)}</strong>
                      </>
                    ) : null}
                    <div className="text-gray-500 truncate">{r.query}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="mt-10 text-center text-xs text-gray-400">
        Requires <code className="rounded bg-gray-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>,{' '}
        <code className="rounded bg-gray-100 px-1">OPENAI_API_KEY</code>, and SQL from{' '}
        <code className="rounded bg-gray-100 px-1">database_setup_amply_selection.sql</code>. Optional:{' '}
        <code className="rounded bg-gray-100 px-1">ANTHROPIC_API_KEY</code> for Claude runs.
      </p>
    </div>
  );
}
