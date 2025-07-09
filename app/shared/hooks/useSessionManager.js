import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { 
  isSessionReady, 
  shouldShowLoading, 
  getSessionDebugInfo, 
  forceSessionRefresh,
  isPrivateWindow 
} from '../utils/sessionUtils';

/**
 * Custom hook for reliable session management
 * Handles private window scenarios and session timing issues
 */
export const useSessionManager = (options = {}) => {
  const { 
    enableRetry = true, 
    maxRetries = 3, 
    retryDelay = 1000,
    enableDebug = false
  } = options;

  const { data: session, status, update } = useSession();
  const [isHydrated, setIsHydrated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // Track hydration state
  useEffect(() => {
    setIsHydrated(true);
    setIsPrivateMode(isPrivateWindow());
  }, []);

  // Debug logging
  useEffect(() => {
    if (enableDebug) {
      const debugInfo = getSessionDebugInfo(session, status, isHydrated);
      console.log('useSessionManager:', {
        ...debugInfo,
        retryCount,
        isPrivateMode,
        enableRetry
      });
    }
  }, [session, status, isHydrated, retryCount, isPrivateMode, enableDebug]);

  // Retry mechanism for session loading
  useEffect(() => {
    if (!enableRetry || !isHydrated || status !== 'loading' || retryCount >= maxRetries) {
      return;
    }

    const timer = setTimeout(() => {
      if (enableDebug) {
        console.log(`Session retry attempt ${retryCount + 1}/${maxRetries}`);
      }
      setRetryCount(prev => prev + 1);
      
      // Force session refresh on retry
      forceSessionRefresh().then(() => {
        // Trigger session update
        update();
      });
    }, retryDelay * (retryCount + 1));

    return () => clearTimeout(timer);
  }, [isHydrated, status, retryCount, maxRetries, retryDelay, enableRetry, update]);

  // Computed values
  const isReady = isSessionReady(session, status, isHydrated);
  const isLoading = shouldShowLoading(status, isHydrated);
  const isAuthenticated = status === 'authenticated' && !!session;
  const isUnauthenticated = status === 'unauthenticated';

  // Force refresh function
  const refreshSession = useCallback(async () => {
    if (enableDebug) {
      console.log('Manually refreshing session...');
    }
    const result = await forceSessionRefresh();
    if (result) {
      update();
    }
    return result;
  }, [update, enableDebug]);

  // Reset retry count
  const resetRetry = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    // Session data
    session,
    status,
    
    // Computed states
    isReady,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    isHydrated,
    isPrivateMode,
    
    // Retry info
    retryCount,
    maxRetries,
    
    // Actions
    refreshSession,
    resetRetry,
    update,
    
    // Debug info
    debugInfo: enableDebug ? getSessionDebugInfo(session, status, isHydrated) : null
  };
}; 