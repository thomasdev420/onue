'use client';

import React from 'react';
import { useCredits } from '../shared/hooks/useCredits';
import { Coins, TrendingUp, AlertCircle, CheckCircle, Crown, Zap } from 'lucide-react';

/**
 * Credit Display Component
 * Shows user's credit balance, usage, and subscription information
 */
export default function CreditDisplay({ 
  showDetails = false, 
  showUpgrade = true, 
  className = '',
  compact = false 
}) {
  const {
    creditsBalance,
    subscriptionTier,
    subscriptionStatus,
    usageThisMonth,
    usageByAction,
    getCurrentTier,
    getNextTier,
    getUsagePercentage,
    formatCredits,
    getActionCreditCost,
    loading,
    error,
    refresh
  } = useCredits();

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const usagePercentage = getUsagePercentage();

  // Ensure usagePercentage is a valid number
  const safeUsagePercentage = isNaN(usagePercentage) ? 0 : usagePercentage;

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm">Loading credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Error loading credits</span>
        <button 
          onClick={refresh}
          className="text-blue-500 hover:text-blue-600 text-xs underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'growth':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'scale':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'starter':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Coins className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'growth':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'scale':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'starter':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Coins className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">{formatCredits(creditsBalance)}</span>
        <div className={`px-2 py-1 rounded-full text-xs border ${getTierColor(subscriptionTier)}`}>
          {subscriptionTier}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
        </div>
        <div className="flex items-center space-x-2">
          {getTierIcon(subscriptionTier)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(subscriptionTier)}`}>
            {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
          </span>
        </div>
      </div>

      {/* Credit Balance */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">{formatCredits(creditsBalance)}</span>
          <span className="text-sm text-gray-500">credits available</span>
        </div>
        
        {/* Usage Progress */}
        {currentTier && (
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Usage this month</span>
              <span>{formatCredits(usageThisMonth)} / {formatCredits(currentTier.monthly_credits)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  safeUsagePercentage > 80 ? 'bg-red-500' : 
                  safeUsagePercentage > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${safeUsagePercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {safeUsagePercentage.toFixed(1)}% used
            </div>
          </div>
        )}
      </div>

      {/* Action Costs */}
      {showDetails && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Action Costs</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Slide Generation</span>
              <span className="font-medium">{getActionCreditCost('slide_generation')} credits</span>
            </div>
            <div className="flex justify-between">
              <span>AI Chat</span>
              <span className="font-medium">{getActionCreditCost('ai_chat')} credits</span>
            </div>
            <div className="flex justify-between">
              <span>Image Analysis</span>
              <span className="font-medium">{getActionCreditCost('image_analysis')} credits</span>
            </div>
            <div className="flex justify-between">
              <span>Visual Analysis</span>
              <span className="font-medium">{getActionCreditCost('visual_analysis')} credits</span>
            </div>
          </div>
        </div>
      )}

      {/* Usage Breakdown */}
      {showDetails && Object.keys(usageByAction).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">This Month's Usage</h4>
          <div className="space-y-1">
            {Object.entries(usageByAction).map(([action, credits]) => (
              <div key={action} className="flex justify-between text-xs">
                <span className="capitalize">{action.replace('_', ' ')}</span>
                <span className="font-medium">{formatCredits(credits)} credits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {showUpgrade && nextTier && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Upgrade to {nextTier.subscription_tier}</p>
              <p className="text-xs text-gray-500">
                Get {formatCredits(nextTier.monthly_credits)} credits/month for ${nextTier.monthly_price}
              </p>
            </div>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="flex items-center space-x-2 mt-3 text-xs">
        {subscriptionStatus === 'active' ? (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-green-600">Active subscription</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            <span className="text-yellow-600">Subscription {subscriptionStatus}</span>
          </>
        )}
      </div>
    </div>
  );
} 