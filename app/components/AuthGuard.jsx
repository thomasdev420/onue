'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children, fallback = null }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [devAccessChecked, setDevAccessChecked] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  // Check dev access on mount
  useEffect(() => {
    const devAccessGranted = localStorage.getItem("devAccessGranted") === "true";
    console.log('🔍 AuthGuard Debug:', {
      devAccessGranted,
      isDev,
      status,
      session: !!session
    });
    setDevAccessChecked(true);
  }, []);

  // Handle redirect for unauthenticated users (respecting dev access)
  useEffect(() => {
    if (status === 'unauthenticated') {
      const devAccessGranted = localStorage.getItem("devAccessGranted") === "true";
      // Only redirect if not in development and no dev access granted
      if (!isDev && !devAccessGranted) {
        router.push('/');
      }
    }
  }, [status, router, isDev]);

  // Show fallback during initial load
  if (status === 'loading' || !devAccessChecked) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirect message if not authenticated and no dev access
  if (status === 'unauthenticated') {
    const devAccessGranted = localStorage.getItem("devAccessGranted") === "true";
    if (!isDev && !devAccessGranted) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Redirecting to login...</p>
          </div>
        </div>
      );
    }
  }

  // Show children if authenticated OR if dev access is granted
  if (status === 'authenticated' && session) {
    return children;
  }

  // Allow access if dev access is granted (even if not authenticated)
  if (isDev || localStorage.getItem("devAccessGranted") === "true") {
    return children;
  }

  // Fallback for unexpected states
  return fallback || (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Authentication error. Please try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
} 