"use client";

import Link from "next/link";
import { Lightbulb, Rocket, Users, X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FeedbackButton from "./components/FeedbackButton";
import MarketGrowthHeroChart from "./components/MarketGrowthHeroChart";
import DistributionMoatDiagram from "./components/DistributionMoatDiagram";

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
        className="fixed left-4 top-4 z-[60] font-mono text-[11px] font-medium tabular-nums tracking-tight text-gray-500 sm:left-6 sm:top-5 sm:text-xs"
        aria-label="App version 1.4.4"
      >
        v1.4.4
      </p>
      {/* Floating Pill Navigation Bar */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-8 py-4 flex items-center space-x-8">
          {/* Logo/Brand */}
          <span className="text-xl font-bold text-gray-800">Amply</span>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#product" className="text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm">
              Product
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm">
              Pricing
            </a>
          </div>
          
          {/* Right Side - Auth & CTA */}
          <div className="flex items-center space-x-4">
            {isUserAuthenticated ? (
              // When user is logged in: only show "Go to app" button
              <button
                onClick={() => window.location.href = "/dashboard"}
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
              // When user is not logged in: show "Sign in with Google" and "Try for free" buttons
              <>
                <button
                  onClick={handleGoogleSignIn}
                  className="bg-white text-gray-700 font-semibold px-4 py-2 rounded-full border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#EA4335" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
                <button
                  onClick={handleGoogleSignIn}
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
                    Try for free
                  </span>
                </button>
              </>
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
        {/* Marketing tagline pill: same gradient “border” as the old Version badge */}
        <div className="mb-4 flex w-full justify-center sm:mb-5">
          <div
            className="inline-block rounded-full p-[2px]"
            style={{
              background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
            }}
          >
            <span
              className="home-marketing-pill-glow-pulse inline-flex items-center gap-1 rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5"
              style={{ background: '#fef9f6' }}
            >
              <span className="inline-block bg-gradient-to-b from-[#93c5fd] from-[15%] to-[#9333ea] bg-clip-text text-sm font-bold leading-none tracking-tight text-transparent sm:text-[0.9375rem]">
                #1
              </span>
              <span className="text-sm font-bold leading-none tracking-tight text-gray-800 sm:text-[0.9375rem]">
                Marketing tool for AI
              </span>
            </span>
          </div>
        </div>
        <h1
          className="flex flex-col items-center justify-center gap-y-2 sm:gap-y-3 text-[clamp(1.925rem,5.5vw,4.125rem)] font-extrabold tracking-tight text-gray-800 mb-20 sm:mb-24 px-1"
          style={{ fontWeight: 800, margin: 0, lineHeight: 1.06, textAlign: 'center' }}
        >
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-2 gap-y-2 text-balance max-w-6xl mx-auto leading-[1.03] sm:leading-[1.05]">
            <span className="shrink-0">Make</span>
            <span
              role="group"
              aria-label="Google, ChatGPT, Perplexity, and Claude"
              className="inline-flex items-center justify-center shrink-0 align-middle"
              style={{
                gap: 0,
                flexWrap: 'nowrap',
                height: '0.82em',
                marginLeft: '0.06em',
                marginRight: '0.06em',
                verticalAlign: 'middle',
              }}
            >
              {/* Google: multicolor G on light tile (back of stack) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '0.78em',
                  height: '0.78em',
                  borderRadius: '0.2em',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(66, 133, 244, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-5deg)',
                  marginLeft: 0,
                  flexShrink: 0,
                }}
                title="Google"
              >
                <svg style={{ width: '0.44em', height: '0.44em', display: 'block' }} viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#EA4335" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>

              {/* ChatGPT: white knot on black */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: '0.78em',
                  height: '0.78em',
                  borderRadius: '0.2em',
                  backgroundColor: '#000000',
                  border: '2px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-10deg)',
                  marginLeft: '-0.32em',
                  flexShrink: 0,
                }}
                title="ChatGPT"
              >
                <svg style={{ width: '0.44em', height: '0.44em', display: 'block' }} viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <path
                    fill="#FFFFFF"
                    d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
                  />
                </svg>
              </div>

              {/* Perplexity: dark mark on soft teal tile */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  width: '0.78em',
                  height: '0.78em',
                  borderRadius: '0.2em',
                  backgroundColor: '#CCFBF1',
                  border: '1px solid rgba(13, 148, 136, 0.35)',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(4deg)',
                  marginLeft: '-0.32em',
                  flexShrink: 0,
                }}
                title="Perplexity"
              >
                <svg style={{ width: '0.44em', height: '0.44em', display: 'block' }} viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <path
                    fill="#0F766E"
                    d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"
                  />
                </svg>
              </div>

              {/* Claude: white mark on terracotta (front of stack) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 4,
                  width: '0.78em',
                  height: '0.78em',
                  borderRadius: '0.2em',
                  backgroundColor: '#D97757',
                  border: '2px solid rgba(255, 255, 255, 0.75)',
                  boxShadow: '0 4px 12px rgba(217, 119, 87, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(8deg)',
                  marginLeft: '-0.32em',
                  flexShrink: 0,
                }}
                title="Claude"
              >
                <svg style={{ width: '0.44em', height: '0.44em', display: 'block' }} viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <path
                    fill="#FFFFFF"
                    d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
                  />
                </svg>
              </div>
            </span>
            <span className="shrink-0">choose</span>
          </span>
          <span className="block w-full max-w-6xl mx-auto text-center text-balance leading-[1.03] sm:leading-[1.05]">
            your product
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-balance text-sm font-medium leading-snug text-gray-500 sm:mt-4 sm:max-w-xl sm:text-base">
          Get your startup the attention it deserves
        </p>
        <div className="flex justify-center items-center gap-4 mt-6 sm:mt-8 mb-8 sm:mb-10">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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

      <MarketGrowthHeroChart isLoaded={isLoaded} />

      {/* AI selection moat: Your distribution moat */}
      <section
        id="product"
        className="w-full max-w-5xl mx-auto px-4 mb-16 sm:mb-20 mt-10 sm:mt-14"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s ease-out 0.65s, transform 0.9s ease-out 0.65s',
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
                Your distribution moat
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 text-balance leading-tight">
              Meet the AI selection engine
            </h2>
            <p className="text-sm sm:text-base text-white/75 max-w-2xl mx-auto leading-relaxed text-balance">
              Gemini, ChatGPT, Copilot, Perplexity, and Claude are{' '}
              <span className="text-white font-semibold">filtering, comparing, and picking products</span> to
              recommend and buy, including your competitors. Other tools show where you&apos;re invisible.&nbsp;
              <span className="text-white font-semibold">Amply</span> gets your product story and catalog into the answer so
              your brand gets recommended first.
            </p>
            <DistributionMoatDiagram />
          </div>
        </div>
      </section>

      {/* Testimonials: single block on page canvas */}
      <section
        className="w-full bg-[#FAF9F6] px-4 py-16 sm:py-20"
        aria-labelledby="landing-testimonials-heading"
      >
        <div className="mx-auto max-w-6xl rounded-3xl border border-gray-200/90 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:p-8 md:p-10 lg:p-12">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-xs font-semibold tracking-wide text-gray-600">
              Testimonials
            </span>
            <h2
              id="landing-testimonials-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Don&apos;t Take Our Word for It
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-base text-gray-600 sm:text-lg">
              See how teams are turning AI search gaps into competitive advantages.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:grid-rows-[auto_auto]">
          {/* Stat: LLM visibility */}
          <div className="flex flex-col rounded-2xl border border-orange-200/90 bg-gradient-to-b from-orange-50/95 to-amber-50/80 p-6 shadow-sm md:col-span-1">
            <p className="text-sm font-semibold text-gray-800">Increased LLM visibility</p>
            <div className="relative mt-4 flex-1 min-h-[120px]">
              <svg className="h-full w-full" viewBox="0 0 120 72" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="llmAreaGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.45" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 58 L 12 52 L 28 48 L 44 38 L 62 28 L 82 18 L 100 10 L 120 6 L 120 72 L 0 72 Z"
                  fill="url(#llmAreaGrad)"
                />
                <path
                  d="M 0 58 L 12 52 L 28 48 L 44 38 L 62 28 L 82 18 L 100 10 L 120 6"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg border border-orange-100 bg-white px-2 py-1 text-xs font-bold text-gray-900 shadow-md">
                <span className="text-emerald-600" aria-hidden>
                  ↑
                </span>
                +47%
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-orange-200/60 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-sky-500 text-[10px] font-bold text-white">
                L
              </span>
              <span className="text-sm font-semibold text-gray-800">Levanta</span>
            </div>
          </div>

          {/* Stat: citations */}
          <div className="flex flex-col rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-violet-50/70 p-6 shadow-sm md:col-span-1">
            <p className="text-sm font-semibold text-indigo-950">Citations coverage</p>
            <div className="relative mx-auto mt-2 flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e0e7ff" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeDasharray="75 25"
                  strokeLinecap="round"
                  pathLength="100"
                />
              </svg>
              <span className="absolute text-lg font-bold text-indigo-900">75%</span>
            </div>
            <div className="mt-auto flex justify-center border-t border-indigo-200/50 pt-4">
              <span className="text-lg font-bold tracking-tight text-indigo-950">omio</span>
            </div>
          </div>

          {/* Quote: Marcus */}
          <article className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-left text-sm font-medium leading-relaxed text-gray-800 sm:text-base">
              &ldquo;I&apos;ve never seen such huge ROAS anywhere else. I was able to take my e-com stores to rank in
              almost all of our core topics in our niche, which has led to over $1M extra revenue since
              January.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
              <div
                className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 ring-2 ring-white shadow"
                aria-hidden
              />
              <div className="text-left">
                <p className="font-bold text-gray-900">Marcus A</p>
                <p className="text-sm text-gray-500">eCom</p>
              </div>
            </div>
          </article>

          {/* Quote: Michal */}
          <article className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-left text-sm font-medium leading-relaxed text-gray-800 sm:text-base">
              &ldquo;The tool really made our work so much easier, we&apos;re able to give our clients not only good
              results, but with less effort from our side. We&apos;ve been with CrowdReply since they started,
              primarily for Reddit marketing, but now we&apos;re also able to offer AI visibility to our
              clients.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
              <div
                className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 ring-2 ring-white shadow"
                aria-hidden
              />
              <div className="text-left">
                <p className="font-bold text-gray-900">Michal H</p>
                <p className="text-sm text-gray-500">Redditera</p>
              </div>
            </div>
          </article>

          {/* Quote: Adrina */}
          <article className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-left text-sm font-medium leading-relaxed text-gray-800 sm:text-base">
              &ldquo;Our app launched 4 months ago and ranking on LLMs have driven more traffic than paid ads for us.
              We&apos;ve tried to get our brand into all the relevant Reddit citations that we see LLMs citing
              from.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
              <div
                className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-600 ring-2 ring-white shadow"
                aria-hidden
              />
              <div className="text-left">
                <p className="font-bold text-gray-900">Adrina W</p>
                <p className="text-sm text-gray-500">App</p>
              </div>
            </div>
          </article>
        </div>
        </div>
      </section>

      {/* Pricing Section (last) */}
      <section id="pricing" className="pt-16 pb-8 bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Pricing</h2>
          <div className="relative flex justify-center items-center mb-10" style={{ minHeight: 48 }}>
            <div className="bg-white rounded-2xl p-1 shadow-lg border border-gray-100 flex items-center gap-2 z-10 relative">
              <button
                onClick={() => setIsMonthly(true)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm ${
                  isMonthly 
                    ? 'bg-gradient-to-r from-[#3953e6] to-[#36aeea] text-white shadow-md' 
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm relative ${
                  !isMonthly 
                    ? 'bg-gradient-to-r from-[#3953e6] to-[#36aeea] text-white shadow-md' 
                    : 'text-gray-600'
                }`}
              >
                Yearly
              </button>
              <span className={`absolute -right-24 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm ${!isMonthly ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} style={{lineHeight: '1.1', fontSize: '11px', visibility: !isMonthly ? 'visible' : 'hidden'}}>
                Save 20%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start relative">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Starter</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">
                  ${isMonthly ? 100 : 80}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per month
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
                  <span className="text-[#3953e6] mr-2">✔</span> Use default 100+ UGC avatars included
                </li>
                  <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> AI slideshow generator access
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-8">Pro</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">
                  ${isMonthly ? 250 : 200}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per month
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
                  <span className="text-[#3953e6] mr-2">✔</span> Generate 50  videos per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Create your own AI avatars (100 images, 25 videos)
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Publish directly to TikTok, LinkedIn, and Instagram
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Schedule and automate videos
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start relative">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Scale</h3>
              <p className="mb-4">
                <span className="text-gray-800 font-bold text-3xl">
                  ${isMonthly ? 500 : 400}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per month
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
                <li className="flex items-center text-gray-600">
                  <span className="text-[#3953e6] mr-2">✔</span> Self improving content(learns what gets the most engagement)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-2 left-0 w-full flex flex-col items-center gap-2 text-gray-500 text-sm">
        <div className="flex items-center gap-4">
          <span>© 2025 Amply. All rights reserved.</span>
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