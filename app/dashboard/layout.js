'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import FeedbackButton from '../components/FeedbackButton';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [devAccessChecked, setDevAccessChecked] = useState(false);
  const [hasOAuthParams, setHasOAuthParams] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  const getPageColor = () => {
    if (pathname.includes('/dashboard/support')) return '#3B82F6';
    if (pathname.includes('/dashboard/settings')) return '#6B7280';
    if (pathname.includes('/dashboard/selection')) return '#EA580C';
    return '#6366F1';
  };

  const currentPageColor = getPageColor();

  useEffect(() => {
    const devAccessGranted = localStorage.getItem('devAccessGranted') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuth = urlParams.has('code') || urlParams.has('state');
    setHasOAuthParams(hasOAuth);

    if (hasOAuth) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setDevAccessChecked(true);

    const onSelectionOnly =
      typeof pathname === 'string' && pathname.startsWith('/dashboard/selection');

    if (
      !isDev &&
      status === 'unauthenticated' &&
      !devAccessGranted &&
      !hasOAuth &&
      status !== 'loading' &&
      !onSelectionOnly
    ) {
      router.push('/');
    }
  }, [router, isDev, status, session, pathname]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  if (!devAccessChecked || (status === 'loading' && !hasOAuthParams)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-gray-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const onSelectionRoute =
    typeof pathname === 'string' && pathname.startsWith('/dashboard/selection');

  if (
    !isDev &&
    status === 'unauthenticated' &&
    !localStorage.getItem('devAccessGranted') &&
    !hasOAuthParams &&
    !onSelectionRoute
  ) {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAF9F6', position: 'relative' }}>
      <div className="flex w-full h-full">
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} pageColor={currentPageColor} />
        <main className={`flex-1 p-8 bg-[#FAF9F6] overflow-y-auto ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          {children}
        </main>
      </div>
      <FeedbackButton />
    </div>
  );
}
