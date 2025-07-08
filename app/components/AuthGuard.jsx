'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children, fallback = null }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Track hydration state to prevent flash of content
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show fallback during initial load or if not hydrated
  if (!isHydrated || status === 'loading') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    console.log('🔒 AuthGuard: User not authenticated, redirecting to home');
    router.push('/');
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show children if authenticated
  if (status === 'authenticated' && session) {
    console.log('✅ AuthGuard: User authenticated, rendering protected content');
    return children;
  }

  // Fallback for unexpected states
  return fallback || (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Authentication error. Please try again.</p>
      </div>
    </div>
  );
} 