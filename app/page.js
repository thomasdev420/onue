"use client";

import Link from "next/link";
import { Lightbulb, Rocket, Users, X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Landing page
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showDevModal, setShowDevModal] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devCodeError, setDevCodeError] = useState("");
  const [devAccessGranted, setDevAccessGranted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);

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
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-32 sm:px-20 font-sans text-gray-900 relative">
      <div className="absolute top-4 left-8 z-50 flex items-center gap-3">
        <button 
          onClick={handleDevAccessClick}
          className="px-3 py-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <span className="text-gray-800 font-semibold text-sm font-mono">Dev Access</span>
        </button>
        {devAccessGranted && (
          <button 
            onClick={() => {
              localStorage.removeItem("devAccessGranted");
              setDevAccessGranted(false);
              window.location.reload();
            }}
            className="px-3 py-1.5 rounded-full bg-red-200 hover:bg-red-300 transition-colors"
          >
            <span className="text-red-800 font-semibold text-sm font-mono">Clear Access</span>
          </button>
        )}
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

      {/* Navigation Bar */}
      <nav className="absolute top-4 right-8 z-50">
        <ul className="flex gap-3 items-center text-sm">
          <li>
            <Link href="/#product">
              <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">Product</span>
            </Link>
          </li>
          <li>
            <Link href="/#pricing">
              <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">Pricing</span>
            </Link>
          </li>
          {isUserAuthenticated ? (
            <>
              <li>
                <button 
                  onClick={() => window.location.href = "/dashboard"}
                  className="bg-white text-gray-500 font-semibold px-3 py-1 rounded-full shadow-sm hover:bg-gray-100 transition text-sm"
                >
                  Go to app
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    localStorage.removeItem("devAccessGranted");
                    setDevAccessGranted(false);
                    setIsAuthenticated(false);
                    window.location.reload();
                  }}
                  className="text-gray-600 hover:text-gray-800 transition cursor-pointer text-sm"
                >
                  Clear Access
                </button>
              </li>
              <li>
                <Link href="/api/auth/signout">
                  <span className="text-gray-600 hover:text-gray-800 transition cursor-pointer">Sign Out</span>
                </Link>
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={handleGoogleSignIn}
                className="bg-[#4285F4] text-white font-semibold px-3 py-1 rounded-full shadow-sm hover:bg-[#357ae8] transition text-sm"
              >
                Sign In with Google
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Header Section */}
      <header className="max-w-2xl text-center mb-12">
        {/* Version badge above main heading */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '10px', marginTop: '0' }}>
          <div style={{ display: 'inline-block', padding: '2px', borderRadius: '9999px', background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)' }}>
            <span style={{ display: 'inline-block', borderRadius: '9999px', background: '#fef9f6', fontWeight: 'bold', fontSize: '15px', color: '#222', padding: '4px 16px', lineHeight: 1.2 }}>
              Version 1.2.5
            </span>
          </div>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-800" style={{ fontWeight: 800, margin: 0, lineHeight: 1.1, textAlign: 'center', marginBottom: '18px' }}>
          Automate content<br />
          that boosts traffic to<br />
          your website
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '12px', verticalAlign: 'middle' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#E4405F' }}>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#000000' }}>
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </span>
        </h1>
        <div className="max-w-2xl text-center" style={{ marginTop: '0', marginBottom: '18px' }}>
          <p className="text-lg font-semibold text-gray-500 mb-4" style={{ marginBottom: '0', marginTop: '0' }}>
            Getting attention isn&apos;t a lottery anymore
          </p>
        </div>
        <div className="flex justify-center items-center gap-4" style={{ marginTop: '0', marginBottom: '18px' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Always show the main CTA button - it will handle auth state internally */}
            <button
              onClick={isUserAuthenticated ? () => window.location.href = "/dashboard" : handleGoogleSignIn}
              style={{
                width: '220px',
                height: '64px',
                position: 'relative',
                background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                border: 'none',
                borderRadius: '16px',
                color: 'white',
                fontSize: '24px',
                fontWeight: '600',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                transition: 'transform 0.1s ease',
                letterSpacing: '0.01em',
                overflow: 'hidden',
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
                borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
                filter: 'blur(0.5px)',
              }} />
              <span style={{ position: 'relative', zIndex: 2 }}>
                {isUserAuthenticated ? 'Go to app' : 'Try for free'}
              </span>
            </button>
            <span style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: '500',
                  cursor: 'pointer',
              transition: 'color 0.2s ease',
                }}
            onMouseEnter={e => { e.target.style.color = '#374151'; }}
            onMouseLeave={e => { e.target.style.color = '#6B7280'; }}
              >
            </span>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <Image
        src="https://reel.farm/hero.png"
        alt="Hero Image"
        width={800}
        height={400}
        className="mx-auto max-w-full h-auto"
      />

      {/* The Problem */}
      <div
        id="product"
        style={{
          borderLeft: "4px solid #F05252",
          borderRadius: 0,
          padding: "clamp(0.3rem, 1.2vw, 0.5rem) clamp(1rem, 2.5vw, 1.5rem)",
          marginBottom: "clamp(1rem, 2vw, 1.5rem)",
          marginTop: "clamp(3rem, 5vw, 6rem)",
          backgroundColor: "rgba(240, 82, 82, 0.1)",
          textAlign: "left",
          display: "inline-block",
        }}
      >
        <p
          style={{
            fontSize: "clamp(0.875rem, 1.25vw, 1.125rem)",
            lineHeight: 1.2,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#F05252",
            fontWeight: 700,
          }}
          className="mantine-focus-auto m_b6d8b162 mantine-Text-root"
        >
          The Problem
        </p>
      </div>

      {/* Problem Text */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #f87171',
        borderRadius: '18px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)',
        padding: '36px 32px',
        maxWidth: '900px',
        margin: '0 auto 40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h1
          className="text-4xl font-extrabold mb-4 tracking-tight text-center text-gray-800"
          style={{ fontWeight: "800" }}
        >
          Creating content that actually<br />
          drives results takes <span style={{ color: "red", fontWeight: "900" }}>hours</span><br />
          and often still <span style={{ color: "red", fontWeight: "900" }}>fails</span><br />
          to deliver for most founders.
        </h1>
      </div>

      {/* The Solution */}
      <div
        style={{
          borderLeft: "4px solid #22C55E",
          borderRadius: 0,
          padding: "clamp(0.3rem, 1.2vw, 0.5rem) clamp(1rem, 2.5vw, 1.5rem)",
          marginBottom: "clamp(1rem, 2vw, 1.5rem)",
          marginTop: "clamp(3rem, 5vw, 6rem)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          textAlign: "left",
          display: "inline-block",
        }}
      >
        <p
          style={{
            fontSize: "clamp(0.875rem, 1.25vw, 1.125rem)",
            lineHeight: 1.2,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#22C55E",
            fontWeight: 700,
          }}
          className="mantine-focus-auto m_b6d8b162 mantine-Text-root"
        >
          The Solution
        </p>
      </div>

      {/* Solution Text */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #22C55E',
        borderRadius: '18px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)',
        padding: '36px 32px',
        maxWidth: '900px',
        margin: '0 auto 40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h1
          className="text-4xl font-extrabold mb-4 tracking-tight text-center text-gray-800"
          style={{ fontWeight: "800" }}
        >
          Flightmedia generates and optimizes<br />
          content that learns what <span style={{ color: "#22C55E", fontWeight: "900" }}>works</span>,<br />
          so you can post <span style={{ color: "#22C55E", fontWeight: "900" }}>faster</span>,<br />
          grow <span style={{ color: "#22C55E", fontWeight: "900" }}>consistently</span> and skip the guesswork.
        </h1>
      </div>

      {/* Comparison Section */}
      <section className="max-w-7xl mx-auto mb-16 px-4 mt-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-8 text-center">
          Alternatives are <span className="text-red-600">expensive</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 items-stretch justify-items-center">
          {/* UGC Agencies */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-red-200 rounded-2xl shadow-md p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-red-400 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">UGC Agencies</span>
            </div>
            <p className="text-gray-600 mb-4">
              Expensive, charging $60-$120 per video, going upwards of $4000 to $6000 a month.
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> High cost</li>
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Limited control</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Professional quality</li>
            </ul>
          </div>
          {/* DIY Approach */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-red-200 rounded-2xl shadow-md p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-red-400 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">DIY Approach</span>
            </div>
            <p className="text-gray-600 mb-4">
              Time-consuming process: research, plan, record, edit, schedule, iterate, re-purpose, analyze…
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Time intensive</li>
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Requires expertise</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Full creative control</li>
            </ul>
          </div>
          {/* Flightmedia */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-green-300 rounded-2xl shadow-lg p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-green-400 cursor-pointer relative">
            <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Best Value</span>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">Flightmedia</span>
            </div>
            <p className="text-gray-700 mb-4">
              Automatically creates & publishes videos to all platforms for a simple monthly subscription.
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Cost effective</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Fully automated</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Multi-platform publishing</li>
            </ul>
          </div>
        </div>
        <div className="my-10 border-t border-gray-200"></div>
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">What can it do?</h3>
          <p className="text-md text-gray-700 font-medium">
            <span className="font-bold text-gray-900">Flightmedia automatically creates self-improving content that drives users to your website.</span>
            <br />
            The differentiating factor between Flightmedia and competitors is that Flightmedia takes the approach of using faceless content to automate videos. While other services require you to upload all of your video & image assets in order to create &quot;AI ads&quot;, Flightmedia believes in organic content with TikTok distribution as a means of getting leads/inbound.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Pricing</h2>
          <div className="relative flex justify-center mb-10" style={{ minHeight: 48 }}>
            <div className="bg-white rounded-2xl p-1 shadow-lg border border-gray-100 flex items-center gap-2 z-10">
              <button
                onClick={() => setIsMonthly(true)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isMonthly 
                    ? 'bg-gradient-to-r from-[#3953e6] to-[#36aeea] text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  !isMonthly 
                    ? 'bg-gradient-to-r from-[#3953e6] to-[#36aeea] text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>Yearly</span>
                {!isMonthly && (
                  <span className="ml-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm" style={{lineHeight: '1.1', fontSize: '11px'}}>
                    Save 20%
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Starter</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">
                  ${isMonthly ? Math.round(29 * 1.2) : 29}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per {isMonthly ? 'month' : 'month'}
                </span>
              </p>
              {/* Starter Plan Button (black gradient, lifted/glossy) */}
              <button
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '1rem',
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
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Buy Now</span>
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 10 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Use default 200+ UGC avatars included
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (25 images, 5 videos)
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-[#3953e6] flex flex-col items-start relative">
              <span className="absolute top-4 left-4 text-white text-xs font-semibold px-2 py-1 rounded-full" style={{background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)'}}>
                Most Popular
              </span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-8">Growth</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">
                  ${isMonthly ? Math.round(79 * 1.2) : 79}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per {isMonthly ? 'month' : 'month'}
                </span>
              </p>
              {/* Growth Plan Button (blue gradient/gloss) */}
              <button
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '1rem',
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
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Buy Now</span>
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Everything in Starter, plus...
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 50 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> AI slideshow generator access
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (100 images, 25 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Publish directly to TikTok
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Schedule and automate videos
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Scale</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">
                  ${isMonthly ? Math.round(149 * 1.2) : 149}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per {isMonthly ? 'month' : 'month'}
                </span>
              </p>
              {/* Scale Plan Button (black gradient, lifted/glossy) */}
              <button
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-block',
                  textAlign: 'center',
                  transition: 'transform 0.1s ease',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  width: '100%',
                  marginBottom: '1rem',
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
                  borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  filter: 'blur(0.5px)',
                }} />
                <span style={{ position: 'relative', zIndex: 2 }}>Buy Now</span>
              </button>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Everything in Growth, plus...
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 150 videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (200 images, 50 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Priority support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-2 left-0 w-full flex flex-col items-center gap-2 text-gray-500 text-sm">
        <div className="flex items-center gap-4">
          <span>© 2025 Flightmedia. All rights reserved.</span>
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