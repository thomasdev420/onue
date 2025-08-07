'use client';

import React from 'react';

export default function AccountsPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts</h1>
          <p className="text-gray-600">Manage your connected accounts</p>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="mx-auto mb-4">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Accounts Connected</h3>
            <p className="text-gray-500">Connect your social media accounts to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 