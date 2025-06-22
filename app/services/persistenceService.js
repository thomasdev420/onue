import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../supabaseClient';

/**
 * Universal persistence service for saving and loading user work across all pages
 */

// Debounce function to prevent too many saves
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Save user work to database
 * @param {string} userId - User's email or ID
 * @param {string} pageType - Type of page (slides, memes, content, etc.)
 * @param {Object} data - Data to save
 * @returns {Promise<Object>} Result of save operation
 */
export async function saveUserWork(userId, pageType, data) {
  try {
    // First, delete any existing data for this user and page type
    const { error: deleteError } = await supabase
      .from('user_work')
      .delete()
      .eq('user_id', userId)
      .eq('page_type', pageType);

    if (deleteError) throw deleteError;

    // Then insert the new data
    const { data: savedData, error } = await supabase
      .from('user_work')
      .insert({
        user_id: userId,
        page_type: pageType,
        work_data: data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return { data: savedData, error: null };
  } catch (error) {
    console.error(`Error saving ${pageType} work:`, error);
    return { data: null, error };
  }
}

/**
 * Load user work from database
 * @param {string} userId - User's email or ID
 * @param {string} pageType - Type of page (slides, memes, content, etc.)
 * @returns {Promise<Object>} Loaded data or null if not found
 */
export async function loadUserWork(userId, pageType) {
  try {
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
      throw error;
    }

    return data.work_data;
  } catch (error) {
    console.error(`Error loading ${pageType} work:`, error);
    return null;
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
        setIsLoading(true); // Ensure loading state is true at the start
        const savedData = await loadUserWork(session.user.email, pageType);
        if (savedData) {
          setData(savedData);
        }
      } catch (error) {
        console.error(`Error loading ${pageType} data:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    if(isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, session?.user?.email, pageType]);

  // Auto-save when data changes
  useEffect(() => {
    // Do not save if still loading, not authenticated, or if data is the default
    if (isLoading || !isAuthenticated) {
      return;
    }

    autoSaveWork(session.user.email, pageType, data, setSaveStatus);
  }, [data, isAuthenticated, session?.user?.email, pageType, isLoading]);

  const updateData = useCallback((newData) => {
    setData(newData);
  }, []);

  const resetData = useCallback(() => {
    setData(defaultData);
  }, [defaultData]);

  return {
    data,
    updateData,
    resetData,
    saveStatus,
    isLoading
  };
} 