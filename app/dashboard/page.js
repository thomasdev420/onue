'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, Video, Calendar, Megaphone, Image as ImageIcon, Book, User, HelpCircle, Settings, ArrowLeft, Sparkles, ImagePlus, Lightbulb, Camera, CreditCard, Pocket, Package, Upload, Pencil } from 'lucide-react';
import ChatBar from "./components/ChatBar";
import UserOnboardingModal from "../components/UserOnboardingModal";
import { useState } from "react";

//Dashboard page

export default function Dashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'developer';
  const [showOnboarding, setShowOnboarding] = useState(false);

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
              icon: <Camera size={18} className="text-gray-500" />,
              href: '/dashboard/videos',
            },
            {
              label: 'Create Greenscreen Meme videos',
              icon: <Sparkles size={18} className="text-gray-500" />,
              href: '/dashboard/memes',
            },
            {
              label: 'UGC Avatar Generator',
              icon: <ImagePlus size={18} className="text-gray-500" />,
              href: '/dashboard/avatars',
            },
            {
              label: 'Slides',
              icon: <Book size={18} className="text-gray-500" />,
              href: '/dashboard/slides',
            },
          ]}
        />
      </div>
      {/* Personalize Button below ChatBar */}
      <div className="w-full flex justify-center gap-3 -mt-4">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium shadow-sm"
          onClick={() => setShowOnboarding(true)}
        >
          <User size={18} className="text-gray-500" />
          Personalize
        </button>
        <Link href="/dashboard/schedule" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium shadow-sm">
          <Calendar size={18} className="text-gray-500" />
          Schedule
        </Link>
        <Link href="/dashboard/ghostwrite" className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium shadow-sm">
          <Pencil size={18} className="text-gray-500" />
          Ghost write
          <span className="text-orange-500 text-xs">New</span>
        </Link>
      </div>
      <UserOnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} onComplete={() => setShowOnboarding(false)} />
    </>
  );
}