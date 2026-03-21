'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Hero visual: exponential curve 2026 to 2030 for estimated share of buying decisions
 * influenced or mediated by AI (illustrative %, not financial market size).
 */

/** Logo tiles + SVG paths match `app/page.js` hero title (Google, ChatGPT, Perplexity, Claude). */
const LANDING_LOGO_TILE = {
  google: {
    style: {
      width: '2.75rem',
      height: '2.75rem',
      borderRadius: '0.55rem',
      backgroundColor: '#F8FAFC',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'rotate(-5deg)',
      flexShrink: 0,
    },
  },
  chatgpt: {
    style: {
      width: '2.75rem',
      height: '2.75rem',
      borderRadius: '0.55rem',
      backgroundColor: '#000000',
      border: '2px solid rgba(255, 255, 255, 0.85)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'rotate(-10deg)',
      flexShrink: 0,
    },
  },
  perplexity: {
    style: {
      width: '2.75rem',
      height: '2.75rem',
      borderRadius: '0.55rem',
      backgroundColor: '#CCFBF1',
      border: '1px solid rgba(13, 148, 136, 0.35)',
      boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'rotate(4deg)',
      flexShrink: 0,
    },
  },
  claude: {
    style: {
      width: '2.75rem',
      height: '2.75rem',
      borderRadius: '0.55rem',
      backgroundColor: '#D97757',
      border: '2px solid rgba(255, 255, 255, 0.75)',
      boxShadow: '0 4px 12px rgba(217, 119, 87, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'rotate(8deg)',
      flexShrink: 0,
    },
  },
};

function LandingLogoGoogle() {
  return (
    <div style={{ position: 'relative', zIndex: 1, ...LANDING_LOGO_TILE.google.style }} title="Google">
      <svg
        className="block shrink-0"
        style={{ width: '1.55rem', height: '1.55rem' }}
        viewBox="0 0 24 24"
        role="img"
        aria-hidden
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#EA4335"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#34A853"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    </div>
  );
}

function LandingLogoChatGPT() {
  return (
    <div style={{ position: 'relative', zIndex: 2, ...LANDING_LOGO_TILE.chatgpt.style }} title="ChatGPT">
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

function LandingLogoPerplexity() {
  return (
    <div style={{ position: 'relative', zIndex: 3, ...LANDING_LOGO_TILE.perplexity.style }} title="Perplexity">
      <svg
        className="block shrink-0"
        style={{ width: '1.55rem', height: '1.55rem' }}
        viewBox="0 0 24 24"
        role="img"
        aria-hidden
      >
        <path
          fill="#0F766E"
          d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"
        />
      </svg>
    </div>
  );
}

function LandingLogoClaude() {
  return (
    <div style={{ position: 'relative', zIndex: 4, ...LANDING_LOGO_TILE.claude.style }} title="Claude">
      <svg
        className="block shrink-0"
        style={{ width: '1.55rem', height: '1.55rem' }}
        viewBox="0 0 24 24"
        role="img"
        aria-hidden
      >
        <path
          fill="#FFFFFF"
          d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
        />
      </svg>
    </div>
  );
}

const QUERY_ROTATE_MS = 4200;

/** Solution section: how Amply works, in order (three steps). */
const SOLUTION_STEPS = [
  {
    title: 'Connect your catalog',
    body: 'Paste your product or site URL so Amply knows what you sell and how you want to sound.',
  },
  {
    title: 'See how AI answers, and where you stand',
    body: 'We run category questions and score visibility, positioning vs competitors, and whether you’re the top pick.',
  },
  {
    title: 'Close the gap and re-run',
    body: 'Fix copy and proof from the guidance, then re-run to track progress.',
  },
];

/** Same card pattern as existing slides; logos match landing hero only. */
const AI_QUERY_SLIDES = [
  {
    id: 'google-analytics',
    Logo: LandingLogoGoogle,
    text: 'Top analytics tools for ecommerce',
    cardExtra: '',
  },
  {
    id: 'chatgpt-design',
    Logo: LandingLogoChatGPT,
    text: 'Easy design tools for non designers',
    cardExtra: '',
  },
  {
    id: 'perplexity-crm',
    Logo: LandingLogoPerplexity,
    text: 'Best CRM for B2B companies?',
    /** Keep solid surface like other slides: no opacity / frosted look */
    cardExtra: '',
  },
  {
    id: 'claude-pm',
    Logo: LandingLogoClaude,
    text: 'Best project management software for remote teams',
    cardExtra: '',
  },
  {
    id: 'google-email',
    Logo: LandingLogoGoogle,
    text: 'Affordable email marketing tools for startups',
    cardExtra: '',
  },
  {
    id: 'chatgpt-payroll',
    Logo: LandingLogoChatGPT,
    text: 'How do I compare payroll providers for a 50-person company?',
    cardExtra: '',
  },
  {
    id: 'perplexity-docs',
    Logo: LandingLogoPerplexity,
    text: 'Notion alternatives for internal documentation',
    cardExtra: '',
  },
  {
    id: 'claude-security',
    Logo: LandingLogoClaude,
    text: 'Explain zero trust security in simple terms for executives',
    cardExtra: '',
  },
];

/** Rotating query cards: same brand tiles as the landing hero title. */
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
        Example query: {AI_QUERY_SLIDES[active].text}
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
  const chartTravelGlowFilterId = `mg-line-glow-${useId().replace(/:/g, '')}`;

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

  /** % of buying decisions (AI-influenced / agent-mediated): chart endpoints. */
  const pctChartStart = 28;
  const pctEnd = 82;

  const padL = 72;
  const padR = 48;
  const padT = 40;
  /** Extra bottom space for year labels + subtitle below the plot. */
  const padB = 82;
  const W = 920;
  const H = 348;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const scaleX = (year) => padL + ((year - CHART_YEAR_START) / CHART_SPAN) * innerW;
  const scaleY = (pct) =>
    padT + (1 - (pct - pctChartStart) / (pctEnd - pctChartStart)) * innerH;

  /** pct(t) = pctStart * (pctEnd/pctStart)^t, t ∈ [0,1] from 2026 to 2030. */
  const valueAtT = (t) => pctChartStart * (pctEnd / pctChartStart) ** t;

  const startValueLabel = `~${Math.round(pctChartStart)}%`;

  const STEPS = 96;
  const pts = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const year = CHART_YEAR_START + CHART_SPAN * t;
    const v = valueAtT(t);
    return { x: scaleX(year), y: scaleY(v) };
  });

  const lineD = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const bottomY = padT + innerH;
  const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(2)} ${bottomY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${bottomY.toFixed(2)} Z`;

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
        aria-label="Your customer has changed. AI agents are already recommending and starting to buy products for users. When someone asks what to buy, AI decides what gets chosen. If your product is not easy for AI to understand, compare, and trust, it will not be picked. The new game is not convincing people, it is convincing AI. Line chart shows estimated share of buying decisions influenced by AI, rising from about 28 percent in 2026 to about 82 percent in 2030."
      >
        <figcaption className="mb-4 text-center sm:mb-5">
          <p className="text-lg font-bold tracking-tight text-gray-800 sm:text-2xl">
            Your customer has changed
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-pretty text-sm font-medium leading-relaxed text-gray-800 sm:text-base">
            AI agents are already recommending and starting to buy products for users. When someone asks what to buy, AI decides what gets chosen. If your product is not easy for AI to understand, compare, and trust, it will not be picked.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-pretty text-center text-sm font-bold leading-relaxed text-gray-800 sm:mt-4 sm:text-base">
            The new game is not convincing people, it is convincing AI.
          </p>
        </figcaption>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="marketGrowthFill" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#3953e6" stopOpacity="0.06" />
              <stop offset="55%" stopColor="#36aeea" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id="marketGrowthStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3953e6" />
              <stop offset="100%" stopColor="#36aeea" />
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

          <path d={areaD} fill="url(#marketGrowthFill)" />
          <path
            d={lineD}
            fill="none"
            stroke="url(#marketGrowthStroke)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pulsing glow that travels along the curve (2026 to 2030) */}
          {!prefersReducedMotion && (
            <g aria-hidden="true">
              <animateMotion
                path={lineD}
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

          {/* X labels */}
          <text x={scaleX(2026)} y={H - 42} textAnchor="middle" fill="#374151" style={{ fontSize: 15, fontWeight: 600 }}>
            2026
          </text>
          <text x={scaleX(2030)} y={H - 42} textAnchor="middle" fill="#374151" style={{ fontSize: 15, fontWeight: 600 }}>
            2030
          </text>

          {/* Value callouts */}
          <text
            x={scaleX(2026)}
            y={pts[0].y + 24}
            textAnchor="middle"
            fill="#374151"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {startValueLabel}
          </text>
          <text
            x={scaleX(2030)}
            y={pts[pts.length - 1].y - 16}
            textAnchor="middle"
            fill="#374151"
            style={{ fontSize: 15, fontWeight: 800 }}
          >
            ~{Math.round(pctEnd)}%
          </text>

          <text
            x={W / 2}
            y={H - 32}
            textAnchor="middle"
            fill="#374151"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            % of buying decisions influenced by AI
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
            AI is the new search engine. Are you visible?
          </p>
          <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-gray-800 sm:text-lg">
            Buyers are turning to ChatGPT, Perplexity, Gemini, and similar tools, not just Google, to decide
            what to buy. If you&apos;re not in the answers they trust, that demand goes to competitors, and
            the gap shows up as{' '}
            <strong className="font-bold text-gray-900">thousands of dollars in lost revenue</strong> you never
            see.
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
            Be the pick when AI answers.
          </p>
          <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-gray-800 sm:text-lg">
            Amply automatically reviews where you show up and why you don&apos;t, then makes targeted changes
            to increase your visibility to AI.
          </p>

          <div className="mt-8 border-t border-gray-200/80 pt-8 sm:mt-10 sm:pt-10">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              How it works
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
