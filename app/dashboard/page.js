'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, Video, Calendar, Megaphone, Image as ImageIcon, Book, User, HelpCircle, Settings, ArrowLeft, Sparkles, ImagePlus, Lightbulb, Camera, CreditCard, Pocket, Package, Upload } from 'lucide-react';
import ChatBar from "./components/ChatBar";

//Dashboard page

export default function Dashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'developer';

  return (
    <>
      {/* Header with Centered Welcome */}
      <div className="mb-8 mt-8">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {firstName}
          </h1>
        </div>
        <ChatBar
          actions={[
            {
              label: 'Create UGC videos',
              icon: <Camera size={18} className="text-blue-500" />,
              href: '/dashboard/videos',
            },
            {
              label: 'Create Greenscreen Meme videos',
              icon: <Sparkles size={18} className="text-green-500" />,
              href: '/dashboard/memes',
            },
            {
              label: 'UGC Avatar Generator',
              icon: <ImagePlus size={18} className="text-purple-500" />,
              href: '/dashboard/avatars',
            },
            {
              label: 'Slides',
              icon: <Book size={18} className="text-blue-500" />,
              href: '/dashboard/slides',
            },
          ]}
        />
      </div>

      {/* Spacer between chat bar and sections below */}
      <div className="h-12" />

      {/* Get Started Section */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Get Started</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-blue-100 text-blue-500">
                <CreditCard size={24} />
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

          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-700">
                <Pocket size={24} />
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

          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-700">
                <Package size={24} />
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

          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-blue-100 text-blue-500">
                <Upload size={24} />
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
    </>
  );
}