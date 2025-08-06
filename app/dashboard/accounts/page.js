'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Instagram, Music, Settings, Calendar, Clock, TrendingUp, ExternalLink, Trash2, Edit3 } from 'lucide-react';

export default function AccountsPage() {
  const { data: session } = useSession();
  const [socialAccounts, setSocialAccounts] = useState([
    {
      id: 1,
      platform: 'TikTok',
      username: '@flightmedia',
      followers: '125K',
      status: 'connected',
      lastPost: '2 hours ago',
      nextScheduled: 'Tomorrow at 3 PM',
      icon: <Music className="w-5 h-5" />
    },
    {
      id: 2,
      platform: 'Instagram',
      username: '@flightmedia_official',
      followers: '89K',
      status: 'connected',
      lastPost: '1 day ago',
      nextScheduled: 'Friday at 2 PM',
      icon: <Instagram className="w-5 h-5" />
    },
    {
      id: 3,
      platform: 'TikTok',
      username: '@flightmedia_creatives',
      followers: '45K',
      status: 'disconnected',
      lastPost: '3 days ago',
      nextScheduled: null,
      icon: <Music className="w-5 h-5" />
    }
  ]);

  const [showAddAccount, setShowAddAccount] = useState(false);

  const getStatusColor = (status) => {
    return status === 'connected' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (status) => {
    return status === 'connected' ? 'bg-green-100' : 'bg-red-100';
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'TikTok':
        return 'text-black bg-gray-100';
      case 'Instagram':
        return 'text-white bg-gradient-to-r from-purple-500 to-pink-500';
      case 'YouTube':
        return 'text-white bg-red-600';
      case 'Twitter':
        return 'text-white bg-blue-500';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Accounts</h1>
          <p className="text-gray-600">Manage your connected social media accounts and content scheduling</p>
        </div>

        {/* Add Account Button */}
        <div className="mb-8">
          <button 
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Account
          </button>
        </div>

        {/* Connected Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {socialAccounts.map((account) => (
            <div key={account.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* Account Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${getPlatformColor(account.platform)}`}>
                    {account.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.platform}</h3>
                    <p className="text-sm text-gray-500">{account.username}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(account.status)} ${getStatusColor(account.status)}`}>
                  {account.status}
                </div>
              </div>

              {/* Account Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Followers</span>
                  <span className="font-semibold text-gray-900">{account.followers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Post</span>
                  <span className="text-sm text-gray-500">{account.lastPost}</span>
                </div>
                {account.nextScheduled && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Scheduled</span>
                    <span className="text-sm text-blue-600">{account.nextScheduled}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  <ExternalLink className="w-4 h-4" />
                  View
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Followers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">259K</div>
            <div className="text-sm text-green-600">+12% this month</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Scheduled Posts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="text-sm text-gray-500">Next: Tomorrow</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Connected Accounts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">2</div>
            <div className="text-sm text-gray-500">of 3 active</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Auto-Posting</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">Enabled</div>
            <div className="text-sm text-green-600">All platforms</div>
          </div>
        </div>

        {/* Platform Integration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Connect New Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="p-3 bg-black rounded-xl">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-gray-900">TikTok</span>
              <span className="text-sm text-gray-500">Connect Account</span>
            </button>
            
            <button className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-gray-900">Instagram</span>
              <span className="text-sm text-gray-500">Connect Account</span>
            </button>
            
            <button className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors">
              <div className="p-3 bg-red-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-gray-900">YouTube</span>
              <span className="text-sm text-gray-500">Connect Account</span>
            </button>
            
            <button className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="p-3 bg-blue-500 rounded-xl">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-gray-900">Twitter</span>
              <span className="text-sm text-gray-500">Connect Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 