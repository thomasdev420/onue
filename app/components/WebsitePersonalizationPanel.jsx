'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { Globe, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { loadUserWork, saveUserWork } from '../services/persistenceService';
import { resetBusinessContextCache } from '../services/businessContextService';

/** Matches /api/user/context dev behaviour; only used when NODE_ENV is development. */
const DEV_WORK_USER_EMAIL = 'dev@local.com';

/**
 * Vaporware / demo: no OpenAI, no server ingest. Plausible mock from the hostname.
 * Set NEXT_PUBLIC_WEBSITE_PERSONALIZATION_LIVE=1 to call the real API instead.
 */
const LIVE_SCAN = process.env.NEXT_PUBLIC_WEBSITE_PERSONALIZATION_LIVE === '1';

function normalizeUrlInput(raw) {
  const t = raw.trim();
  if (!t) return 'https://example.com';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function buildMockScanResult(rawUrl) {
  const websiteUrl = normalizeUrlInput(rawUrl);
  let host = 'example.com';
  try {
    host = new URL(websiteUrl).hostname.replace(/^www\./i, '');
  } catch {
    /* keep default */
  }
  const slug = host.split('.')[0] || 'brand';
  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  const canonical = {
    name: `${title}: storefront`,
    brand: title,
    category: 'E-commerce',
    niche: 'Digital commerce',
    price_hint: null,
    differentiators: ['Curated catalog', 'Fast checkout', 'Trusted by shoppers'],
    target_customer: 'Online buyers researching quality options',
    summary: `${title} presents a modern shopping experience with clear product stories and streamlined discovery.`,
  };
  const extractedData = {
    companyName: title,
    productType: `${canonical.category} · ${canonical.niche}`,
    productInfo: `${canonical.summary}\n\nDifferentiators: ${canonical.differentiators.join('; ')}.`,
    companyUrl: websiteUrl,
  };
  const businessInfo = {
    companyName: title,
    productType: extractedData.productType,
    description: canonical.summary,
  };
  return { ok: true, websiteUrl, extractedData, businessInfo, canonical };
}

export default function WebsitePersonalizationPanel() {
  const { data: session, status } = useSession();
  const isDev = process.env.NODE_ENV === 'development';
  const workUserEmail = session?.user?.email || (isDev ? DEV_WORK_USER_EMAIL : null);
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const consoleEndRef = useRef(null);
  const cancelledRef = useRef(false);
  const timersRef = useRef({ interval: null, timeouts: [] });

  const busy = phase === 'scanning';

  const addScanLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs((prev) => [...prev, { message, type, timestamp }]);
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [scanLogs]);

  useEffect(() => {
    if (!scanModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [scanModalOpen]);

  function cleanupTimers() {
    const { interval, timeouts } = timersRef.current;
    if (interval != null) {
      window.clearInterval(interval);
      timersRef.current.interval = null;
    }
    timeouts.forEach((id) => window.clearTimeout(id));
    timersRef.current.timeouts = [];
  }

  function handleCancelScan() {
    cancelledRef.current = true;
    cleanupTimers();
    setScanModalOpen(false);
    setPhase('idle');
    setScanProgress(0);
    setScanLogs([]);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSummary(null);
    setScanLogs([]);
    setScanProgress(0);
    cancelledRef.current = false;

    if (!workUserEmail) {
      setError('Sign in to scan your website and save personalization.');
      setPhase('error');
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter your website URL.');
      setPhase('error');
      return;
    }

    setScanModalOpen(true);
    setPhase('scanning');

    let currentProgress = 0;
    /** Hoisted so catch can avoid duplicate console lines */
    let errorAlreadyInConsole = false;

    timersRef.current.interval = window.setInterval(() => {
      if (currentProgress < 85) {
        currentProgress += Math.random() * 3 + 1;
        setScanProgress(Math.min(currentProgress, 85));
      }
    }, 200);

    const schedule = (ms, fn) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.timeouts.push(id);
    };

    schedule(0, () => addScanLog('🔍 Starting website scan...', 'info'));
    schedule(0, () => addScanLog(`📡 Connecting to: ${trimmed}`, 'info'));
    schedule(500, () => addScanLog('✅ Connection established', 'success'));
    schedule(1000, () => addScanLog('📄 Fetching HTML content...', 'info'));
    schedule(1500, () => addScanLog('🔍 Parsing page structure...', 'info'));
    schedule(2000, () => addScanLog('📊 Extracting metadata...', 'info'));

    try {
      let data;

      if (!LIVE_SCAN) {
        await new Promise((r) => window.setTimeout(r, 2400));
        if (cancelledRef.current) return;
        cleanupTimers();
        data = buildMockScanResult(trimmed);
      } else {
        const res = await fetch('/api/user/website-personalization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        data = await res.json().catch(() => ({}));
        cleanupTimers();
        if (cancelledRef.current) return;

        if (!res.ok) {
          addScanLog(`❌ Scan failed: ${data.error || 'Unknown error'}`, 'error');
          errorAlreadyInConsole = true;
          throw new Error(data.error || `Request failed (${res.status})`);
        }
      }

      if (cancelledRef.current) return;

      addScanLog('✅ HTML content fetched successfully', 'success');

      const c = data.canonical || {};
      const ex = data.extractedData || {};
      if (c.name || c.brand) {
        addScanLog(`📝 Title: ${c.brand || c.name || 'Not found'}`, 'data');
      }
      if (c.summary) {
        const s = String(c.summary);
        addScanLog(
          `📄 Description: ${s.length > 160 ? `${s.slice(0, 160)}…` : s}`,
          'data'
        );
      }
      addScanLog(`🏢 Company: ${ex.companyName || 'Not found'}`, 'data');
      addScanLog(`📦 Product Type: ${ex.productType || 'Not found'}`, 'data');
      if (c.target_customer) {
        addScanLog(`🎯 Target Audience: ${c.target_customer}`, 'data');
      }
      if (Array.isArray(c.differentiators) && c.differentiators.length) {
        addScanLog(`💡 Key differentiators: ${c.differentiators.slice(0, 4).join('; ')}`, 'data');
      }
      addScanLog('🎉 Scan completed successfully!', 'success');

      setScanProgress(100);
      await new Promise((r) => window.setTimeout(r, 900));
      if (cancelledRef.current) return;

      const email = workUserEmail;
      let prev = {};
      try {
        prev = (await loadUserWork(email, 'onboarding')) || {};
      } catch {
        prev = {};
      }

      const next = {
        ...prev,
        websiteUrl: data.websiteUrl,
        extractedData: data.extractedData,
        businessInfo: data.businessInfo,
        completedAt: new Date().toISOString(),
        lastWebsiteScanAt: new Date().toISOString(),
      };

      addScanLog('💾 Saving personalization to workspace…', 'info');
      const { error: saveErr } = await saveUserWork(email, 'onboarding', next);
      if (saveErr) {
        addScanLog(`❌ Save failed: ${saveErr}`, 'error');
        errorAlreadyInConsole = true;
        throw new Error(saveErr);
      }
      addScanLog('✅ Profile saved', 'success');

      resetBusinessContextCache();
      setSummary({
        companyName: data.extractedData?.companyName,
        productType: data.extractedData?.productType,
        websiteUrl: data.websiteUrl,
      });
      setPhase('success');
      setUrl('');
      await new Promise((r) => window.setTimeout(r, 1200));
      setScanModalOpen(false);
      setScanLogs([]);
      setScanProgress(0);
    } catch (err) {
      cleanupTimers();
      if (cancelledRef.current) return;
      if (!errorAlreadyInConsole) {
        addScanLog(`❌ ${err.message || 'Something went wrong.'}`, 'error');
      }
      setError(err.message || 'Something went wrong.');
      setPhase('error');
      setScanProgress(0);
    }
  }

  const showVaporwareHint = !LIVE_SCAN;

  const scanModal =
    scanModalOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
      >
        <span id="scan-modal-title" className="sr-only">
          Scan console
        </span>
        <div
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          aria-hidden
          onClick={phase === 'error' || !busy ? handleCancelScan : undefined}
        />
        <div className="relative w-full max-w-[min(96vw,56rem)] sm:max-w-[min(92vw,64rem)]">
          <div className="overflow-hidden rounded-2xl border border-gray-700/90 bg-gray-950 shadow-2xl shadow-black/50 ring-1 ring-white/5">
            {/* Fixed tall viewport: lines flow top → bottom; height does not grow with content */}
            <div className="flex h-[min(76vh,820px)] flex-col bg-[#0c0e12] sm:h-[min(82vh,900px)]">
              <div className="flex shrink-0 items-center gap-3 border-b border-gray-800/90 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                  <div className="flex shrink-0 gap-1.5" aria-hidden>
                    <div className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
                    <div className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
                    <div className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="truncate font-mono text-sm tracking-tight text-gray-500 sm:text-base">
                    Scan Console
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {busy ? (
                    <button
                      type="button"
                      onClick={handleCancelScan}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200 sm:px-3"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCancelScan}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-200"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-4"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
              >
                <div className="flex w-full flex-col gap-1.5">
                  {scanLogs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="flex items-start gap-3 font-mono text-sm leading-relaxed sm:text-[0.9375rem]"
                    >
                      <span className="min-w-[4.5rem] shrink-0 text-gray-600 sm:min-w-[5rem]">{log.timestamp}</span>
                      <span
                        className={
                          log.type === 'error'
                            ? 'text-red-400'
                            : log.type === 'success'
                              ? 'text-green-400'
                              : log.type === 'data'
                                ? 'text-sky-400'
                                : 'text-gray-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {scanLogs.length === 0 && (
                    <div className="font-mono text-sm text-gray-600 sm:text-base">Waiting for scan to begin...</div>
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 bg-[#080a0d] px-4 py-4 sm:px-6 sm:py-5">
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-gray-800 sm:h-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <section
      className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 p-5 sm:p-6 shadow-sm"
      aria-labelledby="website-personalization-heading"
    >
      {scanModal}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
          <Globe className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              id="website-personalization-heading"
              className="text-lg sm:text-xl font-bold text-gray-900"
            >
              Personalize from your website
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              <Sparkles className="h-3 w-3" aria-hidden />
              AI scan
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
            Paste your store or site URL. We scan the page and save company and product context so Amply can
            tailor guidance and copy to you.
          </p>

          {showVaporwareHint ? (
            <p className="mt-2 text-xs text-indigo-700/90 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              Demo mode: the scan is simulated from your URL (no keys, no live crawl). When you wire the backend,
              set <code className="text-[11px] bg-white/80 px-1 rounded">NEXT_PUBLIC_WEBSITE_PERSONALIZATION_LIVE=1</code>{' '}
              to use the real pipeline.
            </p>
          ) : null}

          <form noValidate onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <label htmlFor="personalization-url" className="sr-only">
              Website URL
            </label>
            <input
              id="personalization-url"
              type="text"
              name="url"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder="yoursite.com or https://yoursite.com"
              value={url}
              disabled={busy}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) {
                  setError('');
                  setPhase('idle');
                }
              }}
              className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!workUserEmail || busy}
              className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Scan & save
            </button>
          </form>

          {error && !scanModalOpen ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
              {error}
            </p>
          ) : null}

          {phase === 'success' && summary && (
            <div className="mt-3 flex items-start gap-2 text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden />
              <div>
                <p className="font-semibold">Saved for your workspace</p>
                <p className="mt-0.5 text-emerald-800/90">
                  <span className="font-medium">{summary.companyName}</span>
                  {summary.productType ? ` · ${summary.productType}` : ''}
                </p>
                <p className="mt-1 text-xs text-emerald-800/70 break-all">{summary.websiteUrl}</p>
              </div>
            </div>
          )}

          {isDev && !session?.user?.email && (
            <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="font-semibold">Dev mode:</span> scans run without sign-in; data saves under{' '}
              <code className="text-[11px] bg-white/80 px-1 rounded">{DEV_WORK_USER_EMAIL}</code>
              (production still requires login).
            </p>
          )}
          {!isDev && status !== 'authenticated' && (
            <p className="mt-3 text-xs text-gray-500">Sign in to use website personalization.</p>
          )}
        </div>
      </div>
    </section>
  );
}
