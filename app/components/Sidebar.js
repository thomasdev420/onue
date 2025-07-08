'use client';

import React from 'react';
import Link from "next/link";
import Image from 'next/image';
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import { Home, Video, Calendar, Megaphone, Image as ImageIcon, Book, User, HelpCircle, Settings, ArrowLeft, Wand2, Menu, Sparkles, PartyPopper, Upload, Shield } from 'lucide-react';
import ModeToggle from '../dashboard/components/ModeToggle';

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = React.useState('slides');

  const handleRevokeDevAccess = () => {
    localStorage.removeItem("devAccessGranted");
    router.push('/');
  };

  return (
    <aside
      className={
        `glass-sidebar glass-card flex flex-col sidebar-fixed transition-all duration-300`
      }
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        bottom: 12,
        width: isCollapsed ? 80 : 288,
        borderRadius: 32,
        zIndex: 1000,
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(.4,0,.2,1), left 0.3s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <div className="flex-1 flex flex-col sidebar-content">
        {/* Logo and Toggle Button */}
        <div className={`p-4 flex ${isCollapsed ? 'justify-center items-center' : 'items-center gap-2'}`}> 
          {!isCollapsed && (
            <Link href="/">
              <ArrowLeft size={20} className="text-gray-800 hover:text-gray-600 transition" />
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className={isCollapsed ? '' : 'ml-auto'}
            style={isCollapsed ? { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, padding: 0 } : {}}
          >
            <Menu size={20} className="text-gray-800 hover:text-gray-600 transition" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-2 px-4 flex-1">
          <ul className="space-y-1 text-sm">
            <SidebarLink href="/dashboard" icon={<Home size={18} />} label="Home" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/slides" icon={<Video size={18} />} label="Content Generator" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/upload" icon={<Upload size={18} />} label="Content Upload" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/schedule" icon={<Calendar size={18} />} label="Schedule" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/analytics" icon={<Megaphone size={18} />} label="Analytics" currentPath={pathname} isCollapsed={isCollapsed} />
            <div className="mt-4"></div>
            <SidebarLink href="/dashboard/support" icon={<HelpCircle size={18} />} label="Support" currentPath={pathname} isCollapsed={isCollapsed} support />
            <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" currentPath={pathname} isCollapsed={isCollapsed} settings />
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4">
        {!isCollapsed && (
          <Link href="/#pricing">
            <button
              style={{
                position: 'relative',
                background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                border: 'none',
                borderRadius: '16px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
                cursor: 'pointer',
                outline: 'none',
                display: 'inline-block',
                textAlign: 'center',
                transition: 'transform 0.1s ease',
                letterSpacing: '0.01em',
                overflow: 'hidden',
                width: '100%',
              }}
              onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
            >
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '55%',
                borderRadius: '16px 16px 40% 40%/16px 16px 60% 60%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
                filter: 'blur(0.5px)',
              }} />
              <span style={{ position: 'relative', zIndex: 2 }}>Upgrade</span>
            </button>
          </Link>
        )}

        {/* Dev Access Revoke Button */}
        {!isCollapsed && (
          <button
            onClick={handleRevokeDevAccess}
            className="w-full mt-3 px-3 py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={14} />
            Revoke Dev Access
          </button>
        )}

        {/* Display Google Account Details */}
        {status === "loading" ? (
          <p className={`font-semibold text-sm ${isCollapsed ? 'text-center' : 'mt-4'}`}>Loading...</p>
        ) : user ? (
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center mt-4' : 'mt-4'}`}>
            <Image
              src={user.image || '/default-profile.png'}
              alt="Google Profile"
              width={40}
              height={40}
              className={`w-10 h-10 rounded-full ${isCollapsed ? '' : 'mr-3'}`}
            />
            {!isCollapsed && (
              <div>
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs">{user.email}</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-blue-500 text-xs hover:underline mt-1"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={` ${isCollapsed ? 'text-center mt-4' : 'mt-4'}`}>
            <p className="font-semibold text-sm">Not signed in</p>
            {!isCollapsed && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="text-blue-500 text-xs hover:underline"
              >
                Sign in with Google
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, currentPath, isCollapsed, support, settings }) {
  const isActive = currentPath === href || 
    (href !== '/dashboard' && href !== '/dashboard/slides' && href !== '/dashboard/lfg' && currentPath?.startsWith(href)) || 
    (href === '/dashboard' && currentPath === '/dashboard') ||
    (href === '/dashboard/slides' && currentPath === '/dashboard/slides') ||
    (href === '/dashboard/lfg' && currentPath === '/dashboard/lfg');

  let linkClass = 'sidebar-nav-link';
  if (isActive) linkClass += ' sidebar-nav-link-active';
  if (support) linkClass += ' sidebar-support';
  if (settings) linkClass += ' sidebar-settings';

  return (
    <li>
      <Link href={href}>
        <span className={linkClass}>
          {icon}
          {!isCollapsed && label}
        </span>
      </Link>
    </li>
  );
} 