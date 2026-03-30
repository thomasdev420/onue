"use client";

import { useEffect, useState } from "react";

export default function LiveProvidersPreview() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    fetch(`${origin}/api/v1/providers`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = data?.providers;
        if (!Array.isArray(list)) {
          setErr("Unexpected response");
          return;
        }
        setRows(
          list.map((p) => ({
            id: p.id ?? "?",
            score: p.live_composite_score ?? "—",
          })),
        );
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Fetch failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <p className="text-sm text-amber-800">
        Could not load live catalog: {err}. Try{" "}
        <a href="/api/v1/providers" className="font-medium underline">
          /api/v1/providers
        </a>{" "}
        directly.
      </p>
    );
  }

  if (!rows) {
    return <p className="text-sm text-gray-500">Loading provider snapshot…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[280px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/90">
            <th className="px-4 py-2 font-semibold text-gray-900">id</th>
            <th className="px-4 py-2 font-semibold text-gray-900">live_composite_score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2 font-mono text-xs text-gray-800">{r.id}</td>
              <td className="px-4 py-2 text-gray-700">{typeof r.score === "number" ? r.score.toFixed(4) : r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
