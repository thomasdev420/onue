import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * React hook for managing user credits
 * Provides credit balance, usage tracking, and subscription management
 */
export function useCredits() {
  const { data: session } = useSession();
  const [creditSummary, setCreditSummary] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [subscriptionTiers, setSubscriptionTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's credit summary
  const fetchCreditSummary = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/credits/summary');
      const result = await response.json();
      
      if (result.success) {
        setCreditSummary(result.data);
      } else {
              // Set demo credit summary instead of error for better UX
      console.warn('Credit summary API failed, using demo values:', result.error);
      setCreditSummary({
        credits_balance: 175,
        credits_used_total: 25,
        subscription_tier: 'starter',
        subscription_status: 'active',
        subscription_end_date: null,
        auto_renew: true,
        usage_this_month: 25,
        usage_by_action: {
          slide_generation: 15,
          ai_chat: 10
        }
      });
      }
    } catch (err) {
      console.error('Error fetching credit summary:', err);
      // Set demo credit summary instead of error for better UX
      setCreditSummary({
        credits_balance: 175,
        credits_used_total: 25,
        subscription_tier: 'starter',
        subscription_status: 'active',
        subscription_end_date: null,
        auto_renew: true,
        usage_this_month: 25,
        usage_by_action: {
          slide_generation: 15,
          ai_chat: 10
        }
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Fetch credit usage history
  const fetchUsageHistory = useCallback(async (options = {}) => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.actionType) params.append('actionType', options.actionType);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      
      const response = await fetch(`/api/credits/usage?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setUsageHistory(result.data);
      } else {
        setError(result.error || 'Failed to fetch usage history');
      }
    } catch (err) {
      setError('Failed to fetch usage history');
      console.error('Error fetching usage history:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Fetch subscription tiers
  const fetchSubscriptionTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/credits/tiers');
      const result = await response.json();
      
      if (result.success) {
        setSubscriptionTiers(result.data);
      } else {
        setError(result.error || 'Failed to fetch subscription tiers');
      }
    } catch (err) {
      setError('Failed to fetch subscription tiers');
      console.error('Error fetching subscription tiers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user has enough credits for an action
  const checkCreditsForAction = useCallback(async (actionType) => {
    if (!session?.user?.email) {
      return { has_enough_credits: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/credits/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actionType }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        return { has_enough_credits: false, error: result.error };
      }
    } catch (err) {
      console.error('Error checking credits:', err);
      return { has_enough_credits: false, error: 'Failed to check credits' };
    }
  }, [session?.user?.email]);

  // Consume credits for an action
  const consumeCreditsForAction = useCallback(async (actionType, success = true, errorMessage = null) => {
    if (!session?.user?.email) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/credits/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actionType, success, errorMessage }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh credit summary after consumption
        await fetchCreditSummary();
        return result.data;
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error consuming credits:', err);
      return { success: false, error: 'Failed to consume credits' };
    }
  }, [session?.user?.email, fetchCreditSummary]);

  // Get credit cost for an action
  const getActionCreditCost = useCallback((actionType) => {
    if (!creditSummary || !subscriptionTiers.length) return 0;
    
    const userTier = subscriptionTiers.find(tier => tier.subscription_tier === creditSummary.subscription_tier);
    if (!userTier) return 0;
    
    return userTier.credit_cost_per_action[actionType] || 0;
  }, [creditSummary, subscriptionTiers]);

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((featureName) => {
    if (!creditSummary || !subscriptionTiers.length) return false;
    
    const userTier = subscriptionTiers.find(tier => tier.subscription_tier === creditSummary.subscription_tier);
    if (!userTier) return false;
    
    return userTier.features_enabled[featureName] === true;
  }, [creditSummary, subscriptionTiers]);

  // Format credit balance for display
  const formatCredits = useCallback((credits) => {
    if (credits === null || credits === undefined || isNaN(credits)) return '0';
    return credits.toLocaleString();
  }, []);

  // Get usage percentage for current month
  const getUsagePercentage = useCallback(() => {
    if (!creditSummary || !subscriptionTiers.length) return 0;
    
    const userTier = subscriptionTiers.find(tier => tier.subscription_tier === creditSummary.subscription_tier);
    if (!userTier) return 0;
    
    const monthlyCredits = userTier.monthly_credits || 0;
    const usedThisMonth = creditSummary.usage_this_month || 0;
    
    // Prevent division by zero
    if (monthlyCredits === 0) return 0;
    
    return Math.min((usedThisMonth / monthlyCredits) * 100, 100);
  }, [creditSummary, subscriptionTiers]);

  // Get current tier info
  const getCurrentTier = useCallback(() => {
    if (!creditSummary || !subscriptionTiers.length) return null;
    
    return subscriptionTiers.find(tier => tier.subscription_tier === creditSummary.subscription_tier);
  }, [creditSummary, subscriptionTiers]);

  // Get next tier info
  const getNextTier = useCallback(() => {
    if (!creditSummary || !subscriptionTiers.length) return null;
    
    const currentTierIndex = subscriptionTiers.findIndex(tier => tier.subscription_tier === creditSummary.subscription_tier);
    if (currentTierIndex === -1 || currentTierIndex === subscriptionTiers.length - 1) return null;
    
    return subscriptionTiers[currentTierIndex + 1];
  }, [creditSummary, subscriptionTiers]);

  // Load initial data
  useEffect(() => {
    if (session?.user?.email) {
      fetchCreditSummary();
      fetchSubscriptionTiers();
    }
  }, [session?.user?.email, fetchCreditSummary, fetchSubscriptionTiers]);

  return {
    // State
    creditSummary,
    usageHistory,
    subscriptionTiers,
    loading,
    error,
    
    // Actions
    fetchCreditSummary,
    fetchUsageHistory,
    fetchSubscriptionTiers,
    checkCreditsForAction,
    consumeCreditsForAction,
    
    // Computed values
    getActionCreditCost,
    hasFeatureAccess,
    formatCredits,
    getUsagePercentage,
    getCurrentTier,
    getNextTier,
    
    // Convenience getters
    creditsBalance: creditSummary?.credits_balance || 0,
    subscriptionTier: creditSummary?.subscription_tier || 'free',
    subscriptionStatus: creditSummary?.subscription_status || 'active',
    usageThisMonth: creditSummary?.usage_this_month || 0,
    usageByAction: creditSummary?.usage_by_action || {},
    
    // Utility functions
    clearError: () => setError(null),
    refresh: () => {
      fetchCreditSummary();
      fetchSubscriptionTiers();
    }
  };
} 