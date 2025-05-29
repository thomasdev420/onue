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

export default function Dashboard() {
  return (
    <>
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
          <p className="text-gray-600">Create & publish UGC videos promoting your product demo</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-500 text-xl">🎬</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Create Greenscreen Meme videos</h2>
          </div>
          <p className="text-gray-600">Create relatable meme videos about your product / business</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-500 text-xl">🧑</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">UGC Avatar Generator</h2>
          </div>
          <p className="text-gray-600">Create custom AI avatars for the UGC</p>
        </div>

        {/* Card 4 - Hook Generator */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-500 text-xl">✨</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Hook Generator</h2>
          </div>
          <p className="text-gray-600">Auto-magically generate and save viral hooks</p>
        </div>
      </div>

      {/* Get Started Section */}
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
                <h3 className="text-base font-semibold text-gray-800">Create your first video</h3>
                <p className="text-gray-500 text-sm">Estimated 1 minute</p>
              </div>
            </div>
            <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
              Create Video
            </button>
          </div>
        </div>
      </div>
    </>
  );
}