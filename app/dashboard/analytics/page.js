'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// Table component for analytics accounts
function AccountAnalyticsModal({ open, onClose, account }) {
  if (!open || !account) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative border border-gray-100">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 relative">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div className="flex items-center gap-4">
            <Image src={account.avatar} alt={account.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" />
            <div>
              <div className="font-bold text-xl text-gray-900 leading-tight">{account.name}</div>
              <div className="text-sm text-gray-500">{account.handle}</div>
            </div>
          </div>
        </div>
        {/* Analytics Cards */}
        <div className="px-8 pt-8 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/90 rounded-2xl shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Views</span>
                <span className="text-green-500 text-xs font-medium">+12.5%</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-3">{account.views ? (account.views >= 1000000 ? `${(account.views/1000000).toFixed(1)}M` : account.views) : 0}</div>
              <div className="h-14">
                <svg width="100%" height="100%" viewBox="0 0 250 60" className="w-full h-full">
                  <defs>
                    <linearGradient id="viewsFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05"/>
                    </linearGradient>
                  </defs>
                  <path d="M10,45 L50,35 L90,25 L130,20 L170,15 L210,10 L250,5" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                    strokeDasharray: "300",
                    strokeDashoffset: "300",
                    animation: "drawLine 1.2s ease-out forwards"
                  }}/>
                  <path d="M10,45 L50,35 L90,25 L130,20 L170,15 L210,10 L250,5 L250,60 L10,60 Z" fill="url(#viewsFill)"/>
                </svg>
              </div>
            </div>
            <div className="bg-white/90 rounded-2xl shadow p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Followers</span>
                <span className="text-green-500 text-xs font-medium">+8.2%</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-3">{account.followers ? (account.followers >= 1000 ? `${(account.followers/1000).toFixed(1)}K` : account.followers) : 0}</div>
              <div className="h-14">
                <svg width="100%" height="100%" viewBox="0 0 250 60" className="w-full h-full">
                  <defs>
                    <linearGradient id="followersFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.05"/>
                    </linearGradient>
                  </defs>
                  <path d="M10,50 L50,40 L90,30 L130,25 L170,20 L210,15 L250,10" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                    strokeDasharray: "300",
                    strokeDashoffset: "300",
                    animation: "drawLine 1.2s ease-out 0.3s forwards"
                  }}/>
                  <path d="M10,50 L50,40 L90,30 L130,25 L170,20 L210,15 L250,10 L250,60 L10,60 Z" fill="url(#followersFill)"/>
                </svg>
              </div>
            </div>
          </div>
          {/* Lower Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col items-start min-h-[65px] border border-gray-100">
              <div className="text-gray-400 text-xs mb-0.5">Engagement Rate</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">4.8%</span>
              </div>
            </div>
            <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col items-start min-h-[65px] border border-gray-100">
              <div className="text-gray-400 text-xs mb-0.5">Avg. Watch Time</div>
              <span className="text-lg font-semibold text-gray-900">2m 34s</span>
            </div>
            <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col items-start min-h-[65px] border border-gray-100">
              <div className="text-gray-400 text-xs mb-0.5">Content Posted</div>
              <span className="text-lg font-semibold text-gray-900">47</span>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes drawLine {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function AccountsTable({ data, onRowClick, isCollapsed }) {
  return (
    <div className={`${isCollapsed ? 'overflow-x-auto' : 'overflow-x-hidden'} rounded-2xl border border-gray-100 shadow-xl bg-white/90 backdrop-blur-md`}>
      <table className="min-w-full text-sm text-gray-800 font-inter">
        <thead className="bg-gradient-to-r from-orange-50 via-white to-violet-50 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-4 text-left font-bold tracking-wide text-gray-700 uppercase text-xs">Account</th>
            <th className="px-6 py-4 text-left font-bold tracking-wide text-gray-700 uppercase text-xs">Platform</th>
            <th className="px-6 py-4 text-left font-bold tracking-wide text-gray-700 uppercase text-xs">Type</th>
            <th className="px-6 py-4 text-left font-bold tracking-wide text-gray-700 uppercase text-xs">Status</th>
            <th className="px-6 py-4 text-right font-bold tracking-wide text-gray-700 uppercase text-xs">Followers</th>
            <th className="px-6 py-4 text-right font-bold tracking-wide text-gray-700 uppercase text-xs">Trend</th>
            <th className="px-6 py-4 text-right font-bold tracking-wide text-gray-700 uppercase text-xs">Views</th>
            <th className="px-6 py-4 text-center font-bold tracking-wide text-gray-700 uppercase text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={`transition-colors cursor-pointer hover:bg-violet-50/60 border-b border-gray-100 last:border-b-0`}
              onClick={() => onRowClick(row)}
            >
              <td className="px-6 py-4 flex items-center gap-3 min-w-[180px]">
                <Image src={row.avatar} alt={row.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
                <div>
                  <div className="font-semibold text-gray-900 leading-tight text-base">{row.name}</div>
                  <div className="text-xs text-gray-500">{row.handle}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-lg text-xs font-medium shadow-sm">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9.5 2.5v19l7-7h5v-5h-5l-7-7z" fill="#111"/></svg>
                  TikTok
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold shadow ${row.type === 'Done For You' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{row.type}</span>
              </td>
              <td className="px-6 py-4">
                {row.statusType === 'progress' ? (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-semibold animate-pulse shadow">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="8" cy="12" r="6" fill="#34d399"/></svg>
                    {row.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold shadow">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#22c55e"/></svg>
                    {row.status}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right font-semibold tracking-wide">{row.followers ? (row.followers >= 1000 ? `${(row.followers/1000).toFixed(1)}K` : row.followers) : 0}</td>
              <td className="px-6 py-4 text-right">
                {row.trend === 'up' ? (
                  <svg width="48" height="16" viewBox="0 0 48 16"><polyline points="0,16 12,8 24,12 36,4 48,8" fill="none" stroke="#22c55e" strokeWidth="2"/></svg>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-right font-semibold tracking-wide">{row.views ? (row.views >= 1000000 ? `${(row.views/1000000).toFixed(1)}M` : row.views) : 0}</td>
              <td className="px-6 py-4 text-center">
                <button className="p-1.5 rounded-full hover:bg-orange-100 transition shadow-sm border border-transparent hover:border-orange-300" onClick={e => e.stopPropagation()}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" fill="#a3a3a3"/><circle cx="12" cy="12" r="2" fill="#a3a3a3"/><circle cx="12" cy="19" r="2" fill="#a3a3a3"/></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const mockAccounts = [
  {
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Study with Lily',
    handle: '@studywithlily',
    platform: 'tiktok',
    type: 'Done For You',
    status: '1 / 7 days',
    statusType: 'progress',
    followers: 0,
    trend: null,
    views: 0,
  },
  {
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: "Jake's Grind Time",
    handle: '@jakesgrindtime',
    platform: 'tiktok',
    type: 'Done For You',
    status: '3 / 7 days',
    statusType: 'progress',
    followers: 0,
    trend: null,
    views: 0,
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    name: 'Mindful Emily',
    handle: '@mindfulemily',
    platform: 'tiktok',
    type: 'Done For You',
    status: 'Ready',
    statusType: 'ready',
    followers: 134000,
    trend: 'up',
    views: 4300000,
  },
  {
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    name: 'Study with Kevin',
    handle: '@studywithkevin',
    platform: 'tiktok',
    type: 'Imported',
    status: 'Ready',
    statusType: 'ready',
    followers: 98000,
    trend: 'up',
    views: 3200000,
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    name: 'Maya Does Focus',
    handle: '@mayadoesfocus',
    platform: 'tiktok',
    type: 'Done For You',
    status: 'Ready',
    statusType: 'ready',
    followers: 156000,
    trend: 'up',
    views: 5200000,
  },
  {
    avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
    name: "Austin's Big Brain",
    handle: '@austinsbigbrain',
    platform: 'tiktok',
    type: 'Imported',
    status: 'Ready',
    statusType: 'ready',
    followers: 189000,
    trend: 'up',
    views: 6500000,
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    name: 'Study with Sarah',
    handle: '@studywithsarah',
    platform: 'tiktok',
    type: 'Done For You',
    status: 'Ready',
    statusType: 'ready',
    followers: 245000,
    trend: 'up',
    views: 8900000,
  },
];

export default function Analytics({ accounts = mockAccounts, isCollapsed }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (account) => {
    setSelectedAccount(account);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAccount(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#FAF9F6] font-inter">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8 tracking-tight">Analytics</h1>
      <section className="space-y-4 max-w-6xl mx-auto">
        {/* Dashboard Table Section */}
        <div className="mt-10">
          <AccountsTable data={accounts} onRowClick={handleRowClick} isCollapsed={isCollapsed} />
        </div>
        <AccountAnalyticsModal open={modalOpen} onClose={handleModalClose} account={selectedAccount} />
      </section>
    </div>
  );
} 