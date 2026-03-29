'use client';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Gauge,
  ListChecks,
  Sparkles,
  XOctagon,
  Zap,
} from 'lucide-react';

/**
 * Side-by-side: without Amply vs with Amply (same copy as previous flow diagram).
 */
export default function DistributionMoatDiagram() {
  return (
    <figure
      className="mt-8 w-full max-w-6xl mx-auto sm:mt-10"
      aria-label="Before: agents waste time and pick the wrong API. After: Amply returns an empirical best choice in milliseconds."
    >
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {/* Without Amply */}
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-950/40 to-[#0c0c10] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/20">
          <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-red-300/90 sm:text-sm">
            Without Amply
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:border-red-400/25 hover:bg-white/[0.06]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-200">
                <AlertTriangle className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-left leading-snug">
                <span className="block text-sm font-bold text-white/85">Model picks API</span>
                <span className="text-xs font-medium text-white/50">Slow</span>
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:border-red-400/25 hover:bg-white/[0.06]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-200">
                <CircleDollarSign className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-white/85">Bad cost / latency info</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:border-red-400/25 hover:bg-white/[0.06]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-200">
                <Gauge className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-white/85">No real benchmarks</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-red-500/25 bg-red-950/35 p-3.5 shadow-[0_0_24px_rgba(239,68,68,0.12)] transition hover:border-red-400/40">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/25 text-red-100">
                <XOctagon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-left leading-snug">
                <span className="block text-sm font-bold text-red-200/95">Wrong provider</span>
                <span className="text-sm font-bold text-red-300/80">Slower & pricier</span>
              </span>
            </li>
          </ul>
        </div>

        {/* With Amply */}
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/35 to-[#0a100e] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/25">
          <p className="text-center text-sm font-bold uppercase tracking-[0.1em] text-emerald-300/95 sm:text-base">
            With Amply
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            <li className="flex gap-3 rounded-xl border border-emerald-500/20 bg-white/[0.06] p-3.5 transition hover:border-emerald-400/35 hover:bg-white/[0.08]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-100">
                <Zap className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-white">POST to Amply</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-emerald-500/20 bg-white/[0.06] p-3.5 transition hover:border-emerald-400/35 hover:bg-white/[0.08]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-100">
                <BarChart3 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-white">Benchmark scores</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-emerald-500/20 bg-white/[0.06] p-3.5 transition hover:border-emerald-400/35 hover:bg-white/[0.08]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-100">
                <ListChecks className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-white">Pick + metrics + why</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-emerald-400/45 bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 p-3.5 shadow-[0_0_32px_rgba(16,185,129,0.2)] transition hover:border-emerald-300/50">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/30 text-emerald-50">
                <Sparkles className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-left leading-snug">
                <span className="block text-sm font-bold text-emerald-100">Right service</span>
                <span className="text-sm font-bold text-emerald-50/95">Fast path</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-center md:hidden" aria-hidden>
        <ArrowRight className="h-6 w-6 rotate-90 text-white/25" />
      </div>
    </figure>
  );
}
