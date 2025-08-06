import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getUserSettings, updateIntelligenceMode, updateAutomationMode } from '../../services/userSettingsService';

/**
 * Custom hook for managing user settings
 * @returns {Object} Settings state and update functions
 */
export function useUserSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState({
    intelligence_mode: 'normal'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (status !== 'authenticated' || !session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const userSettings = await getUserSettings(session.user.email);
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading user settings:', error);
        setError(`Failed to load settings: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [session?.user?.email, status]);

  // Update intelligence mode
  const updateIntelligenceModeSetting = useCallback(async (mode) => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setError('You must be logged in to update settings');
      return;
    }

    if (!['normal', 'max', 'auto'].includes(mode)) {
      setError('Invalid intelligence mode');
      return;
    }

    try {
      setSaveStatus('saving');
      setError(null);
      
      const updatedSettings = await updateIntelligenceMode(session.user.email, mode);
      setSettings(updatedSettings);
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error updating intelligence mode:', error);
      setError(`Failed to update intelligence mode: ${error.message}`);
      setSaveStatus('error');
    }
  }, [session?.user?.email, status]);



  // Get current intelligence mode
  const getIntelligenceMode = useCallback(() => {
    return settings.intelligence_mode || 'normal';
  }, [settings.intelligence_mode]);



  // Check if intelligence mode is max
  const isMaxIntelligence = useCallback(() => {
    return getIntelligenceMode() === 'max';
  }, [getIntelligenceMode]);

  return {
    settings,
    intelligenceMode: getIntelligenceMode(),
    isMaxIntelligence: isMaxIntelligence(),
    updateIntelligenceMode: updateIntelligenceModeSetting,
    isLoading,
    error,
    saveStatus,
    clearError: () => setError(null)
  };
} 