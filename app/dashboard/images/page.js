'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from 'next-auth/react';
import { getSupabase } from "../../../supabaseClient";
import { usePersistence } from '../../services/persistenceService';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import SlideCanvas from '../slides/components/SlideCanvas';
import SlideControls from '../slides/components/SlideControls';
import ContentModal from '../slides/components/ContentModal';
import PromptModal from '../slides/components/PromptModal';
import { useSlideManagement } from '../slides/hooks/useSlideManagement';
import { useSlideNavigation } from '../slides/hooks/useSlideNavigation';
import { validateSlide } from '../../utils/validation';
import MonthlyCalendar from '../schedule/components/MonthlyCalendar';
import ModeToggle from '../components/ModeToggle';
import { useRouter, usePathname } from 'next/navigation';

const isDev = process.env.NODE_ENV === 'development';

export default function AvatarsEditor() {
  const { data: session, status } = useSession();
  const effectiveStatus = isDev ? 'authenticated' : status;
  const effectiveSession = useMemo(() => {
    return isDev
      ? { user: { name: 'Dev User', email: 'dev@local.com' } }
      : session;
  }, [session]);
  
  // State for image library
  const [libraryImages, setLibraryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentType, setContentType] = useState('stock');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [businessContext, setBusinessContext] = useState(null);
  const [businessContextFetched, setBusinessContextFetched] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null);
  const pathname = usePathname();
  const [mode, setMode] = useState('avatars');
  
  // Determine current mode based on route
  useEffect(() => {
    if (pathname.includes('/dashboard/videos')) {
      setMode('videos');
    } else if (pathname.includes('/dashboard/meme')) {
      setMode('memes');
    } else if (pathname.includes('/dashboard/images')) {
      setMode('avatars');
    } else if (pathname.includes('/dashboard/slides')) {
      setMode('slides');
    } else if (pathname.includes('/dashboard/hook-demo')) {
      setMode('hook-demo');
    }
  }, [pathname]);
  
  const [showModeModal, setShowModeModal] = useState(false);
  const router = useRouter();

  // Use persistence hook for avatars - INDEPENDENT from slides
  const defaultAvatars = [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '16:9' }];
  const { 
    data: avatars, 
    updateData: setAvatars, 
    resetData: resetAvatars,
    saveStatus, 
    isLoading: isLoadingAvatars 
  } = usePersistence('avatars', defaultAvatars);

  const { data: userImages } = usePersistence('userImages', []);

  // Active avatar state
  const [activeAvatarIndex, setActiveAvatarIndex] = useState(0);

  // Custom hooks for avatar management
  const {
    updateSlide: updateAvatar,
    addSlide: addAvatar,
    deleteSlide: deleteAvatar,
    changeRatio,
    handleSelectImageForSlide: handleSelectImageForAvatar
  } = useSlideManagement({
    slides: avatars,
    setSlides: setAvatars,
    activeSlideIndex: activeAvatarIndex,
    setActiveSlideIndex: setActiveAvatarIndex
  });

  // Navigation hook
  useSlideNavigation({
    activeSlideIndex: activeAvatarIndex,
    setActiveSlideIndex: setActiveAvatarIndex,
    slidesLength: avatars.length
  });

  // Fetch images from database
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const supabase = getSupabase();
        const { data, error } = await supabase.from('images').select('id, title, image_url');
        if (error) throw error;
        console.log('Fetched images from database:', data?.length || 0, 'images');
        if (data && data.length > 0) {
          console.log('Sample image:', data[0]);
        }
        setLibraryImages(data);
      } catch (error) { 
        console.error("Error fetching images:", error);
        setError('Failed to load image library. Please refresh the page.');
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchImages();
  }, []);

  // Fetch business context for AI generation - only once on mount
  useEffect(() => {
    if (businessContextFetched) return;
    
    const fetchBusinessContext = async () => {
      try {
        const context = await getCurrentUserBusinessContext();
        setBusinessContext(context);
      } catch (error) {
        console.error('Error fetching business context:', error);
      } finally {
        setBusinessContextFetched(true);
      }
    };
    fetchBusinessContext();
  }, [businessContextFetched]);

  // Handle mode navigation
  const handleModeChange = (newMode) => {
    setShowModeModal(false);
    setMode(newMode);
    
    const routeMap = {
      videos: '/dashboard/videos',
      memes: '/dashboard/meme',
      avatars: '/dashboard/images',
      slides: '/dashboard/slides',
      'hook-demo': '/dashboard/hook-demo'
    };
    
    const targetRoute = routeMap[newMode];
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  // Add a guard to prevent rendering with invalid avatar data
  if (isLoadingAvatars || !avatars || avatars.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Avatars Editor</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Loading your avatars...</p>
        </div>
      </div>
    );
  }

  const modeLabelMap = {
    videos: 'Videos',
    memes: 'Memes',
    avatars: 'Avatars',
    slides: 'Slides',
    'hook-demo': 'Demo',
  };
  const modeColorMap = {
    videos: '#6366F1', // Softer blue
    memes: '#D97706', // Softer orange
    avatars: '#9333EA', // Softer purple
    slides: '#059669', // Softer green
    'hook-demo': '#DC2626', // Softer red
  };

  return (
    <>
      {/* Settings button at top right */}
      <div style={{ position: 'fixed', top: 24, right: 160, zIndex: 1100 }}>
        <button
          onClick={() => setShowModeModal(true)}
          style={{
            background: modeColorMap[mode] || '#9333EA',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: `0 2px 8px 0 ${(modeColorMap[mode] || '#9333EA')}22, 0 0 0 1px ${(modeColorMap[mode] || '#9333EA')}11`,
            color: '#fff',
            fontWeight: 500,
            fontSize: 18,
            padding: '12px 32px',
            minWidth: 120,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            borderWidth: 0,
          }}
          aria-label="Switch content type"
        >
          {modeLabelMap[mode] || 'Avatars'}
        </button>
      </div>

      {/* ModeToggle Modal */}
      {showModeModal && (
        <ModeToggle
          currentMode={mode}
          onModeChange={handleModeChange}
          onClose={() => setShowModeModal(false)}
        />
      )}

      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Avatars Editor</h1>
          <SaveStatusIndicator saveStatus={saveStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <SlideCanvas
                slide={avatars[activeAvatarIndex]}
                onUpdate={(updatedSlide) => updateAvatar(activeAvatarIndex, updatedSlide)}
                onImageSelect={handleSelectImageForAvatar}
                libraryImages={libraryImages}
                userImages={userImages}
                contentType={contentType}
                setContentType={setContentType}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                onOpenContentModal={() => setIsContentModalOpen(true)}
                onOpenPromptModal={() => setIsPromptModalOpen(true)}
                businessContext={businessContext}
                isScheduleModalOpen={isScheduleModalOpen}
                setIsScheduleModalOpen={setIsScheduleModalOpen}
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
                mode="avatars"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <SlideControls
                slides={avatars}
                activeIndex={activeAvatarIndex}
                onSlideChange={setActiveAvatarIndex}
                onAddSlide={addAvatar}
                onDeleteSlide={deleteAvatar}
                onReset={resetAvatars}
                mode="avatars"
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <ContentModal
          isOpen={isContentModalOpen}
          onClose={() => setIsContentModalOpen(false)}
          onImageSelect={handleSelectImageForAvatar}
          libraryImages={libraryImages}
          userImages={userImages}
          contentType={contentType}
          setContentType={setContentType}
        />

        <PromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          onGenerateSlides={(generatedSlides) => {
            setAvatars(generatedSlides);
            setIsPromptModalOpen(false);
          }}
          businessContext={businessContext}
          mode="avatars"
        />
      </div>
    </>
  );
} 