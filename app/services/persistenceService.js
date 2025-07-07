import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getSupabase } from '../../supabaseClient';
import { debounce } from '../utils/performance';

/**
 * Universal persistence service for saving and loading user work across all pages
 */

/**
 * Save user work to database
 * @param {string} userId - User's email or ID
 * @param {string} pageType - Type of page (slides, memes, content, etc.)
 * @param {Object} data - Data to save
 * @returns {Promise<Object>} Result of save operation
 */
export async function saveUserWork(userId, pageType, data) {
  if (!userId || !pageType) {
    throw new Error('User ID and page type are required');
  }

  try {
    const supabase = getSupabase();
    const { data: savedData, error } = await supabase
      .from('user_work')
      .upsert({
        user_id: userId,
        page_type: pageType,
        work_data: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, page_type'
      })
      .select();

    if (error) {
      console.error(`Database error saving ${pageType} work:`, error);
      throw new Error(`Failed to save ${pageType} work: ${error.message}`);
    }

    return { data: savedData, error: null };
  } catch (error) {
    console.error(`Error saving ${pageType} work:`, error);
    return { data: null, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Load user work from database
 * @param {string} userId - User's email or ID
 * @param {string} pageType - Type of page (slides, memes, content, etc.)
 * @returns {Promise<Object>} Loaded data or null if not found
 */
export async function loadUserWork(userId, pageType) {
  if (!userId || !pageType) {
    throw new Error('User ID and page type are required');
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_work')
      .select('*')
      .eq('user_id', userId)
      .eq('page_type', pageType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return null
        return null;
      }
      console.error(`Database error loading ${pageType} work:`, error);
      throw new Error(`Failed to load ${pageType} work: ${error.message}`);
    }

    return data.work_data;
  } catch (error) {
    console.error(`Error loading ${pageType} work:`, error);
    throw error;
  }
}

/**
 * Auto-save with debouncing and status updates
 * @param {string} userId - User's email or ID
 * @param {string} pageType - Type of page
 * @param {Object} data - Data to save
 * @param {Function} setSaveStatus - Function to update save status
 */
export const autoSaveWork = debounce(async (userId, pageType, data, setSaveStatus) => {
  if (!userId || !pageType || !data) {
    console.warn('Auto-save skipped: missing required parameters');
    return;
  }

  try {
    setSaveStatus('saving');
    const { error } = await saveUserWork(userId, pageType, data);
    
    if (error) {
      setSaveStatus('error');
      console.error(`Auto-save failed for ${pageType}:`, error);
    } else {
      setSaveStatus('saved');
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  } catch (error) {
    setSaveStatus('error');
    console.error(`Auto-save error for ${pageType}:`, error);
  }
}, 1000); // 1 second debounce

/**
 * Create a hook for managing persistence
 * @param {string} pageType - Type of page
 * @param {Object} defaultData - Default data if nothing is saved
 * @returns {Object} Hook with state and save functions
 */
export function usePersistence(pageType, defaultData) {
  const [data, setData] = useState(defaultData);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const savedData = await loadUserWork(session.user.email, pageType);
        if (savedData) {
          setData(savedData);
        }
      } catch (error) {
        console.error(`Error loading ${pageType} data:`, error);
        setError(`Failed to load ${pageType} data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, session?.user?.email, pageType]);

  // Auto-save when data changes
  useEffect(() => {
    // Do not save if still loading, not authenticated
    if (isLoading || !isAuthenticated || !session?.user?.email) {
      return;
    }

    // Always auto-save when data changes (removed the default data comparison)
    console.log(`Auto-saving ${pageType} data:`, data);
    autoSaveWork(session.user.email, pageType, data, setSaveStatus);
  }, [data, isAuthenticated, session?.user?.email, pageType, isLoading]);

  const updateData = useCallback((newData) => {
    setData(newData);
    setError(null); // Clear any previous errors when data is updated
  }, []);

  const resetData = useCallback(() => {
    setData(defaultData);
    setError(null);
  }, [defaultData]);

  const retryLoad = useCallback(async () => {
    if (!isAuthenticated || !session?.user?.email) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const savedData = await loadUserWork(session.user.email, pageType);
      if (savedData) {
        setData(savedData);
      }
    } catch (error) {
      setError(`Failed to reload ${pageType} data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, session?.user?.email, pageType]);

  return {
    data,
    updateData,
    resetData,
    saveStatus,
    isLoading,
    error,
    retryLoad
  };
} 