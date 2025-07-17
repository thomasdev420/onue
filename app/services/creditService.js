import { getSupabase } from '../../supabaseClient';
import { apiLogger } from '../utils/logger';

/**
 * Credit Service
 * 
 * Manages user credits, usage tracking, and billing for AI-powered features.
 * Integrates with the database credit system to track and manage user consumption.
 */

/**
 * Get user's credit summary including balance, usage, and subscription info
 * @param {string} userEmail - User's email
 * @returns {Promise<Object>} Credit summary object
 */
export async function getUserCreditSummary(userEmail) {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_user_credit_summary', {
      user_email: userEmail
    });

    if (error) {
      apiLogger.error('Error getting user credit summary:', error);
      throw new Error(`Failed to get credit summary: ${error.message}`);
    }

    return data;
  } catch (error) {
    apiLogger.error('Error in getUserCreditSummary:', error);
    throw error;
  }
}

/**
 * Check if user has enough credits for a specific action
 * @param {string} userEmail - User's email
 * @param {string} actionType - Type of action (slide_generation, ai_chat, etc.)
 * @returns {Promise<Object>} Credit check result
 */
export async function checkCreditsForAction(userEmail, actionType) {
  try {
    if (!userEmail || !actionType) {
      throw new Error('User email and action type are required');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('check_credits_for_action', {
      user_email: userEmail,
      action_type: actionType
    });

    if (error) {
      apiLogger.error('Error checking credits for action:', error);
      throw new Error(`Failed to check credits: ${error.message}`);
    }

    return data;
  } catch (error) {
    apiLogger.error('Error in checkCreditsForAction:', error);
    throw error;
  }
}

/**
 * Consume credits for a specific action
 * @param {string} userEmail - User's email
 * @param {string} actionType - Type of action
 * @param {boolean} success - Whether the action was successful
 * @param {string} errorMessage - Error message if action failed
 * @returns {Promise<Object>} Credit consumption result
 */
export async function consumeCreditsForAction(userEmail, actionType, success = true, errorMessage = null) {
  try {
    if (!userEmail || !actionType) {
      throw new Error('User email and action type are required');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('consume_credits_for_action', {
      user_email: userEmail,
      action_type: actionType,
      success: success,
      error_message: errorMessage
    });

    if (error) {
      apiLogger.error('Error consuming credits for action:', error);
      throw new Error(`Failed to consume credits: ${error.message}`);
    }

    if (data.success) {
      apiLogger.info(`Credits consumed for ${actionType}: ${data.credits_consumed}, new balance: ${data.new_balance}`);
    } else {
      apiLogger.warn(`Insufficient credits for ${actionType}: ${data.error}`);
    }

    return data;
  } catch (error) {
    apiLogger.error('Error in consumeCreditsForAction:', error);
    throw error;
  }
}

/**
 * Get credit usage history for a user
 * @param {string} userEmail - User's email
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records to return
 * @param {string} options.actionType - Filter by action type
 * @param {string} options.startDate - Start date for filtering
 * @param {string} options.endDate - End date for filtering
 * @returns {Promise<Array>} Usage history
 */
export async function getCreditUsageHistory(userEmail, options = {}) {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    const { limit = 50, actionType, startDate, endDate } = options;

    const supabase = getSupabase();
    let query = supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      apiLogger.error('Error getting credit usage history:', error);
      throw new Error(`Failed to get usage history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    apiLogger.error('Error in getCreditUsageHistory:', error);
    throw error;
  }
}

/**
 * Get credit transaction history for a user
 * @param {string} userEmail - User's email
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records to return
 * @param {string} options.transactionType - Filter by transaction type
 * @returns {Promise<Array>} Transaction history
 */
export async function getCreditTransactionHistory(userEmail, options = {}) {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    const { limit = 50, transactionType } = options;

    const supabase = getSupabase();
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data, error } = await query;

    if (error) {
      apiLogger.error('Error getting credit transaction history:', error);
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    apiLogger.error('Error in getCreditTransactionHistory:', error);
    throw error;
  }
}

/**
 * Get available subscription tiers and pricing
 * @returns {Promise<Array>} Available subscription tiers
 */
export async function getSubscriptionTiers() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('credit_pricing')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });

    if (error) {
      apiLogger.error('Error getting subscription tiers:', error);
      throw new Error(`Failed to get subscription tiers: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    apiLogger.error('Error in getSubscriptionTiers:', error);
    throw error;
  }
}

/**
 * Update user's subscription tier
 * @param {string} userEmail - User's email
 * @param {string} newTier - New subscription tier
 * @param {Object} options - Additional options
 * @param {boolean} options.autoRenew - Whether to auto-renew
 * @param {string} options.endDate - Subscription end date
 * @returns {Promise<Object>} Updated user credits
 */
export async function updateSubscriptionTier(userEmail, newTier, options = {}) {
  try {
    if (!userEmail || !newTier) {
      throw new Error('User email and new tier are required');
    }

    const { autoRenew = true, endDate } = options;

    // Get the new tier's monthly credits
    const tiers = await getSubscriptionTiers();
    const newTierData = tiers.find(tier => tier.subscription_tier === newTier);
    
    if (!newTierData) {
      throw new Error(`Invalid subscription tier: ${newTier}`);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userEmail,
        subscription_tier: newTier,
        credits_balance: newTierData.monthly_credits,
        auto_renew: autoRenew,
        subscription_end_date: endDate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      apiLogger.error('Error updating subscription tier:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    apiLogger.info(`Updated subscription tier for ${userEmail} to ${newTier}`);
    return data;
  } catch (error) {
    apiLogger.error('Error in updateSubscriptionTier:', error);
    throw error;
  }
}

/**
 * Add credits to user account (for purchases, bonuses, etc.)
 * @param {string} userEmail - User's email
 * @param {number} creditsAmount - Number of credits to add
 * @param {string} transactionType - Type of transaction
 * @param {Object} options - Additional options
 * @param {number} options.paymentAmount - Payment amount
 * @param {string} options.paymentMethod - Payment method
 * @param {string} options.description - Transaction description
 * @returns {Promise<Object>} Transaction result
 */
export async function addCreditsToUser(userEmail, creditsAmount, transactionType, options = {}) {
  try {
    if (!userEmail || !creditsAmount || !transactionType) {
      throw new Error('User email, credits amount, and transaction type are required');
    }

    const { paymentAmount, paymentMethod, description } = options;

    const supabase = getSupabase();

    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userEmail,
        transaction_type: transactionType,
        credits_amount: creditsAmount,
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        description: description,
        payment_status: 'completed'
      })
      .select()
      .single();

    if (transactionError) {
      apiLogger.error('Error creating credit transaction:', transactionError);
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    // Update user's credit balance
    const { data: updatedCredits, error: creditsError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userEmail,
        credits_balance: supabase.rpc('get_user_credit_summary', { user_email: userEmail }).then(result => 
          (result.credits_balance || 0) + creditsAmount
        ),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (creditsError) {
      apiLogger.error('Error updating user credits:', creditsError);
      throw new Error(`Failed to update credits: ${creditsError.message}`);
    }

    apiLogger.info(`Added ${creditsAmount} credits to ${userEmail} via ${transactionType}`);
    return {
      transaction,
      updatedCredits,
      success: true
    };
  } catch (error) {
    apiLogger.error('Error in addCreditsToUser:', error);
    throw error;
  }
}

/**
 * Get credit usage analytics for a user
 * @param {string} userEmail - User's email
 * @param {string} period - Time period ('week', 'month', 'year')
 * @returns {Promise<Object>} Usage analytics
 */
export async function getCreditUsageAnalytics(userEmail, period = 'month') {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    const supabase = getSupabase();
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get usage by action type
    const { data: usageByAction, error: usageError } = await supabase
      .from('credit_usage')
      .select('action_type, credits_consumed')
      .eq('user_id', userEmail)
      .gte('created_at', startDate.toISOString())
      .eq('success', true);

    if (usageError) {
      apiLogger.error('Error getting usage analytics:', usageError);
      throw new Error(`Failed to get analytics: ${usageError.message}`);
    }

    // Aggregate usage by action type
    const actionBreakdown = {};
    let totalCreditsUsed = 0;

    usageByAction?.forEach(usage => {
      if (!actionBreakdown[usage.action_type]) {
        actionBreakdown[usage.action_type] = 0;
      }
      actionBreakdown[usage.action_type] += usage.credits_consumed;
      totalCreditsUsed += usage.credits_consumed;
    });

    // Get current credit summary
    const creditSummary = await getUserCreditSummary(userEmail);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalCreditsUsed,
      usageByAction: actionBreakdown,
      currentBalance: creditSummary.credits_balance,
      subscriptionTier: creditSummary.subscription_tier,
      mostUsedAction: Object.keys(actionBreakdown).reduce((a, b) => 
        actionBreakdown[a] > actionBreakdown[b] ? a : b, null
      )
    };
  } catch (error) {
    apiLogger.error('Error in getCreditUsageAnalytics:', error);
    throw error;
  }
}

/**
 * Check if user has access to a specific feature based on their subscription
 * @param {string} userEmail - User's email
 * @param {string} featureName - Name of the feature to check
 * @returns {Promise<boolean>} Whether user has access to the feature
 */
export async function hasFeatureAccess(userEmail, featureName) {
  try {
    if (!userEmail || !featureName) {
      return false;
    }

    const creditSummary = await getUserCreditSummary(userEmail);
    const tiers = await getSubscriptionTiers();
    
    const userTier = tiers.find(tier => tier.subscription_tier === creditSummary.subscription_tier);
    
    if (!userTier) {
      return false;
    }

    return userTier.features_enabled[featureName] === true;
  } catch (error) {
    apiLogger.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get credit cost for a specific action based on user's subscription tier
 * @param {string} userEmail - User's email
 * @param {string} actionType - Type of action
 * @returns {Promise<number>} Credit cost for the action
 */
export async function getActionCreditCost(userEmail, actionType) {
  try {
    if (!userEmail || !actionType) {
      return 0;
    }

    const creditSummary = await getUserCreditSummary(userEmail);
    const tiers = await getSubscriptionTiers();
    
    const userTier = tiers.find(tier => tier.subscription_tier === creditSummary.subscription_tier);
    
    if (!userTier) {
      return 0;
    }

    return userTier.credit_cost_per_action[actionType] || 0;
  } catch (error) {
    apiLogger.error('Error getting action credit cost:', error);
    return 0;
  }
}

// Export the service as a singleton
export const creditService = {
  getUserCreditSummary,
  checkCreditsForAction,
  consumeCreditsForAction,
  getCreditUsageHistory,
  getCreditTransactionHistory,
  getSubscriptionTiers,
  updateSubscriptionTier,
  addCreditsToUser,
  getCreditUsageAnalytics,
  hasFeatureAccess,
  getActionCreditCost
}; 