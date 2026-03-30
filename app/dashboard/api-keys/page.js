'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Copy, KeyRound, Loader2, Trash2, AlertCircle, Check } from 'lucide-react';

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [label, setLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/amply-api-keys');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load keys');
      }
      setKeys(data.keys || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') load();
    if (status === 'unauthenticated') setLoading(false);
  }, [status, load]);

  const createKey = async () => {
    setCreating(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch('/api/user/amply-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      setNewKey(data.api_key);
      setLabel('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id) => {
    if (!confirm('Revoke this key? Integrations using it will stop working.')) return;
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/user/amply-api-keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revoke failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
    } finally {
      setRevokingId(null);
    }
  };

  const copyNew = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading API keys…
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <p className="text-gray-600">Sign in to manage API keys.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-start gap-3">
        <div className="rounded-xl bg-indigo-100 p-3">
          <KeyRound className="h-7 w-7 text-indigo-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API keys</h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Use these keys for{' '}
            <code className="rounded bg-gray-100 px-1 text-xs">Authorization: Bearer …</code> on{' '}
            <Link href="/docs" className="font-medium text-indigo-600 underline">
              POST /api/v1/route
            </Link>
            . Keys are stored as a hash; we only show the full secret once when created.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {newKey && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-950">New key: copy it now</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-gray-900 ring-1 ring-amber-200">
              {newKey}
            </code>
            <button
              type="button"
              onClick={copyNew}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Create a key</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="key-label" className="sr-only">
              Label
            </label>
            <input
              id="key-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional label (e.g. Production)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="button"
            onClick={createKey}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create key
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">Active keys</h2>
        {keys.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No keys yet. Create one to call the routing API.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{k.key_prefix}</p>
                  {k.label && <p className="text-xs text-gray-500">{k.label}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    Created {k.created_at ? new Date(k.created_at).toLocaleString() : 'n/a'}
                    {k.last_used_at
                      ? ` · Last used ${new Date(k.last_used_at).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(k.id)}
                  disabled={revokingId === k.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {revokingId === k.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-gray-500">
        Server env <code className="text-gray-700">AMPLY_API_KEYS</code> still works alongside user keys. Set{' '}
        <code className="text-gray-700">AMPLY_REQUIRE_API_KEY=1</code> to require a Bearer token for every request (user
        key or env key).
      </p>
    </div>
  );
}
