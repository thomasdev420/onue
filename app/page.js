"use client";

import Link from "next/link";
import { Lightbulb, Rocket, Users, X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FeedbackButton from "./components/FeedbackButton";

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
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);
  const [devMode, setDevMode] = useState(false);
  
  // Developer access - type 'cayla' to toggle landing page view
  const [typedKeys, setTypedKeys] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const newTypedKeys = typedKeys + e.key.toLowerCase();
      
      if (newTypedKeys.includes('cayla')) {
        setDevMode(prev => !prev);
        console.log('Dev mode toggled:', !devMode);
        setTypedKeys(''); // Reset after successful trigger
      } else if (newTypedKeys.length >= 5) {
        setTypedKeys(''); // Reset if too long
      } else {
        setTypedKeys(newTypedKeys);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typedKeys, devMode]);
  
  // Coming soon page stays until manually removed
  // Remove this useEffect when ready to launch

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

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfWeek = new Date();
      
      // Set to end of current week (Sunday 23:59:59)
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      const difference = endOfWeek - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setCountdown({ days, hours, minutes, seconds });
        console.log('Countdown updated:', { days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
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

  // Coming Soon Page (unless dev mode is active)
  if (showComingSoon && !devMode) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Black bordered content area */}
        <div className="relative w-11/12 max-w-6xl h-[600px] border-4 border-black rounded-3xl overflow-hidden" style={{ 
          backgroundImage: 'radial-gradient(circle at 30% 20%, #B8D8FF 0%, #A8D0FF 8%, #98C8FF 16%, #88C0FF 24%, #78B8FF 32%, #68B0FF 40%, #58A8FF 48%, #48A0FF 56%, #38A0FF 64%, #28A0FF 72%, #18A0FF 80%, #0A90FF 88%, #0080FF 96%, #0070FF 100%), radial-gradient(circle at 70% 80%, #B8D8FF 0%, #A8D0FF 8%, #98C8FF 16%, #88C0FF 24%, #78B8FF 32%, #68B0FF 40%, #58A8FF 48%, #48A0FF 56%, #38A0FF 64%, #28A0FF 72%, #18A0FF 80%, #0A90FF 88%, #0080FF 96%, #0070FF 100%), linear-gradient(45deg, #B8D8FF 0%, #A8D0FF 10%, #98C8FF 20%, #88C0FF 30%, #78B8FF 40%, #68B0FF 50%, #58A8FF 60%, #48A0FF 70%, #38A0FF 80%, #28A0FF 90%, #18A0FF 100%)',
          backgroundSize: '200% 200%, 200% 200%, 200% 200%',
          backgroundPosition: '0% 0%, 100% 100%, 0% 0%',
          animation: 'gradientFlow 20s ease-in-out infinite'
        }}>
          {/* Vertical texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)'
          }}></div>
          
                            <div className="text-center relative z-10 flex flex-col items-center justify-center h-full">
          <div className="text-6xl font-serif italic text-white mb-4">
            Amply is coming
          </div>
          <div className="font-mono text-lg text-white/80">
            attention is everything
          </div>
          

        </div>
        

        </div>
        
        <style jsx>{`
          @keyframes gradientFlow {
            0% { 
              background-position: 0% 0%, 100% 100%, 0% 0%;
            }
            25% { 
              background-position: 100% 0%, 0% 100%, 100% 100%;
            }
            50% { 
              background-position: 100% 100%, 0% 0%, 0% 100%;
            }
            75% { 
              background-position: 0% 100%, 100% 0%, 100% 0%;
            }
            100% { 
              background-position: 0% 0%, 100% 100%, 0% 0%;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center px-6 py-32 sm:px-20 font-sans text-gray-900 relative" style={{ paddingTop: '120px' }}>
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
        className="max-w-2xl text-center mb-12" 
        style={{ 
          marginTop: '80px',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        }}
      >
        {/* Version badge above main heading */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '10px', marginTop: '0' }}>
          <div style={{ display: 'inline-block', padding: '2px', borderRadius: '9999px', background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)' }}>
            <span style={{ display: 'inline-block', borderRadius: '9999px', background: '#fef9f6', fontWeight: 'bold', fontSize: '15px', color: '#222', padding: '4px 16px', lineHeight: 1.2 }}>
              Version 1.4.4
            </span>
          </div>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-800" style={{ fontWeight: 800, margin: 0, lineHeight: 1.1, textAlign: 'center', marginBottom: '18px' }}>
          Automate TikToks<br />
          that drive traffic to<br />
          your startup
          <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '4px', marginLeft: '12px', verticalAlign: 'middle' }}>
            {/* TikTok Logo - Rounded Square with Border and Glow */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#000000',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              transform: 'rotate(-15deg)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FFFFFF', zIndex: 2 }}>
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </div>
            
            {/* Instagram Logo - Rounded Square with Gradient Border and Glow */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 12px rgba(220, 39, 67, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              transform: 'rotate(15deg)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#FFFFFF', zIndex: 2 }}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </span>
        </h1>
        <div className="max-w-2xl text-center" style={{ marginTop: '0', marginBottom: '18px' }}>
          <p className="text-lg font-semibold text-gray-500 mb-4" style={{ marginBottom: '0', marginTop: '0' }}>
          Get startup growth without a growth team
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
      {/* TODO: Replace with your downloaded running slide image */}
      {/* Steps: 
          1. Download your preferred running slide from the slides interface
          2. Upload it to a CDN or place in public/ folder
          3. Replace the src below with your image URL
      */}
      <Image
        src="/contentpage.png"
        alt="Running and Fitness Content Creation - Hero Image"
        width={900}
        height={500}
        className="mx-auto max-w-full h-auto rounded-2xl shadow-lg"
        style={{
          border: '2px solid rgba(147, 197, 253, 0.2)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: 'opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s'
        }}
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
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s'
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
        maxWidth: '900px',
        margin: '0 auto 40px auto',
        textAlign: 'center',
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(239, 68, 68, 0.1)',
      }}>
        <h2
          className="text-2xl font-bold tracking-tight text-gray-800 leading-relaxed"
          style={{ fontWeight: "700" }}
        >
          Creating content that actually drives results often takes <span style={{ color: "#DC2626", fontWeight: "900", textShadow: "0 1px 2px rgba(220, 38, 38, 0.1)" }}>hours,</span> <span style={{ color: "#DC2626", fontWeight: "900", textShadow: "0 1px 2px rgba(220, 38, 38, 0.1)" }}>costs</span> a lot, and still <span style={{ color: "#DC2626", fontWeight: "900", textShadow: "0 1px 2px rgba(220, 38, 38, 0.1)" }}>fails</span> for most founders.
        </h2>
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
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s'
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
        maxWidth: '900px',
        margin: '0 auto 40px auto',
        textAlign: 'center',
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(34, 197, 94, 0.1)',
      }}>
        <h2
          className="text-2xl font-bold tracking-tight text-gray-800 leading-relaxed"
          style={{ fontWeight: "700" }}
        >
          Amply generates and optimizes content that learns what <span style={{ color: "#16A34A", fontWeight: "900", textShadow: "0 1px 2px rgba(22, 163, 74, 0.1)" }}>works</span>, so you can post <span style={{ color: "#16A34A", fontWeight: "900", textShadow: "0 1px 2px rgba(22, 163, 74, 0.1)" }}>faster</span>, grow <span style={{ color: "#16A34A", fontWeight: "900", textShadow: "0 1px 2px rgba(22, 163, 74, 0.1)" }}>consistently</span> and skip the guesswork.
        </h2>
      </div>

      {/* Comparison Section */}
      <section className="max-w-7xl mx-auto mb-16 px-4 mt-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-8 text-center">
          Alternatives <span className="text-red-600">suck</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 items-stretch justify-items-center">
          {/* UGC Agencies */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-red-200 rounded-2xl shadow-md p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-red-400 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">Content agencies</span>
            </div>
            <p className="text-gray-600 mb-4">
              Expensive, going upwards of $2000 to $6000 a month.
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> High cost</li>
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Limited control</li>
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Often inconsistent traffic growth</li>
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
              <li className="flex items-center"><span className="text-red-400 mr-2">✗</span> Rarely see traffic growth</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Full creative control</li>
            </ul>
          </div>
          {/* Amply */}
          <div className="h-64 w-[350px] flex flex-col justify-between bg-white border-2 border-green-300 rounded-2xl shadow-lg p-7 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-green-400 cursor-pointer relative">
            <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Best Value</span>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-gray-800">Amply</span>
            </div>
            <p className="text-gray-700 mb-4">
              Automatically creates & publishes videos to all platforms for a simple monthly subscription.
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Cost effective</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Fully automated</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Traffic growth</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Multi-platform publishing</li>
            </ul>
          </div>
        </div>
        <div className="my-10 border-t border-gray-200"></div>
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">What can it do?</h3>
          <p className="text-md text-gray-700 font-medium">
            <span className="font-bold text-gray-900">Amply automatically creates self-improving content that drives users to your website.</span>
            <br />
            The differentiating factor between Amply and competitors is that Amply takes the approach of using faceless content to automate videos. While other services require you to upload all of your video & image assets in order to create &quot;AI ads&quot;, Amply believes in organic content with TikTok distribution as a means of getting leads/inbound.
          </p>
        </div>
      </section>

      {/* About Me Section */}
      <section className="py-16 bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#3953e6] to-[#36aeea] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                J
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Hey, it&apos;s Thomas</h3>
            <div className="text-gray-700 leading-relaxed space-y-4 text-left">
              <p>
                Last year, i was spending 10+ hours every week brainstorming, making, and posting content just to get the smallest ammount of traction for my startup. As a founder, I needed attention, but I didn&apos;t have the time or the team to consistently create content that actually worked.
              </p>
              <p>
                I tried using existing AI tools, but they were either overpriced, too generic or just made complete slop. Most wanted $100 to $300/month just to give me surface-level results. I was barely making revenue, and none of it helped me <em>actually grow</em>.
              </p>
              <p>
                So I built my own tool, just for myself at first. Something that could automatically generate <em>founder-style</em> content that felt real, looked native to TikTok and most of all actually got traffic.
              </p>
              <p>
                Turns out I wasn&apos;t the only one struggling.
              </p>
              <p>
                That&apos;s how <strong>Amply</strong> was born.
              </p>
              <p>
                Today, Amply helps founders auto-create quality content that builds attention, trust and traffic without the cost, burnout or guesswork.
              </p>
                              <p>
                  I use it every day to grow my own audience and bring in users and now, so can you. 😎
                </p>
                <p className="text-sm text-gray-500 italic mt-6 pt-4 border-t border-gray-100">
                  P.S. You can try it 100% for free, but for a limited time.
                </p>
              </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
                  ${isMonthly ? 24 : 19}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per {isMonthly ? 'month' : 'year'}
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
                  ${isMonthly ? 62 : 49}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per {isMonthly ? 'month' : 'year'}
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
                  ${isMonthly ? 115 : 90}
                </span>
                <span className="text-gray-400 text-base ml-1">
                  per {isMonthly ? 'month' : 'year'}
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