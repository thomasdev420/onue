/**
 * Session management utilities for handling NextAuth session timing issues
 * particularly in private windows and new browsers
 */

/**
 * Check if the session is ready for use
 * @param {Object} session - The session object from useSession
 * @param {string} status - The session status from useSession
 * @param {boolean} isHydrated - Whether the component is hydrated
 * @returns {boolean} - True if session is ready
 */
export const isSessionReady = (session, status, isHydrated = true) => {
  return isHydrated && status === 'authenticated' && !!session;
};

/**
 * Check if we should show loading state
 * @param {string} status - The session status from useSession
 * @param {boolean} isHydrated - Whether the component is hydrated
 * @returns {boolean} - True if should show loading
 */
export const shouldShowLoading = (status, isHydrated = true) => {
  return !isHydrated || status === 'loading';
};

/**
 * Get session debug info for troubleshooting
 * @param {Object} session - The session object from useSession
 * @param {string} status - The session status from useSession
 * @param {boolean} isHydrated - Whether the component is hydrated
 * @returns {Object} - Debug information
 */
export const getSessionDebugInfo = (session, status, isHydrated = true) => {
  return {
    status,
    hasSession: !!session,
    userEmail: session?.user?.email,
    isHydrated,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    isPrivateWindow: typeof window !== 'undefined' ? 
      !window.localStorage || !window.sessionStorage : false
  };
};

/**
 * Retry session check with exponential backoff
 * @param {Function} checkFn - Function to check session
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves when session is ready or max retries reached
 */
export const retrySessionCheck = async (checkFn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await checkFn();
    if (result) {
      return result;
    }
    
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Session check failed after ${maxRetries} attempts`);
};

/**
 * Force session refresh by calling the session endpoint
 * @returns {Promise<Object>} - Updated session data
 */
export const forceSessionRefresh = async () => {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (response.ok) {
      const session = await response.json();
      return session;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Check if we're in a private/incognito window
 * @returns {boolean} - True if in private window
 */
export const isPrivateWindow = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Try to access localStorage and sessionStorage
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return false;
  } catch (e) {
    return true;
  }
};

/**
 * Get recommended action based on session state
 * @param {Object} session - The session object from useSession
 * @param {string} status - The session status from useSession
 * @param {boolean} isHydrated - Whether the component is hydrated
 * @returns {string} - Recommended action
 */
export const getSessionAction = (session, status, isHydrated = true) => {
  if (!isHydrated) return 'wait_for_hydration';
  if (status === 'loading') return 'wait_for_session';
  if (status === 'authenticated' && session) return 'proceed';
  if (status === 'unauthenticated') return 'redirect_to_login';
  return 'unknown_state';
}; 