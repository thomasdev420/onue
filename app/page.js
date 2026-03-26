"use client";

import { X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FeedbackButton from "./components/FeedbackButton";
import DistributionMoatDiagram from "./components/DistributionMoatDiagram";
import AmplyApiConsole from "./components/AmplyApiConsole";

// Landing page
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showDevModal, setShowDevModal] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devCodeError, setDevCodeError] = useState("");
  const [devAccessGranted, setDevAccessGranted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Enhanced authentication check that works in private windows
  useEffect(() => {
    // Check if we're coming back from OAuth (URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('state');
    
    // Debug logging for private window issues
    console.log('🔍 Auth Debug:', {
      hasOAuthParams,
      session: !!session,
      status,
      isAuthenticated
    });
    
    // If we have OAuth params, we're likely authenticated
    if (hasOAuthParams) {
      console.log('✅ OAuth params detected - setting authenticated');
      setIsAuthenticated(true);
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Also check session state
    if (session) {
      console.log('✅ Session detected - setting authenticated');
      setIsAuthenticated(true);
    }
  }, [session, status, isAuthenticated]);

  // Combined auth state - use session if available, otherwise use our enhanced check
  const isUserAuthenticated = session || isAuthenticated;

  const handleDevAccessClick = () => {
    setShowDevModal(true);
    setDevCode("");
    setDevCodeError("");
    // Reset dev access state when opening modal to require code input
    setDevAccessGranted(false);
  };

  const handleDevCodeSubmit = (e) => {
    e.preventDefault();
    if (devCode === "42069") {
      // Prevent multiple submissions
      if (devAccessGranted) return;
      
      setDevAccessGranted(true);
      setDevCodeError("");
      // Store in localStorage to persist across sessions
      localStorage.setItem("devAccessGranted", "true");
      
      // Close modal immediately and redirect
      setShowDevModal(false);
      // Use router.push instead of window.location.href for better navigation
      router.push("/dashboard");
    } else {
      setDevCodeError("Incorrect code. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowDevModal(false);
    setDevCode("");
    setDevCodeError("");
    // Restore dev access state if it was previously granted
    const wasGranted = localStorage.getItem("devAccessGranted") === "true";
    setDevAccessGranted(wasGranted);
  };

  // Check if dev access was previously granted
  useEffect(() => {
    const granted = localStorage.getItem("devAccessGranted") === "true";
    setDevAccessGranted(granted);
    // Only redirect if there's a specific intent to go to dashboard
    // Don't auto-redirect from landing page
  }, []);

  // Trigger entrance animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle Google sign-in with direct redirect to dashboard (like Dev Access)
  const handleGoogleSignIn = async () => {
    try {
      // Use NextAuth signIn with redirect to dashboard
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true
      });
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      // Fallback: direct redirect like Dev Access
      window.location.href = "/dashboard";
    }
  };

  // Show loading state while session is being determined (but allow OAuth redirects)
  if (status === 'loading' && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center px-6 py-32 sm:px-20 font-sans text-gray-900 relative" style={{ paddingTop: '120px' }}>
      <p
        className="fixed right-4 top-4 z-[60] font-mono text-[11px] font-medium tabular-nums tracking-tight text-gray-500 sm:right-6 sm:top-5 sm:text-xs"
        aria-label="App version 2.0.0"
      >
        v2.0.0
      </p>
      {/* Floating Pill Navigation Bar */}
      <div className="fixed top-4 left-1/2 z-50 w-[calc(100vw-1.25rem)] max-w-[calc(100vw-1.25rem)] -translate-x-1/2 sm:w-auto sm:max-w-none">
        <div className="flex max-w-full flex-nowrap items-center gap-4 overflow-x-auto rounded-full border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 sm:px-6 sm:py-3.5 md:gap-8 md:px-8 md:py-4 [&::-webkit-scrollbar]:hidden">
          {/* Logo/Brand */}
          <span className="shrink-0 whitespace-nowrap text-xl font-bold text-gray-800">Amply</span>

          {/* Navigation Links */}
          <div className="hidden shrink-0 flex-nowrap items-center gap-6 md:flex md:gap-8">
            <a
              href="#problem"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-gray-800"
            >
              Problem
            </a>
            <a
              href="#insight"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-gray-800"
            >
              Why it matters
            </a>
            <a
              href="#solution"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-gray-800"
            >
              Solution
            </a>
            <a
              href="#api"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-gray-800"
            >
              API
            </a>
            <a
              href="#how"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-gray-800"
            >
              How it works
            </a>
            <a
              href="/phase0-demo"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
            >
              Phase 0 demo
            </a>
          </div>

          {/* Right Side - Auth & CTA */}
          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-3 sm:gap-4">
            {isUserAuthenticated ? (
              // When user is logged in: only show "Go to app" button
              <button
                type="button"
                onClick={() => window.location.href = "/dashboard"}
                className="shrink-0 whitespace-nowrap"
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '55%',
                  borderRadius: '9999px 9999px 40% 40%/9999px 9999px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>
                  Go to app
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="shrink-0 whitespace-nowrap"
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
              >
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '55%',
                  borderRadius: '9999px 9999px 40% 40%/9999px 9999px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>
                  Get key
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-8 z-50 flex items-center gap-3">
        <button 
          onClick={handleDevAccessClick}
          className="px-3 py-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <span className="text-gray-800 font-semibold text-sm font-mono">Dev Access</span>
        </button>

      </div>

      {/* Dev Access Modal */}
      {showDevModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Developer Access</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {!devAccessGranted ? (
              <form onSubmit={handleDevCodeSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Access Code
                  </label>
                  <input
                    type="password"
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter code..."
                    autoFocus
                  />
                  {devCodeError && (
                    <p className="text-red-500 text-sm mt-2">{devCodeError}</p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Verify
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Granted!</h3>
                <p className="text-gray-600">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Header Section */}
      <header 
        className="w-full max-w-4xl text-center mb-12 px-2 sm:px-4" 
        style={{ 
          marginTop: '72px',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        }}
      >
        {/* Marketing tagline pill */}
        <div className="mb-4 flex w-full justify-center sm:mb-5">
          <div
            className="inline-block rounded-full p-px"
            style={{
              background: 'linear-gradient(90deg, rgba(91, 119, 214, 0.55) 0%, rgba(110, 184, 224, 0.5) 100%)',
            }}
          >
            <span
              className="home-marketing-pill-glow-pulse inline-flex items-center gap-1 rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5"
              style={{ background: '#fef9f6' }}
            >
              <span className="inline-block bg-gradient-to-b from-[#7ba3d9] from-[20%] to-[#8b8bd4] bg-clip-text text-sm font-semibold leading-none tracking-tight text-transparent sm:text-[0.9375rem]">
                Save your agent money and time
              </span>
            </span>
          </div>
        </div>
        <h1
          className="text-[clamp(1.925rem,5.5vw,3.75rem)] font-extrabold tracking-tight text-gray-800 mb-6 sm:mb-8 px-1 max-w-5xl mx-auto text-center"
          style={{ fontWeight: 800, lineHeight: 1.08 }}
        >
          <span className="block text-balance">
            Don&apos;t make your agent think when it can know.
          </span>
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-center text-balance text-sm font-medium leading-relaxed text-gray-600 sm:mt-2 sm:text-base">
          Amply is an API that returns real-time, machine-readable data on the best service for a given task, including
          price, speed, and reliability.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-gray-500">
          <a
            href="/phase0-demo"
            className="font-medium text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 transition-colors hover:text-indigo-800 hover:decoration-indigo-600/60"
          >
            Try the Phase 0 Pinecone demo
          </a>
          {' '}
          (live <code className="text-gray-600">/api/phase0</code>).
        </p>
      </header>

      <section
        id="problem"
        className="mx-auto mb-16 mt-6 w-full max-w-3xl px-4 sm:mb-20 sm:mt-8"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s ease-out 0.2s, transform 0.9s ease-out 0.2s',
        }}
      >
        <div className="rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50/50 to-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-800/90">
            <span aria-hidden className="mr-1">
              🔥
            </span>
            The problem
          </p>
          <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Every agent today guesses, or burns time reasoning
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-gray-700 sm:text-lg">
            Most agents either pick an API on a whim, or spend <strong className="text-gray-900">10 to 30 seconds</strong>{' '}
            reasoning it out. That costs roughly <strong className="text-gray-900">$0.10 to $0.50 per decision</strong>,
            adds serious latency, and still produces inconsistent results.
          </p>
          <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-gray-800 sm:text-lg">
            Multiply that across millions of agent actions, and it becomes a massive inefficiency in the system.
          </p>
        </div>
      </section>

      <section
        id="insight"
        className="mx-auto mb-16 w-full max-w-3xl px-4 sm:mb-20"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s ease-out 0.28s, transform 0.9s ease-out 0.28s',
        }}
      >
        <h2 className="text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          The shift is simple, and huge
        </h2>
        <p className="mt-4 text-pretty text-base leading-relaxed text-gray-600 sm:text-lg">
          We&apos;re moving from <strong className="text-gray-900">humans choosing tools</strong> to{' '}
          <strong className="text-gray-900">agents choosing tools</strong>. Agents don&apos;t browse, compare, or read docs.
          They optimize for <strong className="text-gray-900">cost, speed, and reliability</strong>. Right now, that
          decision layer is effectively broken.
        </p>
      </section>

      <section
        id="solution"
        className="mx-auto mb-16 w-full max-w-3xl px-4 sm:mb-20"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s ease-out 0.36s, transform 0.9s ease-out 0.36s',
        }}
      >
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
            <span aria-hidden className="mr-1">
              ⚡
            </span>
            The solution
          </p>
          <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Amply: one request, the best service
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-gray-600 sm:text-lg">
            One request returns the best option with <strong className="text-gray-900">real price</strong>,{' '}
            <strong className="text-gray-900">real latency</strong>, and <strong className="text-gray-900">real success rate</strong>,
            in <strong className="text-gray-900">under 200ms</strong>. Machine readable, ready to wire into your agent loop.
          </p>
        </div>
      </section>

      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-24 px-2 sm:gap-32 sm:px-4"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.75s ease-out 0.44s, transform 0.75s ease-out 0.44s',
        }}
      >
        <AmplyApiConsole />

        {/* Example API response (below Copy a request) */}
        <section
          id="example"
          className="mx-auto mb-10 w-full max-w-3xl px-2 sm:mb-14 sm:px-0"
          aria-labelledby="example-title"
        >
          <h3 className="mx-auto m-0 flex w-full justify-center text-balance">
            <a
              id="example-title"
              href="#example"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2 text-center text-xs font-semibold leading-snug tracking-tight text-gray-900 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] sm:px-6 sm:py-2.5 sm:text-sm"
            >
              What&apos;s your agent actually receives
            </a>
          </h3>
          <pre
            className="mt-5 max-h-[min(70vh,520px)] overflow-auto rounded-xl border border-gray-200 bg-slate-950 p-4 text-left font-mono text-[12px] leading-relaxed text-slate-200 sm:mt-6 sm:p-5 sm:text-sm"
            tabIndex={0}
          >
{`{
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
}`}
          </pre>
        </section>
      </div>

      {/* AI selection moat: Your distribution moat */}
      <section
        id="how"
        className="mx-auto mb-28 mt-12 w-full max-w-5xl px-4 sm:mb-36 sm:mt-16"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s ease-out 0.52s, transform 0.9s ease-out 0.52s',
        }}
      >
        <div
          className="rounded-3xl overflow-hidden border border-gray-200/80"
          style={{
            background: 'linear-gradient(180deg, #141418 0%, #0a0a0c 45%, #12101a 100%)',
            boxShadow:
              '0 24px 80px rgba(57, 83, 230, 0.14), 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(99, 102, 241, 0.14), 0 0 48px rgba(56, 189, 248, 0.08), 0 0 1px rgba(165, 180, 252, 0.35)',
          }}
        >
          <div className="text-center px-5 sm:px-10 pt-10 sm:pt-12 pb-10 sm:pb-12">
            <div className="inline-flex items-center justify-center mb-5">
              <span
                className="text-xs sm:text-sm font-semibold tracking-wide text-white/90 px-4 py-1.5 rounded-full border border-white/15"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                How it works
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 text-balance leading-tight">
              One call before the tool call
            </h2>
            <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto leading-relaxed text-balance">
              <span className="text-white font-semibold">POST /v1/route</span> with a task string. Amply returns the recommended service, numeric signals (cost, latency, reliability), and a short{' '}
              <span className="text-white font-semibold">why</span>: all JSON, no prose essay. Wire it into LangGraph, CrewAI, or plain HTTP.
            </p>
            <DistributionMoatDiagram />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-2 left-0 w-full flex flex-col items-center gap-2 text-gray-500 text-sm">
        <div className="flex items-center gap-4">
          <span>© 2026 Amply. All rights reserved.</span>
          <a
            href="/privacy-policy"
            className="px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-500 font-semibold hover:bg-blue-50 hover:text-blue-800 transition"
            style={{ fontSize: '14px' }}
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            className="px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-500 font-semibold hover:bg-blue-50 hover:text-blue-800 transition"
            style={{ fontSize: '14px' }}
          >
            Terms of Service
          </a>
        </div>
      </footer>

      <style>
        {`
        `}
      </style>
    </div>
  );
}