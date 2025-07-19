'use client';

import React from 'react';
import Link from 'next/link';
import { useCredits } from '../shared/hooks/useCredits';
import { Coins, TrendingUp, Crown, Zap, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Compact Credit Display for Sidebar
 * Shows user's credit balance and subscription info in a condensed format
 */
export default function SidebarCreditDisplay({ isCollapsed, className = '' }) {
  const {
    creditSummary,
    creditsBalance,
    subscriptionTier,
    subscriptionStatus,
    usageThisMonth,
    getCurrentTier,
    getUsagePercentage,
    formatCredits,
    loading,
    error,
    refresh
  } = useCredits();

  const currentTier = getCurrentTier();
  const usagePercentage = getUsagePercentage();

  // Ensure usagePercentage is a valid number
  const safeUsagePercentage = isNaN(usagePercentage) ? 0 : usagePercentage;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('SidebarCreditDisplay Debug:', {
      creditsBalance,
      subscriptionTier,
      usageThisMonth,
      currentTier: currentTier?.subscription_tier,
      usagePercentage,
      loading,
      error
    });
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        {!isCollapsed && <span className="text-xs text-gray-500 ml-2">Loading...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="text-gray-900 font-medium mb-2">
          <span className="text-gray-400">Demo:</span> 150 credits remaining
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-green-500 h-1 rounded-full transition-all duration-300" style={{ width: '25%' }} />
        </div>
        {!isCollapsed && (
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span>Demo mode</span>
            <button 
              onClick={refresh}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Load real credits
            </button>
          </div>
        )}
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

  const getUsageColor = (percentage) => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (isCollapsed) {
    return null;
  }

  // Fallback display when credit data is not available
  if (!creditSummary && !loading && !error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="text-gray-900 font-medium mb-2">
          <span className="text-gray-400">Demo:</span> 200 credits remaining
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: '40%' }} />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Demo mode - <span className="text-blue-500">Starter Plan</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Main Text */}
      <div className="text-gray-900 font-medium mb-2">
        {formatCredits(creditsBalance)} credits remaining
      </div>
      
      {/* Thin Bar Chart */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-300 ${getUsageColor(safeUsagePercentage)}`}
          style={{ width: `${Math.min(safeUsagePercentage, 100)}%` }}
        />
      </div>
    </div>
  );
} 