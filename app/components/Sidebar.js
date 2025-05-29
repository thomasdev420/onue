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
  Wand2
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-50 shadow-md flex flex-col fixed top-0 left-0 h-screen" style={{ backgroundColor: '#EFEFE7' }}>
      <div className="flex-1 flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <Link href="/">
            <ArrowLeft size={20} className="text-gray-800 hover:text-gray-600 transition" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">SwiftReel</h1>
        </div>

        {/* Nav */}
        <nav className="mt-2 px-4 flex-1">
          <ul className="space-y-1 text-sm">
            <SidebarLink href="/dashboard" icon={<Home size={18} />} label="Home" currentPath={pathname} />
            <SidebarLink href="/dashboard/videos" icon={<Video size={18} />} label="Videos" currentPath={pathname} />
            <SidebarLink href="/dashboard/schedule" icon={<Calendar size={18} />} label="Schedule" currentPath={pathname} />
            <SidebarLink href="/dashboard/campaigns" icon={<Megaphone size={18} />} label="Campaigns" currentPath={pathname} />
            <SidebarLink href="/dashboard/images" icon={<ImageIcon size={18} />} label="Images" currentPath={pathname} />

            <li className="mt-3 text-gray-500 pl-5">Playground</li>

            <SidebarLink href="/dashboard/slides" icon={<Book size={18} />} label="Slides" currentPath={pathname} />
            <SidebarLink href="/dashboard/avatars" icon={<User size={18} />} label="Avatars" currentPath={pathname} />
            <SidebarLink href="/dashboard/hook-demo" icon={<Wand2 size={18} />} label="Hook & Demo" currentPath={pathname} />
            <SidebarLink href="/dashboard/support" icon={<HelpCircle size={18} />} label="Support" currentPath={pathname} />
            <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" currentPath={pathname} />
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4">
        <Link href="/#pricing">
          <button className="w-full bg-[#ff4514] text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition">
            Upgrade
          </button>
        </Link>

        {/* Display Google Account Details */}
        {status === "loading" ? (
          <p className="text-gray-800 font-semibold text-sm mt-4">Loading...</p>
        ) : user ? (
          <div className="mt-4 flex items-center gap-3">
            <img
              src={user.image}
              alt="Google Profile"
              className="w-10 h-10 rounded-full"
            />
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
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-gray-800 font-semibold text-sm">Not signed in</p>
            <Link href="/api/auth/signin">
              <span className="text-blue-500 text-xs hover:underline">Sign in with Google</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, currentPath }) {
  const isActive = currentPath === href || 
    (href !== '/' && currentPath?.startsWith(href)) || 
    (href === '/dashboard' && currentPath === '/');

  return (
    <li>
      <Link href={href}>
        <span className={`flex items-center gap-3 px-3 py-[5px] text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm transition-colors duration-200 ${
          isActive ? 'bg-white shadow-sm rounded text-[#ff4514] font-medium' : ''
        }`}>
          {icon}
          {label}
        </span>
      </Link>
    </li>
  );
} 