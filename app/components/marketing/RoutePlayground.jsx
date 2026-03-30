"use client";

import { useCallback, useState } from "react";
import { DEFAULT_TASK } from "@/app/lib/amplyCurlSnippet";

const PLACEHOLDER = DEFAULT_TASK.slice(0, 120) + (DEFAULT_TASK.length > 120 ? "…" : "");

export default function RoutePlayground() {
  const [task, setTask] = useState(DEFAULT_TASK);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/playground`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          dimension: 1536,
          workload_type: "hybrid",
          filter_complexity: "high",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`);
        return;
      }
      if (!data.ok) {
        setErr(data.detail || "Playground error");
        return;
      }
      setResult(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [task]);

  return (
    <section
      id="playground"
      className="mb-16 w-full max-w-4xl scroll-mt-28 px-2 sm:mb-24 sm:px-4"
      aria-label="Try routing"
    >
      <h2 className="text-balance text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Try it — no API key in the browser
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-pretty text-sm leading-relaxed text-gray-600 sm:text-base">
        Describe your workload. We call{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">POST /api/v1/route</code> from our servers with
        strict rate limits — you see the same JSON shape as production.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-md ring-1 ring-gray-900/[0.04] sm:p-7">
        <label htmlFor="playground-task" className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
          Task
        </label>
        <textarea
          id="playground-task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={4}
          placeholder={PLACEHOLDER}
          className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none ring-indigo-500/30 focus:border-indigo-300 focus:ring-2"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !task.trim()}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Routing…" : "Run routing"}
        </button>

        {err ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800" role="alert">
            {err}
          </p>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-sm sm:p-5">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-gray-800">
              <span>
                <strong className="text-gray-900">Recommended:</strong>{" "}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono text-indigo-700">{result.recommended}</code>
              </span>
              <span>
                <strong className="text-gray-900">Score:</strong> {result.score}
              </span>
              <span>
                <strong className="text-gray-900">Server compute:</strong> {result.compute_ms ?? "—"} ms
              </span>
              <span>
                <strong className="text-gray-900">Playground RTT:</strong> {result.playground_wall_ms ?? "—"} ms
              </span>
            </div>
            <p className="leading-relaxed text-gray-700">{result.why}</p>
            {result.request_id ? (
              <p className="text-xs text-gray-500">
                request_id: <code className="font-mono">{result.request_id}</code>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
        Fair use: limited requests per minute per IP. For production traffic,{" "}
        <a href="/dashboard" className="font-medium text-indigo-600 underline">
          get an API key
        </a>
        .
      </p>
    </section>
  );
}
