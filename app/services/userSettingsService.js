import { getSupabase } from '../../supabaseClient';

/**
 * User Settings Service
 * Handles user preferences and settings
 */

/**
 * Get user settings from database
 * @param {string} userId - User's email
 * @returns {Promise<Object>} User settings object
 */
export async function getUserSettings(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default settings
        return await createDefaultSettings(userId);
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw new Error(`Failed to get user settings: ${error.message}`);
  }
}

/**
 * Create default settings for a user
 * @param {string} userId - User's email
 * @returns {Promise<Object>} Default settings object
 */
async function createDefaultSettings(userId) {
  try {
    const supabase = getSupabase();
    const defaultSettings = {
      user_id: userId,
      intelligence_mode: 'normal',
      automation_mode: 'balance'
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw new Error(`Failed to create default settings: ${error.message}`);
  }
}

/**
 * Update user settings
 * @param {string} userId - User's email
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings object
 */
export async function updateUserSettings(userId, settings) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw new Error(`Failed to update user settings: ${error.message}`);
  }
}

/**
 * Update intelligence mode specifically
 * @param {string} userId - User's email
 * @param {string} mode - Intelligence mode ('normal' or 'max')
 * @returns {Promise<Object>} Updated settings object
 */
export async function updateIntelligenceMode(userId, mode) {
  if (!['normal', 'max'].includes(mode)) {
    throw new Error('Intelligence mode must be "normal" or "max"');
  }

  return await updateUserSettings(userId, { intelligence_mode: mode });
}

/**
 * Update automation mode specifically
 * @param {string} userId - User's email
 * @param {string} mode - Automation mode ('automated', 'balance', or 'manual')
 * @returns {Promise<Object>} Updated settings object
 */
export async function updateAutomationMode(userId, mode) {
  if (!['automated', 'balance', 'manual'].includes(mode)) {
    throw new Error('Automation mode must be "automated", "balance", or "manual"');
  }

  return await updateUserSettings(userId, { automation_mode: mode });
}

/**
 * Get intelligence mode for a user
 * @param {string} userId - User's email
 * @returns {Promise<string>} Intelligence mode ('normal' or 'max')
 */
export async function getIntelligenceMode(userId) {
  try {
    const settings = await getUserSettings(userId);
    return settings.intelligence_mode || 'normal';
  } catch (error) {
    console.error('Error getting intelligence mode:', error);
    return 'normal'; // Default fallback
  }
}

/**
 * Get automation mode for a user
 * @param {string} userId - User's email
 * @returns {Promise<string>} Automation mode ('automated', 'balance', or 'manual')
 */
export async function getAutomationMode(userId) {
  try {
    const settings = await getUserSettings(userId);
    return settings.automation_mode || 'balance';
  } catch (error) {
    console.error('Error getting automation mode:', error);
    return 'balance'; // Default fallback
  }
} 