import { getSupabase } from '../../supabaseClient';
import { businessLogger } from '../utils/logger';

/**
 * AI Memory Service
 * 
 * Manages persistent memory for AI interactions, storing user preferences,
 * creative directions, and learning patterns across sessions.
 */

// Memory categories for different types of user information
export const MEMORY_CATEGORIES = {
  CREATIVE_PREFERENCES: 'creative_preferences',
  GOALS_AND_OBJECTIVES: 'goals_and_objectives',
  STYLE_PREFERENCES: 'style_preferences',
  CONTENT_PATTERNS: 'content_patterns',
  INTERACTION_HISTORY: 'interaction_history',
  SUCCESS_METRICS: 'success_metrics',
  BRAND_VOICE: 'brand_voice',
  TARGET_AUDIENCE: 'target_audience'
};

// Memory priority levels
export const MEMORY_PRIORITY = {
  CRITICAL: 5,    // Core user identity and preferences
  HIGH: 4,        // Important creative directions
  MEDIUM: 3,      // Style preferences and patterns
  LOW: 2,         // General interaction patterns
  MINOR: 1        // Casual mentions and observations
};

/**
 * Extract meaningful insights from user input
 * @param {string} userInput - The user's message or request
 * @param {Object} context - Current conversation context
 * @returns {Array} Array of memory insights
 */
export function extractMemoryInsights(userInput, context = {}) {
  const insights = [];
  
  if (!userInput || typeof userInput !== 'string') {
    return insights;
  }

  const input = userInput.toLowerCase();
  
  // Extract creative preferences and benchmarks
  const creativePatterns = [
    {
      pattern: /(?:like|similar to|inspired by|following|modeled after)\s+([^.,!?]+)/gi,
      category: MEMORY_CATEGORIES.CREATIVE_PREFERENCES,
      priority: MEMORY_PRIORITY.HIGH,
      extract: (match) => ({
        type: 'creative_benchmark',
        value: match[1].trim(),
        context: 'User referenced creative inspiration'
      })
    },
    {
      pattern: /(?:i want|i need|create|make)\s+(?:content|slides|videos?|posts?)\s+(?:that are|which are|with)\s+([^.,!?]+)/gi,
      category: MEMORY_CATEGORIES.STYLE_PREFERENCES,
      priority: MEMORY_PRIORITY.HIGH,
      extract: (match) => ({
        type: 'style_preference',
        value: match[1].trim(),
        context: 'User specified content style'
      })
    },
    {
      pattern: /(?:my goal|i want to|aiming to|trying to)\s+([^.,!?]+)/gi,
      category: MEMORY_CATEGORIES.GOALS_AND_OBJECTIVES,
      priority: MEMORY_PRIORITY.CRITICAL,
      extract: (match) => ({
        type: 'goal',
        value: match[1].trim(),
        context: 'User stated goal or objective'
      })
    },
    {
      pattern: /(?:target audience|audience is|for|aimed at)\s+([^.,!?]+)/gi,
      category: MEMORY_CATEGORIES.TARGET_AUDIENCE,
      priority: MEMORY_PRIORITY.HIGH,
      extract: (match) => ({
        type: 'target_audience',
        value: match[1].trim(),
        context: 'User specified target audience'
      })
    },
    {
      pattern: /(?:brand voice|tone|style)\s+(?:should be|is|needs to be)\s+([^.,!?]+)/gi,
      category: MEMORY_CATEGORIES.BRAND_VOICE,
      priority: MEMORY_PRIORITY.HIGH,
      extract: (match) => ({
        type: 'brand_voice',
        value: match[1].trim(),
        context: 'User specified brand voice or tone'
      })
    }
  ];

  // Extract insights using patterns
  creativePatterns.forEach(({ pattern, category, priority, extract }) => {
    const matches = [...input.matchAll(pattern)];
    matches.forEach(match => {
      insights.push({
        category,
        priority,
        timestamp: new Date().toISOString(),
        ...extract(match),
        originalInput: userInput.substring(0, 100) // Store first 100 chars for context
      });
    });
  });

  // Extract repeated themes and keywords
  const commonThemes = [
    'marketing', 'branding', 'social media', 'content creation', 'engagement',
    'conversion', 'awareness', 'leadership', 'innovation', 'quality',
    'authentic', 'professional', 'casual', 'funny', 'serious', 'inspirational'
  ];

  const foundThemes = commonThemes.filter(theme => 
    input.includes(theme) && !insights.some(insight => insight.value.includes(theme))
  );

  foundThemes.forEach(theme => {
    insights.push({
      category: MEMORY_CATEGORIES.CONTENT_PATTERNS,
      priority: MEMORY_PRIORITY.MEDIUM,
      timestamp: new Date().toISOString(),
      type: 'recurring_theme',
      value: theme,
      context: 'User frequently mentions this theme',
      originalInput: userInput.substring(0, 100)
    });
  });

  return insights;
}

/**
 * Store memory insights in the database
 * @param {string} userEmail - User's email
 * @param {Array} insights - Array of memory insights
 * @returns {Promise<Object>} Storage result
 */
export async function storeMemoryInsights(userEmail, insights) {
  try {
    if (!userEmail || !insights || insights.length === 0) {
      return { success: false, error: 'Invalid parameters' };
    }

    const supabase = getSupabase();
    
    // Prepare insights for storage
    const memoryRecords = insights.map(insight => ({
      user_id: userEmail,
      category: insight.category,
      priority: insight.priority,
      type: insight.type,
      value: insight.value,
      context: insight.context,
      original_input: insight.originalInput,
      created_at: insight.timestamp,
      last_accessed: insight.timestamp,
      access_count: 1
    }));

    // Insert new insights
    const { data, error } = await supabase
      .from('ai_memory')
      .insert(memoryRecords);

    if (error) {
      businessLogger.error('Error storing memory insights:', error);
      return { success: false, error: error.message };
    }

    businessLogger.info(`Stored ${insights.length} memory insights for user ${userEmail}`);
    return { success: true, count: insights.length };

  } catch (error) {
    businessLogger.error('Error in storeMemoryInsights:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieve relevant memory for a user
 * @param {string} userEmail - User's email
 * @param {string} category - Optional category filter
 * @param {number} limit - Maximum number of memories to retrieve
 * @returns {Promise<Array>} Array of memory records
 */
export async function retrieveUserMemory(userEmail, category = null, limit = 20) {
  try {
    if (!userEmail) {
      return [];
    }

    const supabase = getSupabase();
    
    let query = supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', userEmail)
      .order('priority', { ascending: false })
      .order('last_accessed', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      businessLogger.error('Error retrieving user memory:', error);
      return [];
    }

    // Update access count and timestamp for retrieved memories
    if (data && data.length > 0) {
      const memoryIds = data.map(memory => memory.id);
      await supabase
        .from('ai_memory')
        .update({ 
          access_count: supabase.raw('access_count + 1'),
          last_accessed: new Date().toISOString()
        })
        .in('id', memoryIds);
    }

    return data || [];

  } catch (error) {
    businessLogger.error('Error in retrieveUserMemory:', error);
    return [];
  }
}

/**
 * Build context-aware memory prompt
 * @param {Array} memories - Array of memory records
 * @param {string} currentRequest - Current user request
 * @returns {string} Formatted memory context
 */
export function buildMemoryContext(memories, currentRequest = '') {
  if (!memories || memories.length === 0) {
    return '';
  }

  let context = '\n\nUSER MEMORY & PREFERENCES:';
  
  // Group memories by category
  const groupedMemories = memories.reduce((groups, memory) => {
    if (!groups[memory.category]) {
      groups[memory.category] = [];
    }
    groups[memory.category].push(memory);
    return groups;
  }, {});

  // Add critical and high priority memories first
  Object.entries(groupedMemories).forEach(([category, categoryMemories]) => {
    const highPriorityMemories = categoryMemories
      .filter(memory => memory.priority >= MEMORY_PRIORITY.HIGH)
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 3); // Top 3 most accessed

    if (highPriorityMemories.length > 0) {
      context += `\n\n${category.replace(/_/g, ' ').toUpperCase()}:`;
      
      highPriorityMemories.forEach(memory => {
        context += `\n- ${memory.value} (mentioned ${memory.access_count} times)`;
      });
    }
  });

  // Add specific instructions for using memory
  context += `\n\nMEMORY USAGE INSTRUCTIONS:
- Use these preferences to enhance your responses, but never override the user's explicit current request
- If the user asks for something different, prioritize their current request over stored preferences
- Reference these preferences when they're relevant to the current conversation
- Use the most frequently accessed preferences (higher access counts) as stronger indicators of user preference`;

  return context;
}

/**
 * Clean up old or low-value memories
 * @param {string} userEmail - User's email
 * @param {number} daysOld - Remove memories older than this many days
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupOldMemories(userEmail, daysOld = 90) {
  try {
    const supabase = getSupabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('ai_memory')
      .delete()
      .eq('user_id', userEmail)
      .lt('created_at', cutoffDate.toISOString())
      .lt('priority', MEMORY_PRIORITY.MEDIUM); // Only delete low priority memories

    if (error) {
      businessLogger.error('Error cleaning up old memories:', error);
      return { success: false, error: error.message };
    }

    businessLogger.info(`Cleaned up old memories for user ${userEmail}`);
    return { success: true, deletedCount: data?.length || 0 };

  } catch (error) {
    businessLogger.error('Error in cleanupOldMemories:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get memory summary for a user
 * @param {string} userEmail - User's email
 * @returns {Promise<Object>} Memory summary
 */
export async function getMemorySummary(userEmail) {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('ai_memory')
      .select('category, priority, access_count')
      .eq('user_id', userEmail);

    if (error) {
      businessLogger.error('Error getting memory summary:', error);
      return null;
    }

    const summary = {
      totalMemories: data.length,
      categories: {},
      topPreferences: [],
      mostAccessed: []
    };

    // Group by category
    data.forEach(memory => {
      if (!summary.categories[memory.category]) {
        summary.categories[memory.category] = 0;
      }
      summary.categories[memory.category]++;
    });

    // Get most accessed memories
    const sortedByAccess = data
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 5);

    summary.mostAccessed = sortedByAccess.map(memory => ({
      category: memory.category,
      accessCount: memory.access_count,
      priority: memory.priority
    }));

    return summary;

  } catch (error) {
    businessLogger.error('Error in getMemorySummary:', error);
    return null;
  }
}

const aiMemoryService = {
  MEMORY_CATEGORIES,
  MEMORY_PRIORITY,
  extractMemoryInsights,
  storeMemoryInsights,
  retrieveUserMemory,
  buildMemoryContext,
  cleanupOldMemories,
  getMemorySummary
};

export default aiMemoryService; 