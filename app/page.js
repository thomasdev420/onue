"use client";

import { X, Copy, Check } from "lucide-react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import MarketingFooter from "./components/marketing/MarketingFooter";
import MarketingNav from "./components/marketing/MarketingNav";
import DistributionMoatDiagram from "./components/DistributionMoatDiagram";
import AmplyApiConsole from "./components/AmplyApiConsole";
import JsonExampleBlock from "./components/landing/JsonExampleBlock";
import { HighlightBash } from "./components/landing/CodeHighlight";
import { buildCurlSnippet, DEFAULT_TASK } from "@/app/lib/amplyCurlSnippet";
import { formatDistanceToNow } from "date-fns";

function LiveBenchmarkBadge() {
  const [label, setLabel] = useState(null);
  const [stale, setStale] = useState(false);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/v1/status`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const iso = data.catalog_freshness?.metrics_as_of;
      if (!iso) {
        setLabel("Catalog timestamps unavailable (API not on live catalog)");
        setStale(false);
        setErr(null);
        return;
      }
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) {
        setLabel("Invalid metrics_as_of from API");
        setStale(false);
        setErr(null);
        return;
      }
      setStale(data.diagnostics?.catalog_metrics_stale === true);
      setLabel(
        `Catalog metrics ${formatDistanceToNow(d, { addSuffix: true })} · 24h & 7d rates in /api/v1/route`,
      );
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Status fetch failed");
      setLabel(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const ok = label && !err;
  const borderClass = stale
    ? "border-amber-500/40 bg-amber-500/10"
    : "border-emerald-500/30 bg-emerald-500/10";
  const textClass = stale ? "text-amber-950/95" : "text-emerald-900/95";
  const pingClass = stale ? "bg-amber-500" : "bg-emerald-500";
  const pingRingClass = stale ? "bg-amber-400" : "bg-emerald-400";

  const title = stale
    ? "catalog_metrics_stale is true — refresh cron or run catalog:sync"
    : "metrics_as_of from GET /api/v1/status (Postgres catalog)";

  return (
    <span
      className={`mx-auto inline-flex max-w-[min(100%,26rem)] flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-3 py-2 text-center text-[11px] font-medium leading-snug shadow-sm sm:max-w-none sm:px-4 sm:text-xs sm:leading-normal ${borderClass}`}
      title={title}
    >
      {ok ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${pingRingClass}`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${pingClass}`}
          />
        </span>
      ) : null}
      <span className={`text-balance ${textClass}`}>
        {err
          ? `Could not load catalog freshness: ${err}`
          : label ?? "Loading catalog freshness…"}
        {stale && ok ? " · stale vs freshness threshold" : ""}
      </span>
    </span>
  );
}

function useQuickstartCurl() {
  const [curl, setCurl] = useState(() =>
    buildCurlSnippet("https://www.useamply.com/api/v1/route", DEFAULT_TASK),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurl(buildCurlSnippet(`${window.location.origin}/api/v1/route`, DEFAULT_TASK));
    }
  }, []);

  return curl;
}

function QuickstartCurlCopy({ curl }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [curl]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-600/90 bg-slate-900/95 px-2.5 py-1.5 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-sm transition hover:border-cyan-500/50 hover:bg-slate-800 sm:right-3 sm:top-3 sm:px-3 sm:text-sm"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 opacity-90" strokeWidth={2} />
            Copy
          </>
        )}
      </button>
      <pre className="max-h-[min(45vh,320px)] overflow-x-auto overflow-y-auto rounded-xl border border-slate-600/90 bg-slate-950 p-4 pt-12 text-left font-mono text-[11px] leading-relaxed shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-h-[380px] sm:p-5 sm:pt-14 sm:text-[13px]">
        <HighlightBash code={curl} />
      </pre>
    </div>
  );
}

// Landing page
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const quickstartCurl = useQuickstartCurl();

  const [showDevModal, setShowDevModal] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devCodeError, setDevCodeError] = useState("");
  const [devAccessGranted, setDevAccessGranted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has("code") || urlParams.has("state");

    console.log("🔍 Auth Debug:", {
      hasOAuthParams,
      session: !!session,
      status,
      isAuthenticated,
    });

    if (hasOAuthParams) {
      console.log("✅ OAuth params detected - setting authenticated");
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (session) {
      console.log("✅ Session detected - setting authenticated");
      setIsAuthenticated(true);
    }
  }, [session, status, isAuthenticated]);

  const isUserAuthenticated = session || isAuthenticated;

  const handleDevAccessClick = () => {
    setShowDevModal(true);
    setDevCode("");
    setDevCodeError("");
    setDevAccessGranted(false);
  };

  const handleDevCodeSubmit = (e) => {
    e.preventDefault();
    if (devCode === "42069") {
      if (devAccessGranted) return;

      setDevAccessGranted(true);
      setDevCodeError("");
      localStorage.setItem("devAccessGranted", "true");

      setShowDevModal(false);
      router.push("/dashboard");
    } else {
      setDevCodeError("Incorrect code. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowDevModal(false);
    setDevCode("");
    setDevCodeError("");
    const wasGranted = localStorage.getItem("devAccessGranted") === "true";
    setDevAccessGranted(wasGranted);
  };

  useEffect(() => {
    const granted = localStorage.getItem("devAccessGranted") === "true";
    setDevAccessGranted(granted);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Google sign-in error:", error);
      window.location.href = "/dashboard";
    }
  }, []);

  const primaryCta = useMemo(() => {
    if (isUserAuthenticated) {
      return (
        <button
          type="button"
          onClick={() => (window.location.href = "/dashboard")}
          className="inline-flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition hover:scale-[1.02] hover:brightness-[1.03] active:scale-[0.98] sm:min-h-[52px] sm:px-8 sm:py-3 sm:text-base"
        >
          Go to app
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="inline-flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition hover:scale-[1.02] hover:brightness-[1.03] active:scale-[0.98] sm:min-h-[52px] sm:px-8 sm:py-3 sm:text-base"
      >
        Get Free API Key
      </button>
    );
  }, [isUserAuthenticated, handleGoogleSignIn]);

  if (status === "loading" && !isAuthenticated) {
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
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-gray-900 antialiased">
      <MarketingNav />

      <div className="relative flex flex-col items-center px-5 pb-28 pt-10 sm:px-10 sm:pb-36 sm:pt-14">
        {/* Dev Access Modal */}
        {showDevModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Developer Access</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {!devAccessGranted ? (
                <form onSubmit={handleDevCodeSubmit}>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Enter Access Code
                    </label>
                    <input
                      type="password"
                      value={devCode}
                      onChange={(e) => setDevCode(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter code..."
                      autoFocus
                    />
                    {devCodeError && (
                      <p className="mt-2 text-sm text-red-500">{devCodeError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Verify
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <div className="mb-4 text-6xl text-green-500">✓</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-800">Access Granted!</h3>
                  <p className="text-gray-600">Redirecting to dashboard...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header / Hero — single centered column (no split badge / headline row) */}
        <header
          className="mb-14 w-full max-w-3xl px-2 text-center sm:mb-20 sm:px-4"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
          }}
        >
          <div className="mb-4 flex w-full justify-center sm:mb-5">
            <LiveBenchmarkBadge />
          </div>

          <h1
            className="mx-auto max-w-4xl text-balance text-center text-[clamp(1.925rem,5.5vw,3.75rem)] font-extrabold leading-[1.12] tracking-tight text-gray-800"
            style={{ fontWeight: 800 }}
          >
            Don&apos;t make your agent think when it can know.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-sm font-medium leading-relaxed text-gray-600 sm:mt-8 sm:text-base sm:leading-relaxed">
            Amply is an API that returns real-time, machine-readable data on the best service for a given task, including
            price, speed, and reliability.
          </p>

          <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-2 items-stretch gap-2 sm:mt-10 sm:gap-4">
            <div className="min-w-0">{primaryCta}</div>
            <a
              href="/phase0-demo"
              className="inline-flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-full border-2 border-gray-300 bg-white px-2.5 py-2.5 text-center text-xs font-medium leading-snug text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[52px] sm:px-7 sm:py-3 sm:text-base sm:leading-relaxed"
            >
              <span className="text-balance">Try the Phase 0 Pinecone demo</span>
            </a>
          </div>
        </header>

        {/* Live in 60 Seconds */}
        <section
          id="quickstart"
          className="mb-16 w-full max-w-4xl scroll-mt-28 px-2 sm:mb-24 sm:px-4"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.9s ease-out 0.12s, transform 0.9s ease-out 0.12s",
          }}
        >
          <h2 className="text-balance text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Live in 60 Seconds
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-pretty text-base leading-relaxed text-gray-600">
            Three steps: get a key, copy the request, run it.
          </p>

          <div className="mt-10 space-y-5 sm:mt-12 sm:space-y-6">
            {/* Step 1 */}
            <article className="relative rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-gray-900/[0.04] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                <div className="flex shrink-0 items-start gap-3 sm:block sm:pt-0.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#3953e6] to-[#36aeea] text-base font-bold text-white shadow-md ring-4 ring-white">
                    1
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">Step 1 of 3</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Get your free API key</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Sign in with Google from the dashboard — your key is tied to your account.
                  </p>
                  {!isUserAuthenticated ? (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:brightness-[1.03]"
                    >
                      Get Free API Key
                    </button>
                  ) : (
                    <a
                      href="/dashboard"
                      className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#3953e6] to-[#36aeea] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:brightness-[1.03]"
                    >
                      Open dashboard
                    </a>
                  )}
                </div>
              </div>
            </article>

            {/* Step 2 */}
            <article className="relative rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-gray-900/[0.04] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                <div className="flex shrink-0 items-start gap-3 sm:block sm:pt-0.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#3953e6] to-[#36aeea] text-base font-bold text-white shadow-md ring-4 ring-white">
                    2
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">Step 2 of 3</p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900">Copy this curl</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      Same payload as the API console — replace <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8125rem] text-gray-800">YOUR_API_KEY</code>.
                    </p>
                  </div>
                  <div className="w-full min-w-0">
                    <QuickstartCurlCopy curl={quickstartCurl} />
                  </div>
                </div>
              </div>
            </article>

            {/* Step 3 */}
            <article className="relative rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-gray-900/[0.04] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                <div className="flex shrink-0 items-start gap-3 sm:block sm:pt-0.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#3953e6] to-[#36aeea] text-base font-bold text-white shadow-md ring-4 ring-white">
                    3
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">Step 3 of 3</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Run it</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    You get JSON with <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8125rem] text-gray-800">recommended</code>, rankings, economics, and{" "}
                    <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8125rem] text-gray-800">why</code> — wire it into your agent.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          id="product"
          className="mx-auto mb-16 mt-2 w-full max-w-3xl scroll-mt-28 px-4 sm:mb-20 sm:mt-4"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.9s ease-out 0.2s, transform 0.9s ease-out 0.2s",
          }}
        >
          <div className="rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50/50 to-white p-7 shadow-sm transition hover:shadow-md sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-800/90">
              <span aria-hidden className="mr-1">
                🔥
              </span>
              The problem
            </p>
            <h2 className="mt-3 text-balance text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl sm:leading-snug">
              Every agent today guesses, or burns time reasoning
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-gray-700 sm:text-lg sm:leading-relaxed">
              Most agents either pick an API on a whim, or spend <strong className="text-gray-900">10 to 30 seconds</strong>{" "}
              reasoning it out. That costs roughly <strong className="text-gray-900">$0.10 to $0.50 per decision</strong>,
              adds serious latency, and still produces inconsistent results.
            </p>
            <p className="mt-5 text-pretty text-base font-medium leading-relaxed text-gray-800 sm:text-lg sm:leading-relaxed">
              Multiply that across millions of agent actions, and it becomes a massive inefficiency in the system.
            </p>
          </div>
        </section>

        <section
          id="insight"
          className="mx-auto mb-16 w-full max-w-3xl scroll-mt-28 px-4 sm:mb-20"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.9s ease-out 0.28s, transform 0.9s ease-out 0.28s",
          }}
        >
          <h2 className="text-balance text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl sm:leading-snug">
            The shift is simple, and huge
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-gray-600 sm:text-lg sm:leading-relaxed">
            We&apos;re moving from <strong className="text-gray-900">humans choosing tools</strong> to{" "}
            <strong className="text-gray-900">agents choosing tools</strong>. Agents don&apos;t browse, compare, or read docs.
            They optimize for <strong className="text-gray-900">cost, speed, and reliability</strong>. Right now, that
            decision layer is effectively broken.
          </p>
        </section>

        <section
          id="solution"
          className="mx-auto mb-16 w-full max-w-3xl scroll-mt-28 px-4 sm:mb-20"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.9s ease-out 0.36s, transform 0.9s ease-out 0.36s",
          }}
        >
          <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 to-white p-7 shadow-sm transition hover:shadow-md sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
              <span aria-hidden className="mr-1">
                ⚡
              </span>
              The solution
            </p>
            <h2 className="mt-3 text-balance text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl sm:leading-snug">
              Amply: one request, the best service
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-gray-600 sm:text-lg sm:leading-relaxed">
              One request returns the best option with <strong className="text-gray-900">real price</strong>,{" "}
              <strong className="text-gray-900">real latency</strong>, and <strong className="text-gray-900">real success rate</strong>,
              in <strong className="text-gray-900">milliseconds of server-side routing</strong>—often{" "}
              <strong className="text-gray-900">under 200ms</strong> of handler work (<code className="text-sm">compute_ms</code> /{" "}
              <code className="text-sm">X-Amply-Compute-Ms</code>). Full HTTP round-trip depends on your network to the edge.
              Machine readable, ready to wire into your agent loop.
            </p>
          </div>
        </section>

        <div
          className="mx-auto flex w-full max-w-4xl flex-col gap-20 px-2 sm:gap-28 sm:px-4"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.75s ease-out 0.44s, transform 0.75s ease-out 0.44s",
          }}
        >
          <AmplyApiConsole />

          <section
            id="example"
            className="mx-auto mb-6 w-full max-w-3xl scroll-mt-28 sm:mb-10"
            aria-labelledby="example-title"
          >
            <h3 className="mx-auto m-0 flex w-full justify-center text-balance">
              <a
                id="example-title"
                href="#example"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2 text-center text-xs font-semibold leading-relaxed tracking-tight text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] sm:px-6 sm:py-2.5 sm:text-sm"
              >
                What&apos;s your agent actually receives
              </a>
            </h3>
            <div className="mt-6 sm:mt-8">
              <JsonExampleBlock titleId="example-title" />
            </div>
          </section>
        </div>

        <section
          id="how"
          className="mx-auto mb-20 mt-6 w-full max-w-5xl scroll-mt-28 px-4 sm:mb-28 sm:mt-10"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.9s ease-out 0.52s, transform 0.9s ease-out 0.52s",
          }}
        >
          <div
            className="overflow-hidden rounded-3xl border border-gray-200/80"
            style={{
              background: "linear-gradient(180deg, #141418 0%, #0a0a0c 45%, #12101a 100%)",
              boxShadow:
                "0 24px 80px rgba(57, 83, 230, 0.14), 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(99, 102, 241, 0.14), 0 0 48px rgba(56, 189, 248, 0.08), 0 0 1px rgba(165, 180, 252, 0.35)",
            }}
          >
            <div className="px-5 pb-10 pt-10 text-center sm:px-10 sm:pb-12 sm:pt-12">
              <div className="mb-5 inline-flex items-center justify-center">
                <span
                  className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/90 sm:text-sm"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  How it works
                </span>
              </div>
              <h2 className="mb-4 text-balance text-2xl font-extrabold leading-snug tracking-tight text-white sm:text-3xl md:text-4xl md:leading-tight">
                One call before the tool call
              </h2>
              <p className="mx-auto max-w-xl text-balance text-sm leading-relaxed text-white/75 sm:text-base sm:leading-relaxed">
                <span className="font-semibold text-white">POST /v1/route</span> with a task string. Amply returns the recommended service, numeric signals (cost, latency, reliability), and a short{" "}
                <span className="font-semibold text-white">why</span>: all JSON, no prose essay. Wire it into LangGraph, CrewAI, or plain HTTP.
              </p>
              <DistributionMoatDiagram />
            </div>
          </div>
        </section>

        {/* Real Use Cases */}
        <section
          id="use-cases"
          className="mb-20 w-full max-w-5xl scroll-mt-28 px-4 sm:mb-28"
        >
          <h2 className="text-center text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl">
            Real Use Cases
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-pretty text-base leading-relaxed text-gray-600">
            Where agents need a fast, grounded tool choice.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Vector DB Routing", body: "Pick the best hosted index for latency, cost, and filters." },
              { title: "Embedding Model Selection", body: "Match model dimension and throughput to workload." },
              { title: "Cost-Optimized Inference", body: "Trade off price vs SLOs with transparent economics." },
              { title: "Hybrid Search & RAG", body: "Favor providers that excel at keyword + vector blends." },
              { title: "Multi-modal Agents", body: "Route tasks that span vectors, text, and structured filters." },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-semibold leading-snug text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="mb-20 w-full max-w-5xl scroll-mt-28 px-4 sm:mb-28" aria-label="Early feedback">
          <h2 className="text-center text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl">
            Social Proof
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-gray-500">
            Early builders — see also{" "}
            <Link href="/about#testimonials" className="font-medium text-indigo-600 underline">
              customer quotes on About
            </Link>
            .
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "We cut tool-pick latency to a single HTTP round-trip. Game changer for our agent loop.",
                who: "Engineering lead",
                org: "AI startup",
              },
              {
                quote: "Finally JSON I can log and replay — not another paragraph from the model.",
                who: "Founder",
                org: "B2B SaaS",
              },
              {
                quote: "The cost and latency fields made it obvious which vector host to standardize on.",
                who: "Platform",
                org: "Enterprise team",
              },
            ].map((t, i) => (
              <blockquote
                key={i}
                className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <p className="text-sm leading-relaxed text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-xs font-medium text-gray-500">
                  — {t.who}, {t.org}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="mb-24 w-full max-w-4xl scroll-mt-28 px-4 sm:mb-32"
        >
          <h2 className="text-center text-2xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl">
            Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base leading-relaxed text-gray-600">
            Start free, scale when your agents do.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6"> </th>
                  <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6">Free</th>
                  <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6">Pro</th>
                  <th className="px-4 py-4 font-semibold text-gray-900 sm:px-6">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr className="transition hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">API access</td>
                  <td className="px-4 py-3 sm:px-6">Generous free tier</td>
                  <td className="px-4 py-3 sm:px-6">Higher limits + priority</td>
                  <td className="px-4 py-3 sm:px-6">Custom SLAs</td>
                </tr>
                <tr className="transition hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">Support</td>
                  <td className="px-4 py-3 sm:px-6">Community</td>
                  <td className="px-4 py-3 sm:px-6">Email</td>
                  <td className="px-4 py-3 sm:px-6">Dedicated</td>
                </tr>
                <tr className="transition hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">Deployment</td>
                  <td className="px-4 py-3 sm:px-6">Cloud</td>
                  <td className="px-4 py-3 sm:px-6">Cloud</td>
                  <td className="px-4 py-3 sm:px-6">VPC / hybrid options</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
            Contact sales for Enterprise pricing and volume commitments.{" "}
            <Link href="/pricing" className="font-medium text-indigo-600 underline">
              Full pricing page
            </Link>
            .
          </p>
        </section>

        <div className="mt-auto w-full max-w-4xl">
          <MarketingFooter />
          <button
            type="button"
            onClick={handleDevAccessClick}
            className="mx-auto mt-6 flex w-full justify-center text-xs font-mono font-semibold text-gray-400 underline-offset-2 transition hover:text-gray-600"
          >
            Dev Access
          </button>
          <p className="mt-8 text-center text-xs font-medium tracking-wide text-gray-400">
            A Thomas Collins production
          </p>
        </div>
      </div>
    </div>
  );
}
