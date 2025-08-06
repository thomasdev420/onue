'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getSupabase } from '../../../supabaseClient';
import { Upload, Instagram, Facebook, Twitter, Linkedin, Youtube, Check, X, Coins, TrendingUp, Crown, Zap, BarChart3, Calendar, RefreshCw, Play } from 'lucide-react';
import ErrorAlert from '../../components/ErrorAlert';
import Image from 'next/image';
import MemoryManager from '../components/MemoryManager';
import IntelligenceModeToggle from '../../components/IntelligenceModeToggle';

import { useUserSettings } from '../../shared/hooks/useUserSettings';
import { useCredits } from '../../shared/hooks/useCredits';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [userImages, setUserImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // User settings hook
  const {
    intelligenceMode,
    updateIntelligenceMode,
    isLoading: isLoadingSettings,
    error: settingsError,
    saveStatus: settingsSaveStatus,
    clearError: clearSettingsError
  } = useUserSettings();

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

  const fetchUserImages = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('user_images')
        .select('*')
        .eq('user_id', session.user.email);

      if (error) throw error;
      setUserImages(data || []);
    } catch (error) {
      console.error('Error fetching user images:', error);
      setError('Failed to load your images');
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserImages();
    }
  }, [session, fetchUserImages]);

  const handleFileUpload = async (event) => {
    if (!session?.user?.email) {
      setError('You must be logged in to upload images.');
      return;
    }

    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          setError('Please upload only image files');
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          setError('File size must be less than 10MB');
          continue;
        }

        const fileName = `${Date.now()}-${file.name}`;
        const supabase = getSupabase();
        const { data, error } = await supabase.storage
          .from('user-content')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-content')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('user_images')
          .insert({
            user_id: session.user.email,
            title: file.name,
            image_url: publicUrl,
            file_size: file.size,
            file_type: file.type
          });

        if (dbError) throw dbError;
      }

      setSuccessMessage('Images uploaded successfully!');
      fetchUserImages(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('user_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setSuccessMessage('Image deleted successfully!');
      fetchUserImages(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete image. Please try again.');
    }
  };

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

  const socialPlatforms = [
    { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500', subtitle: 'Creator accounts only' },
    { name: 'TikTok', icon: 'tiktok', color: 'bg-gradient-to-r from-black to-gray-800', subtitle: 'Business accounts only' }
  ];

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
    { key: 'slide_generation', label: 'Slide Generation', icon: <Coins className="h-4 w-4" /> },
    { key: 'ai_chat', label: 'AI Chat', icon: <Coins className="h-4 w-4" /> },
    { key: 'image_analysis', label: 'Image Analysis', icon: <Coins className="h-4 w-4" /> },
    { key: 'visual_analysis', label: 'Visual Analysis', icon: <Coins className="h-4 w-4" /> },
    { key: 'content_creation', label: 'Content Creation', icon: <Coins className="h-4 w-4" /> },
    { key: 'memory_processing', label: 'Memory Processing', icon: <Coins className="h-4 w-4" /> },
    { key: 'website_scraping', label: 'Website Scraping', icon: <Coins className="h-4 w-4" /> },
    { key: 'brand_analysis', label: 'Brand Analysis', icon: <Coins className="h-4 w-4" /> }
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

      {settingsError && (
        <ErrorAlert 
          error={settingsError} 
          onDismiss={clearSettingsError}
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

      {/* AI Settings Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AI Settings</h2>
          <button
            onClick={handleSetupDatabase}
            disabled={isSettingUp}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSettingUp ? 'Setting up...' : 'Setup Database'}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <IntelligenceModeToggle
            currentMode={intelligenceMode}
            onModeChange={updateIntelligenceMode}
            isLoading={isLoadingSettings}
            saveStatus={settingsSaveStatus}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Image Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Management</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {isUploading ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF up to 10MB each
                </p>
              </label>
            </div>
          </div>

          {userImages.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Your Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {userImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden">
                      <Image
                        src={image.image_url}
                        alt={image.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 50vw"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social Media Connections */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Media Connections</h2>
          
          <div className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                    {platform.icon === 'tiktok' ? (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    ) : (
                      <platform.icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(`${platform.name} connection coming soon!`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
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