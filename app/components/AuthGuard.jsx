'use client';

import { useRouter } from 'next/navigation';
import { useSessionManager } from '../shared/hooks/useSessionManager';

export default function AuthGuard({ children, fallback = null }) {
  const router = useRouter();
  const { 
    isReady, 
    isLoading, 
    isAuthenticated, 
    isUnauthenticated,
    retryCount 
  } = useSessionManager({
    enableRetry: true,
    maxRetries: 3,
    enableDebug: false // Disable debug in production
  });

  // Show fallback during initial load or if loading
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Retry attempt {retryCount}/3</p>
          )}
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (isUnauthenticated) {
    router.push('/');
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show children if authenticated and ready
  if (isReady && isAuthenticated) {
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