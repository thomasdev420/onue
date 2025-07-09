import { getSupabase } from '../../supabaseClient';
import { businessLogger } from '../utils/logger';

// Global state for business context
let globalBusinessContext = null;
let globalBusinessContextPromise = null;
let globalBusinessContextFetched = false;

/**
 * Get business context from user's onboarding data
 * @param {string} userEmail - User's email
 * @returns {Object} Business context object
 */
export async function getBusinessContext(userEmail) {
  try {
    if (!userEmail) {
      return null;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_work')
      .select('work_data')
      .eq('user_id', userEmail)
      .eq('page_type', 'onboarding')
      .single();

    if (error) {
      console.error('Error fetching business context:', error);
      return null;
    }

    if (!data?.work_data) {
      return null;
    }

    const onboardingData = data.work_data;
    
    // Extract business context from onboarding data
    return {
      companyName: onboardingData.extractedData?.companyName || null,
      businessType: onboardingData.extractedData?.productType || null,
      productInfo: onboardingData.extractedData?.productInfo || null,
      websiteUrl: onboardingData.websiteUrl || null,
      personalization: onboardingData.personalizationAnswers || {}
    };
  } catch (error) {
    console.error('Error in getBusinessContext:', error);
    return null;
  }
}

/**
 * Get business context for current session user
 * @returns {Object} Business context object
 */
export async function getCurrentUserBusinessContext() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      businessLogger.warn('getCurrentUserBusinessContext called on server side, returning default context');
      return {
        companyName: 'Your Business',
        businessType: 'General',
        productInfo: 'Your products and services'
      };
    }

    // Return cached context if available
    if (globalBusinessContext && globalBusinessContextFetched) {
      businessLogger.debug('Returning cached business context');
      return globalBusinessContext;
    }

    // Return existing promise if request is in progress
    if (globalBusinessContextPromise) {
      businessLogger.debug('Business context request already in progress, waiting for result');
      return await globalBusinessContextPromise;
    }

    // If we've already fetched and failed, return default context
    if (globalBusinessContextFetched && !globalBusinessContext) {
      businessLogger.debug('Returning default context (previous fetch failed)');
      return {
        companyName: 'Your Business',
        businessType: 'General',
        productInfo: 'Your products and services'
      };
    }

    businessLogger.info('Starting business context request - this should only happen once per session');
    
    // Create new promise for this request
    globalBusinessContextPromise = (async () => {
      try {
        // Check if we're in a private window
        const isPrivate = (() => {
          try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return false;
          } catch (e) {
            return true;
          }
        })();

        if (isPrivate) {
          businessLogger.warn('Detected private window, using default context to avoid fetch issues');
          return {
            companyName: 'Your Business',
            businessType: 'General',
            productInfo: 'Your products and services'
          };
        }

        const response = await fetch('/api/user/context', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout and better error handling
          signal: AbortSignal.timeout(3000) // Reduced timeout for faster fallback
        });

        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated, return default context
            return {
              companyName: 'Your Business',
              businessType: 'General',
              productInfo: 'Your products and services'
            };
          }
          throw new Error(`Failed to fetch business context: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        businessLogger.info('Business context request completed successfully');
        return data.businessContext;
      } catch (error) {
        businessLogger.error('Error fetching business context:', error);
        
        // Check if it's a network error or timeout
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
          businessLogger.warn('Network error or timeout when fetching business context, using default');
        }
        
        // Return a default context if fetch fails
        return {
          companyName: 'Your Business',
          businessType: 'General',
          productInfo: 'Your products and services'
        };
      }
    })();

    // Wait for the promise to resolve and cache the result
    globalBusinessContext = await globalBusinessContextPromise;
    globalBusinessContextPromise = null; // Clear the promise
    globalBusinessContextFetched = true; // Mark as fetched
    return globalBusinessContext;
  } catch (error) {
    businessLogger.error('Unexpected error in getCurrentUserBusinessContext:', error);
    
    // Always return a default context to prevent app crashes
    return {
      companyName: 'Your Business',
      businessType: 'General',
      productInfo: 'Your products and services'
    };
  }
}

/**
 * Reset the business context cache (useful for testing or logout)
 */
export function resetBusinessContextCache() {
  globalBusinessContext = null;
  globalBusinessContextPromise = null;
  globalBusinessContextFetched = false;
  businessLogger.info('Business context cache reset');
} 