import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * React hook for managing AI memory and user preferences
 * Provides access to stored user preferences, creative directions, and memory management
 */
export function useAIMemory() {
  const { data: session } = useSession();
  const [memories, setMemories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user email (with dev fallback)
  const userEmail = session?.user?.email || (process.env.NODE_ENV === 'development' ? 'dev@local.com' : null);

  /**
   * Fetch user memory from the API
   */
  const fetchMemories = useCallback(async (category = null, limit = 20, includeSummary = true) => {
    if (!userEmail) {
      setMemories([]);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        summary: includeSummary.toString()
      });

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/user/memory?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.statusText}`);
      }

      const data = await response.json();
      
      setMemories(data.memories || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching AI memory:', err);
      setError(err.message);
      setMemories([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  /**
   * Clean up old memories
   */
  const cleanupMemories = useCallback(async (daysOld = 90) => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/memory?daysOld=${daysOld}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to cleanup memories: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh memories after cleanup
      await fetchMemories();
      
      return result;
    } catch (err) {
      console.error('Error cleaning up memories:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userEmail, fetchMemories]);

  /**
   * Get memories by category
   */
  const getMemoriesByCategory = useCallback((category) => {
    return memories.filter(memory => memory.category === category);
  }, [memories]);

  /**
   * Get high priority memories (priority >= 4)
   */
  const getHighPriorityMemories = useCallback(() => {
    return memories.filter(memory => memory.priority >= 4);
  }, [memories]);

  /**
   * Get most accessed memories
   */
  const getMostAccessedMemories = useCallback((limit = 5) => {
    return memories
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, limit);
  }, [memories]);

  /**
   * Get creative preferences
   */
  const getCreativePreferences = useCallback(() => {
    return getMemoriesByCategory('creative_preferences');
  }, [getMemoriesByCategory]);

  /**
   * Get goals and objectives
   */
  const getGoalsAndObjectives = useCallback(() => {
    return getMemoriesByCategory('goals_and_objectives');
  }, [getMemoriesByCategory]);

  /**
   * Get style preferences
   */
  const getStylePreferences = useCallback(() => {
    return getMemoriesByCategory('style_preferences');
  }, [getMemoriesByCategory]);

  /**
   * Get brand voice preferences
   */
  const getBrandVoice = useCallback(() => {
    return getMemoriesByCategory('brand_voice');
  }, [getMemoriesByCategory]);

  /**
   * Get target audience information
   */
  const getTargetAudience = useCallback(() => {
    return getMemoriesByCategory('target_audience');
  }, [getMemoriesByCategory]);

  /**
   * Check if user has any stored preferences
   */
  const hasPreferences = useCallback(() => {
    return memories.length > 0;
  }, [memories]);

  /**
   * Get memory insights for display
   */
  const getMemoryInsights = useCallback(() => {
    const insights = {
      totalMemories: memories.length,
      categories: {},
      topPreferences: getMostAccessedMemories(3),
      highPriority: getHighPriorityMemories(),
      creativePreferences: getCreativePreferences(),
      goals: getGoalsAndObjectives(),
      stylePreferences: getStylePreferences(),
      brandVoice: getBrandVoice(),
      targetAudience: getTargetAudience()
    };

    // Group by category
    memories.forEach(memory => {
      if (!insights.categories[memory.category]) {
        insights.categories[memory.category] = 0;
      }
      insights.categories[memory.category]++;
    });

    return insights;
  }, [
    memories,
    getMostAccessedMemories,
    getHighPriorityMemories,
    getCreativePreferences,
    getGoalsAndObjectives,
    getStylePreferences,
    getBrandVoice,
    getTargetAudience
  ]);

  // Fetch memories on mount and when user email changes
  useEffect(() => {
    if (userEmail) {
      fetchMemories();
    } else {
      setMemories([]);
      setSummary(null);
    }
  }, [userEmail, fetchMemories]);

  return {
    // State
    memories,
    summary,
    loading,
    error,
    userEmail,
    
    // Actions
    fetchMemories,
    cleanupMemories,
    
    // Getters
    getMemoriesByCategory,
    getHighPriorityMemories,
    getMostAccessedMemories,
    getCreativePreferences,
    getGoalsAndObjectives,
    getStylePreferences,
    getBrandVoice,
    getTargetAudience,
    hasPreferences,
    getMemoryInsights
  };
}

export default useAIMemory; 