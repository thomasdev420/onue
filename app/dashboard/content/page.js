'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Camera, 
  Sparkles, 
  ImagePlus, 
  Book, 
  PartyPopper, 
  Wand2,
  ArrowRight,
  Video,
  Image as ImageIcon,
  User
} from 'lucide-react';

export default function NewContentPage() {
  const contentOptions = [
    {
      title: 'UGC Videos',
      description: 'Create and edit user-generated content videos',
      icon: <Camera size={24} />,
      href: '/dashboard/videos',
    },
    {
      title: 'Create Memes',
      description: 'Design and customize memes with templates',
      icon: <PartyPopper size={24} />,
      href: '/dashboard/meme',
    },
    {
      title: 'Avatar Generator',
      description: 'Generate custom avatars and profile pictures',
      icon: <User size={24} />,
      href: '/dashboard/images',
    },
    {
      title: 'Slides',
      description: 'Create presentation slides and decks',
      icon: <Book size={24} />,
      href: '/dashboard/slides',
    },
    {
      title: 'Hook & Demo',
      description: 'Create engaging hooks and demonstrations',
      icon: <Sparkles size={24} />,
      href: '/dashboard/hook-demo',
    },
    {
      title: 'Magic Mode',
      description: 'AI-powered content creation and editing',
      icon: <Wand2 size={24} />,
      href: '/dashboard/magic',
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Generator</h1>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentOptions.map((option, index) => (
          <Link key={index} href={option.href}>
            <div className={"group relative p-4 rounded-xl border-2 border-gray-200 box-border transition-all duration-200 cursor-pointer bg-white h-[160px] flex flex-col justify-between transform transition-transform duration-200 hover:scale-105 hover:shadow-xl hover:border-gray-700 min-w-[0]"}>
              <div className="flex items-start justify-between mb-4">
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'linear-gradient(90deg, #3953e6 0%, #36aeea 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px 0 rgba(57,83,230,0.12)',
                  position: 'relative',
                  marginBottom: 0,
                }}>
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '56%',
                    borderRadius: 16,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                    filter: 'blur(0.5px)',
                  }} />
                  {React.cloneElement(option.icon, { color: 'white', style: { zIndex: 2 } })}
                </div>
                <ArrowRight 
                  size={20} 
                  className={"text-[#3953e6] opacity-0 group-hover:opacity-100 transition-opacity duration-200"} 
                />
              </div>
              <h3 className={"text-base font-bold mb-1 text-[#3953e6] break-words"}>
                {option.title}
              </h3>
              <p className="text-gray-600 text-sm leading-snug break-words">
                {option.description}
              </p>
              <div className="absolute inset-0 rounded-xl border-2 border-transparent opacity-0 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 