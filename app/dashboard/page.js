"use client"; // Mark this component as a Client Component

import Link from "next/link";
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
  ArrowLeft
} from 'lucide-react';
import { useSession, signOut } from "next-auth/react"; // Import useSession and signOut

export default function Dashboard() {
  const { data: session, status } = useSession(); // Fetch session data
  const user = session?.user; // Extract user data from session (contains name, email, image)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAF9F6' }}>
      {/* Sidebar */}
      <aside className="w-56 bg-gray-50 shadow-md flex flex-col fixed top-0 left-0 h-screen" style={{ backgroundColor: '#EFEFE7' }}>
        <div className="flex-1 flex flex-col">
          {/* Logo with Back Arrow */}
          <div className="p-4 pl-4 pr-6 flex items-center gap-2">
            <Link href="/">
              <ArrowLeft size={20} className="text-gray-800 hover:text-gray-600 transition" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800 leading-none align-middle">SwiftReel</h1>
          </div>

          {/* Sidebar Navigation */}
          <nav className="mt-4 pl-4 pr-6 flex-1">
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard">
                  <span className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 text-gray-800 rounded border border-gray-300 text-sm">
                    <Home size={18} />
                    Home
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/videos">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <Video size={18} />
                    Videos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/schedule">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <Calendar size={18} />
                    Schedule
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/campaigns">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <Megaphone size={18} />
                    Campaigns
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/images">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <ImageIcon size={18} />
                    Images
                  </span>
                </Link>
              </li>

              {/* Spacing above Playground */}
              <li className="mt-3">
                <span className="flex items-center gap-3 px-3 py-1.5 text-gray-500 font-normal text-sm pl-5">
                  Playground
                </span>
              </li>

              <li>
                <Link href="/slides">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <Book size={18} />
                    Slides
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/avatars">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <User size={18} />
                    Avatars
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <HelpCircle size={18} />
                    Support
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/settings">
                  <span className="flex items-center gap-3 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-sm hover:rounded text-sm">
                    <Settings size={18} />
                    Settings
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* User Info and Upgrade Button */}
        <div className="p-4 pl-4 pr-6">
          <Link href="/#pricing">
            <button className="w-full bg-[#ff4514] text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition">
              Upgrade
            </button>
          </Link>
          <div className="mt-4 flex items-center gap-3">
            {/* Display Google Account Details */}
            {status === "loading" ? (
              <p className="text-gray-800 font-semibold text-sm">Loading...</p>
            ) : user ? (
              <>
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
              </>
            ) : (
              <div>
                <p className="text-gray-800 font-semibold text-sm">Not signed in</p>
                <Link href="/api/auth/signin">
                  <span className="text-blue-500 text-xs hover:underline">Sign in with Google</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-56" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', overflowY: 'auto' }}>
        {/* Header with Centered Welcome */}
        <div className="mb-8">
          <div className="flex justify-center">
            <h1 className="text-2xl font-bold text-gray-800">Welcome to SwiftReel</h1>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-500 text-xl">🎥</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Create UGC videos</h2>
            </div>
            <p className="text-gray-500">Create & publish UGC videos promoting your product demo</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-500 text-xl">🎬</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Create Greenscreen Meme videos</h2>
            </div>
            <p className="text-gray-500">Create relatable meme videos about your product / business</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-500 text-xl">🧑</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">UGC Avatar Generator</h2>
            </div>
            <p className="text-gray-500">Create custom AI avatars for the UGC</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-500 text-xl">✨</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Hook Generator</h2>
            </div>
            <p className="text-gray-500">Auto-magically generate and save viral hooks</p>
          </div>
        </div>

        {/* Get Started Section with more spacing */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Get Started</h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                  <span className="text-purple-500 text-xl">S</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Subscription required</h3>
                  <p className="text-gray-500 text-sm">Estimated 2–3 minutes</p>
                </div>
              </div>
              <Link href="/#pricing">
                <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
                  Upgrade now
                  <span>➔</span>
                </button>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-black text-xl">🎵</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Connect TikTok account</h3>
                  <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
                </div>
              </div>
              <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
                Connect TikTok
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-black text-xl">📦</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Add your first product</h3>
                  <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
                </div>
              </div>
              <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
                Add Product
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-black text-xl">🎥</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Upload product demo video</h3>
                  <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
                </div>
              </div>
              <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
                Upload Demo
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}