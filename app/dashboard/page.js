'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings, Target, ArrowRight, Bot, Zap, HelpCircle } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useState, useEffect, useRef } from 'react';

/** Illustrative AI selection trends: link to AI Selection for real scores */
function MissionMetricsSection() {
  const visibilityPoints = [42, 44, 43, 48, 52, 55, 58, 62, 65, 68, 71, 74, 76, 78, 80, 82, 84, 85, 87, 88, 90, 91, 92, 93, 94];
  const selectionPoints = [28, 29, 30, 31, 32, 33, 35, 36, 38, 40, 41, 43, 45, 46, 48, 50, 51, 53, 55, 56, 58, 59, 60, 61, 62];

  function getPath(points) {
    const step = 240 / (points.length - 1);
    let d = `M10,${80 - points[0] * 0.55}`;
    points.forEach((pt, i) => {
      if (i === 0) return;
      d += ` L${10 + i * step},${80 - pt * 0.55}`;
    });
    return d;
  }

  const [visLen, setVisLen] = useState(0);
  const [selLen, setSelLen] = useState(0);
  const visRef = useRef(null);
  const selRef = useRef(null);

  useEffect(() => {
    if (visRef.current) setVisLen(visRef.current.getTotalLength());
    if (selRef.current) setSelLen(selRef.current.getTotalLength());
  }, []);

  return (
    <section className="w-full max-w-3xl mx-auto mt-10 mb-6 px-2 md:px-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="h-4 w-4 text-violet-600" />
            AI selection pulse
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Illustrative trend: run a scan on{' '}
            <Link href="/dashboard/selection" className="text-violet-600 font-medium hover:underline">
              AI Selection
            </Link>{' '}
            for real visibility &amp; selection scores
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-2">
          <div className="flex gap-8 items-end">
            <div className="flex items-end gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-lg font-bold text-emerald-700">•</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Visibility</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
              <span className="text-lg font-bold text-violet-700">•</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Selection</span>
            </div>
          </div>
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full font-medium">
            Demo curve
          </span>
        </div>
        <div className="bg-gradient-to-b from-violet-50/80 to-white rounded-xl p-2 mt-2">
          <svg viewBox="0 0 260 80" width="100%" height="80" className="overflow-visible">
            <defs>
              <linearGradient id="visFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="selFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <path
              d={`${getPath([...visibilityPoints, visibilityPoints[visibilityPoints.length - 1], visibilityPoints[0]])} L250,80 L10,80 Z`}
              fill="url(#visFill)"
            />
            <path
              ref={visRef}
              d={getPath(visibilityPoints)}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              style={{
                strokeDasharray: visLen,
                strokeDashoffset: visLen,
                animation: 'dash-vis 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
              }}
            />
            <path
              d={`${getPath([...selectionPoints, selectionPoints[selectionPoints.length - 1], selectionPoints[0]])} L250,80 L10,80 Z`}
              fill="url(#selFill)"
            />
            <path
              ref={selRef}
              d={getPath(selectionPoints)}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              style={{
                strokeDasharray: selLen,
                strokeDashoffset: selLen,
                animation: 'dash-sel 1.2s cubic-bezier(0.4,0,0.2,1) 0.15s forwards',
              }}
            />
            <style>{`
              @keyframes dash-vis { to { stroke-dashoffset: 0; } }
              @keyframes dash-sel { to { stroke-dashoffset: 0; } }
            `}</style>
          </svg>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase">The shift</p>
            <p className="text-sm text-gray-800 mt-1 leading-snug">
              Traffic mattered. Now <span className="font-semibold">agents pick the winner</span>.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase">What we fix</p>
            <p className="text-sm text-gray-800 mt-1 leading-snug">
              Revenue you lose when AI chooses <span className="font-semibold">competitors</span>.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
            <p className="text-[11px] font-medium text-gray-500 uppercase">Amply</p>
            <p className="text-sm text-gray-800 mt-1 leading-snug">
              Your product record so <span className="font-semibold">you get selected</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardContent() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  const quickLinks = [
    {
      href: '/dashboard/selection',
      title: 'AI Selection',
      desc: 'Simulate assistants: visibility & selection scores',
      icon: Target,
      accent: 'from-orange-500 to-rose-600',
    },
    {
      href: '/dashboard/settings',
      title: 'Settings',
      desc: 'Account, credits, and preferences',
      icon: Settings,
      accent: 'from-slate-500 to-slate-700',
    },
    {
      href: '/dashboard/support',
      title: 'Support',
      desc: 'Help and feedback',
      icon: HelpCircle,
      accent: 'from-sky-500 to-blue-600',
    },
  ];

  return (
    <AuthGuard>
      <div className="mb-6 mt-4 max-w-3xl mx-auto px-2">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 mb-2">
          AI native commerce
        </p>
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 text-balance leading-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-center text-gray-600 mt-3 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Assistants are choosing products, not people scrolling forever. Amply helps you become the{' '}
          <span className="text-indigo-600 font-semibold">picked</span> brand, with proof.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-2 mb-8">
        <Link
          href="/dashboard/selection"
          className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-violet-50 p-5 sm:p-6 shadow-md hover:shadow-lg hover:border-orange-300 transition-all"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg">
            <Zap className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-800">Start here</p>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">Run an AI selection scan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ingest your product URL and measure how models mention you vs pick you as the best option.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 group-hover:gap-2 transition-all shrink-0">
            Open <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-2 mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 px-1">Workspace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map(({ href, title, desc, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white mb-3`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-snug">{desc}</p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <MissionMetricsSection />

      <div className="max-w-3xl mx-auto px-2 mt-8 mb-12 text-center text-xs text-gray-400">
        Social content tools have been removed. This workspace is focused on{' '}
        <span className="text-gray-600 font-medium">AI selection &amp; revenue you&apos;re not capturing</span>.
      </div>
    </AuthGuard>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
