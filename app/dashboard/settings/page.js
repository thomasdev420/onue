'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, X, Coins, TrendingUp, Crown, Zap, RefreshCw } from 'lucide-react';
import ErrorAlert from '../../components/ErrorAlert';
import MemoryManager from '../components/MemoryManager';

import { useCredits } from '../../shared/hooks/useCredits';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Credits hook
  const {
    creditSummary,
    usageHistory,
    subscriptionTiers,
    getCurrentTier,
    getNextTier,
    getUsagePercentage,
    formatCredits,
    getActionCreditCost,
    fetchUsageHistory,
    loading: creditsLoading,
    error: creditsError,
    refresh: refreshCredits
  } = useCredits();

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const usagePercentage = getUsagePercentage();

  // Ensure usagePercentage is a valid number
  const safeUsagePercentage = isNaN(usagePercentage) ? 0 : usagePercentage;

  const handleSetupDatabase = async () => {
    try {
      setIsSettingUp(true);
      setError(null);
      
      const response = await fetch('/api/setup/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup database');
      }

      setSuccessMessage('Database setup completed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Setup error:', error);
      setError(`Database setup failed: ${error.message}`);
    } finally {
      setIsSettingUp(false);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'growth':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'scale':
        return <Zap className="h-6 w-6 text-blue-500" />;
      case 'starter':
        return <TrendingUp className="h-6 w-6 text-green-500" />;
      default:
        return <Coins className="h-6 w-6 text-gray-500" />;
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

  const actionTypes = [
    { key: 'memory_processing', label: 'AI memory', icon: <Coins className="h-4 w-4" /> },
    { key: 'brand_analysis', label: 'Brand context', icon: <Coins className="h-4 w-4" /> },
    { key: 'content_creation', label: 'Legacy usage', icon: <Coins className="h-4 w-4" /> },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span className="text-sm font-medium">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Workspace focus */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Workspace</h2>
          <button
            onClick={handleSetupDatabase}
            disabled={isSettingUp}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSettingUp ? 'Setting up...' : 'Setup Database'}
          </button>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-indigo-900 mb-2">Amply is now focused on AI selection</p>
          <p>
            Social posting, slide generation, and media libraries have been removed from this app. Use{' '}
            <strong>AI Selection</strong> in the sidebar to ingest your product URL and measure how assistants mention
            and choose you vs competitors. Credits below may still show legacy action types from older usage.
          </p>
        </div>
      </div>

      {/* Credits & Usage Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Credits & Usage</h2>
          <button
            onClick={refreshCredits}
            disabled={creditsLoading}
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${creditsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {creditsError && (
          <ErrorAlert 
            error={creditsError} 
            onDismiss={() => {}}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              <div className="flex items-center space-x-2">
                {getTierIcon(creditSummary?.subscription_tier)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTierColor(creditSummary?.subscription_tier)}`}>
                  {creditSummary?.subscription_tier?.charAt(0).toUpperCase() + creditSummary?.subscription_tier?.slice(1)}
                </span>
              </div>
            </div>

            {currentTier && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Credits</span>
                  <span className="font-semibold">{formatCredits(currentTier.monthly_credits)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Used This Month</span>
                  <span className="font-semibold">{formatCredits(creditSummary?.usage_this_month || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold">{formatCredits(creditSummary?.credits_balance || 0)}</span>
                </div>
                
                {/* Usage Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Usage Progress</span>
                    <span>{safeUsagePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(safeUsagePercentage)}`}
                      style={{ width: `${safeUsagePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Costs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Costs</h3>
            <div className="grid grid-cols-2 gap-3">
              {actionTypes.slice(0, 6).map((action) => (
                <div key={action.key} className="text-center p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    {action.icon}
                  </div>
                  <div className="text-xs font-medium text-gray-900">{action.label}</div>
                  <div className="text-sm font-bold text-blue-600">
                    {getActionCreditCost(action.key)} credits
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month&apos;s Usage</h3>
            {Object.keys(creditSummary?.usage_by_action || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(creditSummary?.usage_by_action || {}).slice(0, 5).map(([action, credits]) => {
                  const actionInfo = actionTypes.find(a => a.key === action);
                  return (
                    <div key={action} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {actionInfo?.icon}
                        <span className="text-sm font-medium capitalize">{action.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{formatCredits(credits)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Coins className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No usage data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade CTA */}
        {nextTier && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Upgrade to {nextTier.subscription_tier}</h3>
                <p className="text-blue-100 mb-4">
                  Get {formatCredits(nextTier.monthly_credits)} credits/month for ${nextTier.monthly_price}
                </p>
                <ul className="space-y-1 text-sm text-blue-100">
                  <li>• Lower credit costs per action</li>
                  <li>• Advanced features unlocked</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Memory Management */}
      <MemoryManager />
    </div>
  );
}