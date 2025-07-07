'use client';

import React, { useState, cloneElement, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [devAccessChecked, setDevAccessChecked] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  // Check dev access on mount
  useEffect(() => {
    if (isDev) {
      // In development mode, always allow access
      setDevAccessChecked(true);
    } else {
      // In production, check for dev access
      const devAccessGranted = localStorage.getItem("devAccessGranted") === "true";
      if (!devAccessGranted) {
        router.push('/');
      }
      setDevAccessChecked(true);
    }
  }, [router, isDev]);

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!isDev && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [isDev, status, router]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Show loading state while checking authentication and dev access
  if (!devAccessChecked || (!isDev && status === 'loading')) {
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
  // In production, redirect to login if not authenticated
  if (!isDev && status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAF9F6' }}>
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`flex-1 p-8 bg-[#FAF9F6] overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {React.isValidElement(children) ? cloneElement(children, { isCollapsed }) : children}
      </main>
    </div>
  );
}
