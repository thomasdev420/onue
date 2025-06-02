'use client';

import Link from "next/link";
import Image from 'next/image';
import {
  Home,
  Video,
  Calendar,
  Megaphone,
  Image as ImageIcon,
  Book,
  User,
  HelpCircle,
  Settings,
  ArrowLeft,
  Wand2,
  Menu,
  Sparkles
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { usePathname } from 'next/navigation';

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
            <SidebarLink href="/dashboard/content" icon={<Video size={18} />} label="Content" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/schedule" icon={<Calendar size={18} />} label="Schedule" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/analytics" icon={<Megaphone size={18} />} label="Analytics" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/magic" icon={<Wand2 size={18} />} label="Magic Mode" currentPath={pathname} isCollapsed={isCollapsed} />

            {!isCollapsed && <li className="mt-3 text-gray-500 pl-5">Playground</li>}

            <SidebarLink href="/dashboard/slides" icon={<Book size={18} />} label="Slides" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/hook-demo" icon={<Sparkles size={18} />} label="Hook & Demo" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/memes" icon={<ImageIcon size={18} />} label="Memes" currentPath={pathname} isCollapsed={isCollapsed} />

            <div className="mt-8"></div>

            <SidebarLink href="/dashboard/support" icon={<HelpCircle size={18} />} label="Support" currentPath={pathname} isCollapsed={isCollapsed} />
            <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" currentPath={pathname} isCollapsed={isCollapsed} />
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4">
        {!isCollapsed && (
          <Link href="/#pricing">
            <button className="w-full bg-[#ff4514] text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition">
              Upgrade
            </button>
          </Link>
        )}

        {/* Display Google Account Details */}
        {status === "loading" ? (
          <p className={`text-gray-800 font-semibold text-sm ${isCollapsed ? 'text-center' : 'mt-4'}`}>Loading...</p>
        ) : user ? (
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center mt-4' : 'mt-4'}`}>
            <img
              src={user.image}
              alt="Google Profile"
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
              <Link href="/api/auth/signin">
                <span className="text-blue-500 text-xs hover:underline">Sign in with Google</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, currentPath, isCollapsed }) {
  const isActive = currentPath === href || 
    (href !== '/dashboard' && currentPath?.startsWith(href)) || 
    (href === '/dashboard' && currentPath === '/dashboard');

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