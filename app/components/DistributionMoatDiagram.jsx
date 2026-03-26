'use client';

import { ArrowDown, ArrowRight } from 'lucide-react';

/**
 * Before vs after: LLM-guessed tool choice (top) vs Amply empirical route (bottom).
 */

/** Shorter on lg+ so tiles hug copy; arrows match row height */
const ROW_BOX_H = 'h-[150px] shrink-0 sm:h-[154px] lg:h-[128px]';

function RowArrow() {
  return (
    <div
      className={`hidden items-center justify-center lg:flex ${ROW_BOX_H} w-8 shrink-0 text-white xl:w-9`}
      aria-hidden
    >
      <ArrowRight className="h-6 w-6 xl:h-7 xl:w-7" strokeWidth={3} />
    </div>
  );
}

function RowArrowDown() {
  return (
    <div className="flex justify-center py-1 text-white" aria-hidden>
      <ArrowDown className="h-6 w-6" strokeWidth={3} />
    </div>
  );
}

/** Losing row tiles: muted + cool/red undertone */
function LoseBox({ children, fatal = false }) {
  return (
    <div
      className={`relative flex w-full ${ROW_BOX_H} flex-col overflow-hidden rounded-2xl border px-2.5 py-2 text-center sm:px-3 sm:py-2.5 lg:px-3 lg:py-2 ${
        fatal
          ? 'border-red-500/25 bg-red-950/20 opacity-[0.92] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_28px_rgba(239,68,68,0.08)]'
          : 'border-white/10 bg-white/[0.03] opacity-[0.88]'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/15 to-transparent" aria-hidden />
      <div className="flex h-full flex-col items-center justify-center gap-0.5 leading-snug">{children}</div>
    </div>
  );
}

/** Winning row tiles; success = pure emerald (no indigo/blue) */
function WinBox({ children, success = false }) {
  return (
    <div
      className={`relative flex w-full ${ROW_BOX_H} flex-col overflow-hidden rounded-2xl border px-2.5 py-2 text-center sm:px-3 sm:py-2.5 lg:px-3 lg:py-2 ${
        success
          ? 'border-emerald-400/50 bg-gradient-to-b from-emerald-500/25 to-emerald-950/35 shadow-[0_0_40px_rgba(16,185,129,0.22),inset_0_1px_0_rgba(167,243,208,0.12)]'
          : 'border-emerald-500/20 bg-white/[0.08]'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent"
        aria-hidden
      />
      <div className="flex h-full flex-col items-center justify-center gap-0.5 leading-snug">{children}</div>
    </div>
  );
}

function LosingFlow({ mobile = false }) {
  const inner = (
    <>
      <LoseBox>
        <p className="text-sm font-bold text-white/75">Model picks API</p>
        <p className="text-xs font-medium text-white/45">Slow</p>
      </LoseBox>
      {mobile ? <RowArrowDown /> : <RowArrow />}
      <LoseBox>
        <p className="text-sm font-bold text-white/75">Bad cost / latency info</p>
      </LoseBox>
      {mobile ? <RowArrowDown /> : <RowArrow />}
      <LoseBox>
        <p className="text-sm font-bold text-white/75">No real benchmarks</p>
      </LoseBox>
      {mobile ? <RowArrowDown /> : <RowArrow />}
      <LoseBox fatal>
        <p className="text-sm font-bold text-red-200/90">Wrong provider</p>
        <p className="text-sm font-bold text-red-300/75">Slower & pricier</p>
      </LoseBox>
    </>
  );

  if (mobile) {
    return <div className="flex flex-col">{inner}</div>;
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-x-1.5 xl:gap-x-2">
      {inner}
    </div>
  );
}

function WinningFlow({ mobile = false }) {
  const inner = (
    <>
      <WinBox>
        <p className="text-sm font-bold text-white">POST to Amply</p>
      </WinBox>
      {mobile ? <RowArrowDown /> : <RowArrow />}
      <WinBox>
        <p className="text-sm font-bold text-white">Benchmark scores</p>
      </WinBox>
      {mobile ? <RowArrowDown /> : <RowArrow />}
      <WinBox>
        <p className="text-sm font-bold text-white">Pick + metrics + why</p>
      </WinBox>
      {mobile ? <RowArrowDown /> : <RowArrow />}
      <WinBox success>
        <p className="text-sm font-bold text-emerald-100">Right service</p>
        <p className="text-sm font-bold text-emerald-50/95">Fast path</p>
      </WinBox>
    </>
  );

  if (mobile) {
    return <div className="flex flex-col">{inner}</div>;
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-x-1.5 xl:gap-x-2">
      {inner}
    </div>
  );
}

export default function DistributionMoatDiagram() {
  return (
    <figure
      className="mt-8 w-full max-w-6xl mx-auto sm:mt-10"
      aria-label="Before: agents waste time and pick the wrong API. After: Amply returns an empirical best choice in milliseconds."
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 sm:px-8 sm:py-10">
        {/* Mobile: stack both rows */}
        <div className="lg:hidden">
          <p className="text-center text-xs font-bold uppercase tracking-[0.08em] text-white/50 sm:text-sm">
            Without Amply
          </p>
          <div className="mt-3">
            <LosingFlow mobile />
          </div>

          <p className="mt-8 text-center text-sm font-bold uppercase tracking-[0.1em] text-emerald-300/95 sm:text-base">
            With Amply
          </p>
          <div className="mt-3">
            <WinningFlow mobile />
          </div>
        </div>

        {/* Desktop: two horizontal bands */}
        <div className="hidden lg:block">
          <p className="text-center text-sm font-bold uppercase tracking-[0.08em] text-white/50 lg:text-base">
            Without Amply
          </p>
          <div className="mt-4">
            <LosingFlow />
          </div>

          <p className="mt-10 text-center text-base font-bold uppercase tracking-[0.1em] text-emerald-300/95 lg:text-lg">
            With Amply
          </p>
          <div className="mt-4">
            <WinningFlow />
          </div>
        </div>

      </div>
    </figure>
  );
}
