'use client';

import React, { useState, cloneElement, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WebsiteOnboarding from '../components/WebsiteOnboarding';
import { OnboardingModalContext } from './OnboardingModalContext';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [devAccessChecked, setDevAccessChecked] = useState(false);
  const [hasOAuthParams, setHasOAuthParams] = useState(false);
  const [showWebsiteOnboarding, setShowWebsiteOnboarding] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  // Check dev access and OAuth params on mount
  useEffect(() => {
    const devAccessGranted = localStorage.getItem("devAccessGranted") === "true";
    
    // Check for OAuth parameters (indicates recent Google login)
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuth = urlParams.has('code') || urlParams.has('state');
    setHasOAuthParams(hasOAuth);
    
    console.log('🔍 Dashboard Auth Debug:', {
      devAccessGranted,
      isDev,
      hasOAuth,
      status,
      session: !!session
    });
    
    // Clean up OAuth params if present
    if (hasOAuth) {
      console.log('✅ OAuth params detected in dashboard - allowing access');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (!devAccessGranted && !isDev && !hasOAuth) {
      console.log('❌ No auth detected - redirecting to landing page');
      router.push('/');
    }
    setDevAccessChecked(true);
  }, [router, isDev, status, session]);

  // Handle redirect for unauthenticated users (with OAuth grace period)
  useEffect(() => {
    // Only redirect if not in development, not authenticated, no dev access, and no recent OAuth
    if (!isDev && status === 'unauthenticated' && !localStorage.getItem("devAccessGranted") && !hasOAuthParams) {
      router.push('/');
    }
  }, [isDev, status, router, hasOAuthParams]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Show loading state while checking authentication and dev access
  if (!devAccessChecked || (!isDev && status === 'loading' && !hasOAuthParams)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-gray-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // In development, always allow access
  // In production, only redirect if not authenticated AND no dev access AND no recent OAuth
  if (!isDev && status === 'unauthenticated' && !localStorage.getItem("devAccessGranted") && !hasOAuthParams) {
    return null;
  }

  return (
    <OnboardingModalContext.Provider value={{ showWebsiteOnboarding, setShowWebsiteOnboarding }}>
      <div className="flex min-h-screen" style={{ backgroundColor: '#FAF9F6', position: 'relative' }}>
        <div className={`flex w-full h-full${showWebsiteOnboarding ? ' blur-[6px] pointer-events-none' : ''}`}> 
          <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
          <main className={`flex-1 p-8 bg-[#FAF9F6] overflow-y-auto ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
            {children}
          </main>
        </div>
      </div>
      <WebsiteOnboarding 
        open={showWebsiteOnboarding} 
        onClose={() => setShowWebsiteOnboarding(false)} 
        onComplete={() => setShowWebsiteOnboarding(false)} 
      />
    </OnboardingModalContext.Provider>
  );
}
