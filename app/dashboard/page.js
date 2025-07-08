'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, Video, Calendar, Megaphone, Image as ImageIcon, Book, User, HelpCircle, Settings, ArrowLeft, Sparkles, Lightbulb, Camera, CreditCard, Pocket, Package, Upload, Pencil, TrendingUp, Zap, Target, BarChart3, Globe, Palette } from 'lucide-react';
import ChatBar from "./components/ChatBar";
import WebsiteOnboarding from "../components/WebsiteOnboarding";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

//Dashboard page

function AnimatedLineChart({ points, color, fill, percentLabel }) {
  const [length, setLength] = useState(0);
  const pathRef = useRef(null);

  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      setLength(totalLength);
    }
  }, [points]);

  return (
    <svg viewBox="0 0 260 80" width="100%" height="80" className="overflow-visible">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        style={{
          strokeDasharray: length,
          strokeDashoffset: length,
          animation: 'dash 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
        }}
      />
      <path d={fill} fill="url(#chartFill)" />
      {percentLabel && (
        <text x="220" y="30" fontSize="14" fontWeight="bold" fill={color} opacity="0.7">{percentLabel}</text>
      )}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}

function DashboardAnalyticsSection() {
  // More detailed mock data for both lines
  const viewsPoints = [60, 58, 62, 70, 75, 80, 85, 90, 92, 95, 100, 110, 120, 130, 140, 145, 150, 155, 160, 162, 165, 170, 172, 175, 180];
  const followersPoints = [55, 56, 58, 60, 62, 65, 68, 70, 73, 75, 78, 80, 83, 85, 88, 90, 92, 94, 97, 100, 102, 104, 106, 108, 110];

  // Convert points to SVG path
  function getPath(points) {
    const step = 240 / (points.length - 1);
    let d = `M10,${80 - points[0] * 0.5}`;
    points.forEach((pt, i) => {
      if (i === 0) return;
      d += ` L${10 + i * step},${80 - pt * 0.5}`;
    });
    return d;
  }

  // Animation state for both lines
  const [viewsLength, setViewsLength] = useState(0);
  const [followersLength, setFollowersLength] = useState(0);
  const viewsRef = useRef(null);
  const followersRef = useRef(null);

  useEffect(() => {
    if (viewsRef.current) {
      setViewsLength(viewsRef.current.getTotalLength());
    }
    if (followersRef.current) {
      setFollowersLength(followersRef.current.getTotalLength());
    }
  }, []);

  return (
    <section className="w-full max-w-2xl mx-auto mt-10 mb-8 px-2 md:px-0">
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col min-h-[220px] border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-0.5">Analytics</div>
            <div className="flex gap-6 items-end">
              <div className="flex items-end gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block mr-2" />
                <span className="text-base font-semibold text-blue-400">24.5K</span>
                <span className="text-xs text-gray-400 ml-1">Views</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="w-3 h-3 rounded-full bg-purple-400 inline-block mr-2" />
                <span className="text-base font-semibold text-purple-400">8.2K</span>
                <span className="text-xs text-gray-400 ml-1">Followers</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
              +12.5%
            </span>
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
              +8.3%
            </span>
          </div>
        </div>
        <div className="bg-[#f8fbff] rounded-xl p-2 mt-2 mb-1">
          <svg viewBox="0 0 260 80" width="100%" height="80" className="overflow-visible">
            <defs>
              <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            {/* Views Line and Fill */}
            <path d={getPath([...viewsPoints, viewsPoints[viewsPoints.length-1], viewsPoints[0]]) + ` L250,80 L10,80 Z`} fill="url(#viewsFill)" />
            <path
              ref={viewsRef}
              d={getPath(viewsPoints)}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2.5"
              style={{
                filter: 'drop-shadow(0 1px 2px #60A5FA22)',
                strokeDasharray: viewsLength,
                strokeDashoffset: viewsLength,
                animation: 'dash-views 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
              }}
            />
            {/* Followers Line and Fill */}
            <path d={getPath([...followersPoints, followersPoints[followersPoints.length-1], followersPoints[0]]) + ` L250,80 L10,80 Z`} fill="url(#followersFill)" />
            <path
              ref={followersRef}
              d={getPath(followersPoints)}
              fill="none"
              stroke="#A78BFA"
              strokeWidth="2.5"
              style={{
                filter: 'drop-shadow(0 1px 2px #A78BFA22)',
                strokeDasharray: followersLength,
                strokeDashoffset: followersLength,
                animation: 'dash-followers 1.2s cubic-bezier(0.4,0,0.2,1) 0.2s forwards',
              }}
            />
            <style>{`
              @keyframes dash-views {
                to { stroke-dashoffset: 0; }
              }
              @keyframes dash-followers {
                to { stroke-dashoffset: 0; }
              }
            `}</style>
          </svg>
        </div>
        <div className="flex justify-between items-center mt-1 text-xs text-gray-300">
          <span>This month</span>
          <span>Combined Trends</span>
        </div>
      </div>
      {/* Lower Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-start min-h-[70px] border border-gray-100">
          <div className="text-gray-400 text-xs mb-0.5">Engagement Rate</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">4.8%</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-start min-h-[70px] border border-gray-100">
          <div className="text-gray-400 text-xs mb-0.5">Avg. Watch Time</div>
          <span className="text-lg font-semibold text-gray-900">2m 34s</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-start min-h-[70px] border border-gray-100">
          <div className="text-gray-400 text-xs mb-0.5">Content Posted</div>
          <span className="text-lg font-semibold text-gray-900">47</span>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const firstName = session?.user?.name?.split(' ')[0] || 'developer';
  const [showWebsiteOnboarding, setShowWebsiteOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [chatBarDocked, setChatBarDocked] = useState(false);

  // Handle authentication state
  useEffect(() => {
    if (status === 'loading') {
      // Still loading, wait
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('🔒 User not authenticated, redirecting to home');
      router.push('/');
      return;
    }
    
    if (status === 'authenticated' && session) {
      console.log('✅ User authenticated:', session.user?.email);
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need to be signed in to access the dashboard.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if user has completed onboarding on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/onboarding-status', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const { hasCompleted } = await response.json();
            setHasCompletedOnboarding(hasCompleted);
            
            // Show website onboarding for new users
            if (!hasCompleted) {
              setShowWebsiteOnboarding(true);
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // Default to showing onboarding for new users
          setShowWebsiteOnboarding(true);
        }
      }
    };

    checkOnboardingStatus();
  }, [session?.user?.email]);

  return (
    <>
      {/* Header with Centered Welcome */}
      {!chatBarDocked && (
        <div className="mb-8 mt-8">
          <div className="flex justify-center">
            <h1 className="text-2xl font-bold text-black">
              Welcome back, {firstName}
            </h1>
          </div>
        </div>
      )}
      <ChatBar
          actions={[
            {
              label: 'UGC videos',
              icon: <Camera size={18} />,
              href: '/dashboard/videos',
            },
            {
              label: 'Create Memes',
              icon: <Palette size={18} />,
              href: '/dashboard/meme',
            },
            {
              label: 'Slides',
              icon: <Book size={18} />,
              href: '/dashboard/slides',
            },
          ]}
          docked={chatBarDocked}
          onMessageSubmit={() => setChatBarDocked(true)}
        />
      {/* Personalize Button below ChatBar */}
      {!chatBarDocked && (
        <div className="w-full flex flex-wrap justify-center gap-4 mb-8 mt-4">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group"
            onClick={() => setShowWebsiteOnboarding(true)}
          >
            <Globe size={18} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
            Personalize
          </button>
          <Link href="/dashboard/schedule" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group">
            <Calendar size={18} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
            Schedule
          </Link>
          <Link href="/dashboard/content" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-sm font-medium transition-colors group">
            <Sparkles size={18} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
            Videos
          </Link>
        </div>
      )}
      <WebsiteOnboarding 
        open={showWebsiteOnboarding} 
        onClose={() => setShowWebsiteOnboarding(false)} 
        onComplete={(data) => {
          setShowWebsiteOnboarding(false);
          setHasCompletedOnboarding(true);
          console.log('Website onboarding completed:', data);
        }} 
      />
    </>
  );
}