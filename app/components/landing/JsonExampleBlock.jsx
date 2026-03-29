'use client';

import { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { HighlightJson } from './CodeHighlight';

/** Exact example from landing page (unchanged contract). */
export const LANDING_JSON_EXAMPLE = `{
  "amply": {
    "api_version": "v1",
    "route_id": "rt_8f2a9c1e4b3d",
    "decision_ms": 186,
    "observation_window": "rolling_7d",
    "refreshed_at": "2026-03-24T12:00:00Z"
  },
  "recommended": {
    "provider_id": "pinecone_serverless",
    "region_hint": "us_east_1",
    "confidence": 0.91,
    "score": 0.91
  },
  "rankings": [
    { "provider_id": "pinecone_serverless", "rank": 1, "score": 0.91 },
    { "provider_id": "qdrant_cloud", "rank": 2, "score": 0.84 },
    { "provider_id": "weaviate_cloud", "rank": 3, "score": 0.79 }
  ],
  "economics": {
    "currency": "USD",
    "estimated_cost_usd_per_1m_vector_ops": 12.4,
    "billing_model": "usage_metered"
  },
  "performance": {
    "p50_latency_ms": 41,
    "p95_latency_ms": 78,
    "p99_latency_ms": 94,
    "success_rate_7d": 0.997,
    "error_rate_7d": 0.003,
    "samples_7d": 1842000
  },
  "why": "Strongest fit for hybrid search with high filter complexity: best p99 under your implied SLO, lowest blended cost in live traffic, and stable success rate week over week.",
  "decision_factors": [
    { "factor": "latency_p99_vs_slo", "weight": 0.34, "outcome": "pass" },
    { "factor": "cost_per_million_ops", "weight": 0.28, "outcome": "best_in_class" },
    { "factor": "success_rate_7d", "weight": 0.24, "outcome": "high" },
    { "factor": "workload_match", "weight": 0.14, "outcome": "hybrid_plus_filters" }
  ],
  "agent_hints": {
    "log_fields": ["amply.route_id", "recommended.provider_id", "amply.decision_ms"],
    "idempotent": true,
    "retry_safe": true,
    "fallback_policy": "use_rankings_2_then_3_if_provider_errors"
  }
}`;

export default function JsonExampleBlock({ titleId = 'example-title' }) {
  const [copied, setCopied] = useState(false);

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(LANDING_JSON_EXAMPLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copyJson}
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-600/90 bg-slate-900/95 px-2.5 py-1.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-sm transition hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white sm:right-3 sm:top-3 sm:px-3 sm:text-sm"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 opacity-90 sm:h-4 sm:w-4" strokeWidth={2} />
            Copy
          </>
        )}
      </button>
      <pre
        className="max-h-[min(75vh,560px)] overflow-x-auto overflow-y-auto rounded-xl border border-slate-600/90 bg-slate-950 p-4 pt-12 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5 sm:pt-14"
        tabIndex={0}
        aria-labelledby={titleId}
      >
        <HighlightJson text={LANDING_JSON_EXAMPLE} />
      </pre>
    </div>
  );
}
