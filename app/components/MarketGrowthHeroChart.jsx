'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Hero visual: illustrative curves, teams routing with Amply vs LLM only provider picks.
 * Figcaption and cards describe the agent / vector DB routing story.
 */

/** Agent icon tile for rotating example task cards. */
const AGENT_TILE_STYLE = {
  width: '2.75rem',
  height: '2.75rem',
  borderRadius: '0.55rem',
  backgroundColor: '#000000',
  border: '2px solid rgba(255, 255, 255, 0.85)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-6deg)',
  flexShrink: 0,
};

function LandingLogoChatGPT() {
  return (
    <div style={{ position: 'relative', zIndex: 2, ...AGENT_TILE_STYLE }} title="Agent task">
      <svg
        className="block shrink-0"
        style={{ width: '1.55rem', height: '1.55rem' }}
        viewBox="0 0 24 24"
        role="img"
        aria-hidden
      >
        <path
          fill="#FFFFFF"
          d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
        />
      </svg>
    </div>
  );
}

const QUERY_ROTATE_MS = 4200;

/** Solution section: how Amply works, in order (three steps). */
const SOLUTION_STEPS = [
  {
    title: 'Get a key',
    body: 'Free to start. No pay to rank.',
  },
  {
    title: 'POST /v1/route',
    body: 'Task string in. Service pick, metrics, and why out as JSON only.',
  },
  {
    title: 'Call the tool',
    body: 'Use the recommended API from your agent loop. No comparison browsing.',
  },
];

/** Rotating example agent tasks (icon stack uses ChatGPT tile as generic “agent”). */
const AI_QUERY_SLIDES = [
  {
    id: 'task-embed-store',
    Logo: LandingLogoChatGPT,
    text: 'Store 100k 1536 dimensional vectors with metadata filters and run 50 similarity queries',
    cardExtra: '',
  },
  {
    id: 'task-query-heavy',
    Logo: LandingLogoChatGPT,
    text: 'Query heavy RAG: low latency hybrid search with medium filter complexity',
    cardExtra: '',
  },
  {
    id: 'task-insert',
    Logo: LandingLogoChatGPT,
    text: 'Insert heavy pipeline: bulk upserts, then occasional ANN queries',
    cardExtra: '',
  },
  {
    id: 'task-cost',
    Logo: LandingLogoChatGPT,
    text: 'Stay under $0.01 per decision with p99 latency under 200ms',
    cardExtra: '',
  },
  {
    id: 'task-dim',
    Logo: LandingLogoChatGPT,
    text: '768-dimensional embeddings with high filter complexity',
    cardExtra: '',
  },
  {
    id: 'task-multi',
    Logo: LandingLogoChatGPT,
    text: 'Compare live success rates across Pinecone, Qdrant, Weaviate, and more',
    cardExtra: '',
  },
];

/** Rotating task cards */
function AiQueryPromptStack() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % AI_QUERY_SLIDES.length);
    }, QUERY_ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const cardBase =
    'relative w-full rounded-[1.125rem] border border-gray-200/90 bg-white px-2.5 py-2.5 shadow-[0_12px_42px_rgba(15,23,42,0.09)] sm:rounded-2xl sm:px-3 sm:py-3';

  /** Back stack: same opaque white as front so nothing reads “washed out”. */
  const cardBack =
    'relative w-full rounded-[1.125rem] border border-gray-200/90 bg-white px-2.5 py-2.5 shadow-[0_6px_22px_rgba(15,23,42,0.07)] sm:rounded-2xl sm:px-3 sm:py-3';

  const row =
    'relative flex w-full min-w-0 flex-row items-center justify-start gap-3 sm:gap-3.5';

  const queryText =
    'min-w-0 flex-1 text-left text-base font-bold leading-snug tracking-tight text-pretty text-gray-800 sm:text-lg';

  /** Only front + two behind; deeper slides stay hidden until they advance. */
  const VISIBLE_STACK = 3;

  return (
    <div className="mx-auto mt-8 w-full max-w-full sm:mt-10">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Example agent task: {AI_QUERY_SLIDES[active].text}
      </span>
      {/* Narrow column so centered copy isn’t lost in a full-width strip */}
      <div
        className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg"
        aria-hidden="true"
      >
        <div className="relative min-h-[7.5rem] w-full pb-1 sm:min-h-[8.25rem]">
          {AI_QUERY_SLIDES.map((slide, i) => {
            const n = AI_QUERY_SLIDES.length;
            const stackPos = (i - active + n) % n;
            const Logo = slide.Logo;
            const inDeck = stackPos < VISIBLE_STACK;

            const translateY = stackPos === 0 ? 0 : stackPos === 1 ? 9 : 18;
            const scale = stackPos === 0 ? 1 : stackPos === 1 ? 0.988 : 0.976;
            const zIndex = 30 - stackPos;

            const cardClass =
              stackPos === 0 ? `${cardBase} ${slide.cardExtra}`.trim() : `${cardBack}`.trim();

            return (
              <div
                key={slide.id}
                className={`absolute inset-x-0 top-0 origin-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  stackPos !== 0 ? 'pointer-events-none' : ''
                }`}
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity: inDeck ? 1 : 0,
                  zIndex: inDeck ? zIndex : 0,
                }}
              >
                <div className={cardClass}>
                  <div className={row}>
                    <span className="shrink-0">
                      <Logo />
                    </span>
                    <p className={queryText}>{slide.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MarketGrowthHeroChart({ isLoaded }) {
  const uid = useId().replace(/:/g, '');
  const chartTravelGlowFilterId = `mg-line-glow-${uid}`;
  const fillAmplyId = `marketGrowthFillAmply-${uid}`;
  const strokeAmplyId = `marketGrowthStrokeAmply-${uid}`;
  const strokeWithoutId = `marketGrowthStrokeWithout-${uid}`;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const CHART_YEAR_START = 2026;
  const CHART_YEAR_END = 2030;
  const CHART_SPAN = CHART_YEAR_END - CHART_YEAR_START;

  /** Indexed efficiency: Amply path compounds; LLM-only selection drags outcomes. */
  const REV_BASE = 100;
  const REV_AMPLY_MULTIPLIER = 3;
  const REV_WITHOUT_END = 88;
  const REV_AXIS_MIN = 72;
  const REV_AXIS_MAX = 318;

  const padL = 78;
  const padR = 52;
  const padT = 44;
  /** Bottom space for legend + callout clearance below the plot. */
  const padB = 70;
  const W = 920;
  const H = 348;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const scaleX = (year) => padL + ((year - CHART_YEAR_START) / CHART_SPAN) * innerW;
  const scaleYRev = (rev) =>
    padT + (1 - (rev - REV_AXIS_MIN) / (REV_AXIS_MAX - REV_AXIS_MIN)) * innerH;

  /** t ∈ [0,1] from 2026 → 2030 */
  const revenueAmplyAtT = (t) => REV_BASE * REV_AMPLY_MULTIPLIER ** t;
  const revenueWithoutAtT = (t) => REV_BASE + (REV_WITHOUT_END - REV_BASE) * t;

  const STEPS = 96;
  const ptsAmply = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const year = CHART_YEAR_START + CHART_SPAN * t;
    const v = revenueAmplyAtT(t);
    return { x: scaleX(year), y: scaleYRev(v) };
  });
  const ptsWithout = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const year = CHART_YEAR_START + CHART_SPAN * t;
    const v = revenueWithoutAtT(t);
    return { x: scaleX(year), y: scaleYRev(v) };
  });

  const lineAmplyD = ptsAmply
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const lineWithoutD = ptsWithout
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const bottomY = padT + innerH;
  const areaAmplyD = `${lineAmplyD} L ${ptsAmply[ptsAmply.length - 1].x.toFixed(2)} ${bottomY.toFixed(2)} L ${ptsAmply[0].x.toFixed(2)} ${bottomY.toFixed(2)} Z`;

  /** Shared shell for Problem/Solution narrative cards (gradient, shadow). */
  const narrativeCardShell =
    'mx-auto w-full overflow-visible rounded-2xl bg-gradient-to-b from-white to-slate-50/90 px-4 py-5 text-left shadow-[0_20px_40px_rgba(0,0,0,0.1)] sm:px-8 sm:py-7';
  /** Problem: thin red border */
  const problemNarrativeCardClass = `${narrativeCardShell} border border-red-300/90`;
  /** Solution: thin green border (matches Solution chip) */
  const solutionNarrativeCardClass = `${narrativeCardShell} border border-emerald-400/85`;

  return (
    <div
      className="mx-auto w-full max-w-[960px] px-2 sm:px-0"
      style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
        transition: 'opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s',
      }}
    >
      <figure
        className="overflow-visible rounded-2xl border-2 border-blue-200/30 bg-gradient-to-b from-white to-slate-50/90 shadow-[0_20px_40px_rgba(0,0,0,0.1)] px-4 py-5 sm:px-8 sm:py-7"
        role="img"
        aria-label="Amply data backed routing versus asking an LLM to pick a provider."
      >
        <figcaption className="mb-5 text-center sm:mb-6">
          <p className="mx-auto max-w-xl text-pretty text-lg font-extrabold leading-snug tracking-tight text-gray-900 sm:text-xl md:text-2xl md:leading-tight">
            Know the pick. Skip the reasoning tax.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm font-medium leading-relaxed text-gray-600 sm:mt-5 sm:text-base">
            Teams that route on telemetry instead of model guesses tend to outperform{' '}
            <strong className="home-stat-text-glow-pulse font-extrabold text-blue-600">3×</strong> on this chart vs
            LLM only: illustrative, not a guarantee.
          </p>
        </figcaption>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={fillAmplyId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#3953e6" stopOpacity="0.06" />
              <stop offset="55%" stopColor="#36aeea" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id={strokeAmplyId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3953e6" />
              <stop offset="100%" stopColor="#36aeea" />
            </linearGradient>
            <linearGradient id={strokeWithoutId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            <filter
              id={chartTravelGlowFilterId}
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="glowBlur" />
              <feMerge>
                <feMergeNode in="glowBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Baseline */}
          <line
            x1={padL}
            y1={padT + innerH}
            x2={W - padR}
            y2={padT + innerH}
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />

          {/* Subtle vertical guides */}
          {[2026, 2027, 2028, 2029, 2030].map((y) => (
            <line
              key={y}
              x1={scaleX(y)}
              y1={padT}
              x2={scaleX(y)}
              y2={padT + innerH}
              stroke="#F3F4F6"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis ticks (indexed revenue) */}
          {[100, 200, 300].map((rev) => {
            const y = scaleYRev(rev);
            return (
              <g key={rev}>
                <line
                  x1={padL - 6}
                  y1={y}
                  x2={padL}
                  y2={y}
                  stroke="#D1D5DB"
                  strokeWidth="1"
                />
                <text
                  x={padL - 10}
                  y={y + 5}
                  textAnchor="end"
                  fill="#6B7280"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {rev}
                </text>
              </g>
            );
          })}

          <path d={areaAmplyD} fill={`url(#${fillAmplyId})`} />
          <path
            d={lineAmplyD}
            fill="none"
            stroke={`url(#${strokeAmplyId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={lineWithoutD}
            fill="none"
            stroke={`url(#${strokeWithoutId})`}
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />

          {/* Legend: bottom center, two entries grouped closer (shared visual unit) */}
          <g transform={`translate(${W / 2}, ${H - 28})`} aria-hidden="true">
            <g>
              <line x1={-138} y1={0} x2={-114} y2={0} stroke="#36aeea" strokeWidth={4} strokeLinecap="round" />
              <text x={-106} y={4.5} textAnchor="start" fill="#1F2937" style={{ fontSize: 12.5, fontWeight: 700 }}>
                With Amply
              </text>
            </g>
            <g>
              <line x1={-18} y1={0} x2={6} y2={0} stroke="#ea580c" strokeWidth={3.25} strokeLinecap="round" />
              <text x={14} y={4.5} textAnchor="start" fill="#1F2937" style={{ fontSize: 12.5, fontWeight: 600 }}>
                Reasoning only
              </text>
            </g>
          </g>

          {/* Pulsing glow that travels along the Amply curve */}
          {!prefersReducedMotion && (
            <g aria-hidden="true">
              <animateMotion
                path={lineAmplyD}
                dur="6.5s"
                repeatCount="indefinite"
                calcMode="linear"
                rotate="0"
              />
              <circle r="16" fill="#36aeea" opacity="0.42" filter={`url(#${chartTravelGlowFilterId})`}>
                <animate attributeName="r" values="13;19;13" dur="1.15s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.28;0.62;0.28" dur="1.15s" repeatCount="indefinite" />
              </circle>
              <circle r="7" fill="#7dd3fc" opacity="0.95">
                <animate attributeName="r" values="5.5;9;5.5" dur="1.15s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#ffffff" opacity="1">
                <animate attributeName="r" values="3.2;4.8;3.2" dur="1.15s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Value callouts (right end of series) */}
          <text
            x={scaleX(CHART_YEAR_END)}
            y={ptsAmply[ptsAmply.length - 1].y - 14}
            textAnchor="middle"
            fill="#1D4ED8"
            style={{ fontSize: 14, fontWeight: 800 }}
          >
            3× efficiency
          </text>
          <text
            x={scaleX(CHART_YEAR_END)}
            y={ptsWithout[ptsWithout.length - 1].y + 22}
            textAnchor="middle"
            fill="#C2410C"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            12% drag
          </text>
        </svg>
      </figure>

      {/* Same card shell as chart figure: problem + example queries */}
      <section
        className={`${problemNarrativeCardClass} mt-8 sm:mt-10`}
        aria-labelledby="market-growth-problem-heading"
      >
        <div className="mx-auto w-full max-w-3xl">
          <span className="inline-flex rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm">
            Problem
          </span>
          <p
            id="market-growth-problem-heading"
            className="mt-4 text-pretty text-2xl font-bold tracking-tight text-gray-900 sm:mt-5 sm:text-3xl"
          >
            Wrong API pick = slow and expensive
          </p>
          <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-gray-800 sm:text-lg">
            Letting the model reason over vendors burns time and tokens. You need numbers: latency, cost, success rate, grounded in usage.
          </p>
        </div>

        <AiQueryPromptStack />
      </section>

      <section
        className={`${solutionNarrativeCardClass} mt-8 sm:mt-10`}
        aria-labelledby="market-growth-solution-heading"
      >
        <div className="mx-auto w-full max-w-3xl">
          <span className="inline-flex rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
            Solution
          </span>
          <p
            id="market-growth-solution-heading"
            className="mt-4 text-pretty text-2xl font-bold tracking-tight text-gray-900 sm:mt-5 sm:text-3xl"
          >
            200ms. One POST. A clear answer.
          </p>
          <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-gray-800 sm:text-lg">
            Amply scores services from live performance data. You get a pick, metrics, and a short why, fully structured. More tool categories over time; same contract.
          </p>

          <div className="mt-8 border-t border-gray-200/80 pt-8 sm:mt-10 sm:pt-10">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Steps
            </p>
            <ol className="mt-5 list-none space-y-5 pl-0 sm:mt-6 sm:space-y-6">
              {SOLUTION_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4 sm:gap-5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-800 sm:h-10 sm:w-10 sm:text-base"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-base font-bold text-gray-900 sm:text-lg">{step.title}</p>
                    <p className="mt-1.5 text-pretty text-sm font-medium leading-relaxed text-gray-800 sm:text-base">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
