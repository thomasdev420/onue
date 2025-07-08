'use client';

import Link from "next/link";
import Image from 'next/image';
import { useSession, signOut } from "next-auth/react";
import { usePathname } from 'next/navigation';
import { Home, Video, Calendar, Megaphone, Image as ImageIcon, Book, User, HelpCircle, Settings, ArrowLeft, Wand2, Menu, Sparkles, PartyPopper, Upload } from 'lucide-react';

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  return (
    <aside className={`bg-gray-50 shadow-md flex flex-col fixed top-0 left-0 h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`} style={{ backgroundColor: '#EFEFE7' }}>
      <div className="flex-1 flex flex-col">
        {/* Logo and Toggle Button */}
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          {!isCollapsed && (
            <Link href="/">
              <ArrowLeft size={20} className="text-gray-800 hover:text-gray-600 transition" />
            </Link>
          )}
          {!isCollapsed && <h1 className="text-xl font-bold text-gray-800">SwiftReel</h1>}
          <button onClick={toggleSidebar} className={`${isCollapsed ? '' : 'ml-auto'}`}>
            <Menu size={20} className="text-gray-800 hover:text-gray-600 transition" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-2 px-4 flex-1">
          <ul className="space-y-1 text-sm">
            <SidebarLink href="/dashboard" icon={<Home size={18} />} label="Home" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/content" icon={<Video size={18} />} label="Content Generator" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/upload" icon={<Upload size={18} />} label="Content Upload" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/schedule" icon={<Calendar size={18} />} label="Schedule" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/analytics" icon={<Megaphone size={18} />} label="Analytics" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/magic" icon={<Wand2 size={18} />} label="Magic Mode" currentPath={pathname} isCollapsed={isCollapsed} />
            <div className="mt-4"></div>
            <SidebarLink href="/dashboard/support" icon={<HelpCircle size={18} />} label="Support" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" currentPath={pathname} isCollapsed={isCollapsed} />
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

        {/* Display Google Account Details */}
        {status === "loading" ? (
          <p className={`text-gray-800 font-semibold text-sm ${isCollapsed ? 'text-center' : 'mt-4'}`}>Loading...</p>
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
                <p className="text-gray-800 font-semibold text-sm">{user.name}</p>
                <p className="text-gray-500 text-xs">{user.email}</p>
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
            <p className="text-gray-800 font-semibold text-sm">Not signed in</p>
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

function SidebarLink({ href, icon, label, currentPath, isCollapsed }) {
  const isActive = currentPath === href || 
    (href !== '/dashboard' && href !== '/dashboard/slides' && href !== '/dashboard/lfg' && currentPath?.startsWith(href)) || 
    (href === '/dashboard' && currentPath === '/dashboard') ||
    (href === '/dashboard/slides' && currentPath === '/dashboard/slides') ||
    (href === '/dashboard/lfg' && currentPath === '/dashboard/lfg');

  // Check if the link is for settings or support
  const isSettingsOrSupport = href.includes('/settings') || href.includes('/support');

  return (
    <li>
      <Link href={href}>
        <span className={`flex items-center gap-3 px-3 py-[5px] ${
          isSettingsOrSupport ? 'text-gray-500' : 'text-gray-800'
        } hover:bg-white hover:shadow-sm hover:rounded text-sm transition-colors duration-200 ${
          isActive ? 'bg-white shadow-sm rounded text-[#ff4514] font-medium' : ''
        } ${isCollapsed ? 'justify-center' : ''}`}>
          {icon}
          {!isCollapsed && label}
        </span>
      </Link>
    </li>
  );
} 