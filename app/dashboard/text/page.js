'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from 'next-auth/react';
import { getSupabase } from "../../../supabaseClient";
import { usePersistence } from '../../services/persistenceService';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import SlideCanvas from '../slides/components/SlideCanvas';
import ContentModal from '../slides/components/ContentModal';
import PromptModal from '../slides/components/PromptModal';
import { useSlideManagement } from '../slides/hooks/useSlideManagement';
import { useSlideNavigation } from '../slides/hooks/useSlideNavigation';
import { validateSlide } from '../../utils/validation';
import MonthlyCalendar from '../schedule/components/MonthlyCalendar';
import ModeToggle from '../components/ModeToggle';
import { useRouter, usePathname } from 'next/navigation';

const isDev = process.env.NODE_ENV === 'development';

export default function TextEditor() {
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
  const [mode, setMode] = useState('text');
  
  // Determine current mode based on route
  useEffect(() => {
    if (pathname.includes('/dashboard/videos')) {
      setMode('videos');
    } else if (pathname.includes('/dashboard/text')) {
      setMode('text');
    } else if (pathname.includes('/dashboard/images')) {
      setMode('avatars');
    } else if (pathname.includes('/dashboard/slides')) {
      setMode('slides');
    }
  }, [pathname]);
  
  const [showModeModal, setShowModeModal] = useState(false);
  const router = useRouter();



  // Use persistence hook for texts - INDEPENDENT from slides
  const defaultTexts = [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '9:16' }];
  const { 
    data: texts, 
    updateData: setTexts, 
    resetData: resetTexts,
    saveStatus, 
    isLoading: isLoadingTexts 
  } = usePersistence('texts', defaultTexts);

  const { data: userImages } = usePersistence('userImages', []);

  // Active text state
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  // Custom hooks for text management
  const {
    updateSlide: updateText,
    addSlide: addText,
    deleteSlide: deleteText,
    changeRatio,
    handleSelectImageForSlide: handleSelectImageForText
  } = useSlideManagement({
    slides: texts,
    setSlides: setTexts,
    activeSlideIndex: activeTextIndex,
    setActiveSlideIndex: setActiveTextIndex
  });

  // Navigation hook
  useSlideNavigation({
    activeSlideIndex: activeTextIndex,
    setActiveSlideIndex: setActiveTextIndex,
    slidesLength: texts.length
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

  // Fetch business context for AI generation - only after authentication
  useEffect(() => {
    // Only fetch if user is authenticated and we haven't fetched yet
    if (effectiveStatus !== 'authenticated' || businessContextFetched) {
      return;
    }
    
    const fetchBusinessContext = async () => {
      try {
        const context = await getCurrentUserBusinessContext();
        setBusinessContext(context);
      } catch (error) {
        console.error('Error fetching business context:', error);
        // Set default context to prevent app from breaking
        setBusinessContext({
          companyName: 'Your Business',
          businessType: 'General',
          productInfo: 'Your products and services'
        });
      } finally {
        setBusinessContextFetched(true);
      }
    };
    
    // Add a small delay to ensure session is fully ready
    const timer = setTimeout(() => {
      fetchBusinessContext();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [effectiveStatus, businessContextFetched]); // Depend on effectiveStatus

  const handleFontSizeIncrease = (slideIndex) => {
    try {
      const currentSlide = texts[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map(text => {
        const currentStyle = text.style || {};
        const currentFontSize = parseInt(currentStyle.fontSize) || 16;
        const newFontSize = Math.min(currentFontSize + 2, 48); // Max 48px
        
        return {
          ...text,
          style: {
            ...currentStyle,
            fontSize: `${newFontSize}px`
          }
        };
      });

      updateText(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error increasing font size:', error);
      setError('Failed to increase font size. Please try again.');
    }
  };

  const handleFontSizeDecrease = (slideIndex) => {
    try {
      const currentSlide = texts[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map(text => {
        const currentStyle = text.style || {};
        const currentFontSize = parseInt(currentStyle.fontSize) || 16;
        const newFontSize = Math.max(currentFontSize - 2, 8); // Min 8px
        
        return {
          ...text,
          style: {
            ...currentStyle,
            fontSize: `${newFontSize}px`
          }
        };
      });

      updateText(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error decreasing font size:', error);
      setError('Failed to decrease font size. Please try again.');
    }
  };

  // Handle mode navigation
  const handleModeChange = (newMode) => {
    setShowModeModal(false);
    setMode(newMode);
    
    const routeMap = {
      videos: '/dashboard/videos',
      text: '/dashboard/text',
      avatars: '/dashboard/images',
      slides: '/dashboard/slides',
    };
    
    const targetRoute = routeMap[newMode];
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  // Add a guard to prevent rendering with invalid text data
  if (isLoadingTexts || !texts || texts.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Text Editor</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Loading your texts...</p>
        </div>
      </div>
    );
  }

  const modeLabelMap = {
    videos: 'Videos',
    text: 'Text',
    avatars: 'Avatars',
    slides: 'Slides',
  };
  const modeColorMap = {
    videos: '#6366F1', // Softer blue
    text: '#DC2626', // Softer red
    avatars: '#9333EA', // Softer purple
    slides: '#059669', // Softer green
  };

  return (
    <>
      {/* Settings button at top right */}
      {/* ModeToggle Modal */}
      {showModeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(10px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowModeModal(false)}
        >
          <div
            style={{ position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <ModeToggle value={mode} onChange={handleModeChange} />
          </div>
        </div>
      )}
      <SaveStatusIndicator saveStatus={saveStatus} />
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <ContentModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        onImageSelect={handleSelectImageForText}
        libraryImages={libraryImages}
        userImages={userImages}
        contentType={contentType}
        setContentType={setContentType}
      />
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
        }}
        onSubmit={(generatedTexts) => {
          setTexts(generatedTexts);
          setIsPromptModalOpen(false);
        }}
        businessContext={businessContext}
        existingSlides={texts}
        mode="texts"

      />
      <div style={{ 
        display: "flex", 
        height: "90vh", 
        padding: "0px 8px", 
        boxSizing: "border-box", 
        fontFamily: "'Inter', sans-serif" 
      }}>
        <div style={{ 
          flexBasis: "100%", 
          display: "flex", 
          flexDirection: "column",
          position: "relative"
        }}>
          <SlideCanvas
            slides={texts}
            activeSlideIndex={activeTextIndex}
            onSlideSelect={setActiveTextIndex}
            onSlideUpdate={(slideIndex, updatedSlide) => updateText(slideIndex, updatedSlide)}
            onAddSlide={addText}
            onDeleteSlide={deleteText}
            onRatioChange={(slideIndex) => changeRatio(slideIndex)}
            onContentModalOpen={() => setIsContentModalOpen(true)}
            onPromptModalOpen={() => setIsPromptModalOpen(true)}
            onFontSizeIncrease={handleFontSizeIncrease}
            onFontSizeDecrease={handleFontSizeDecrease}
            modeColor={modeColorMap[mode] || '#DC2626'}
          />
        </div>
      </div>
      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 relative">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Pick a day to schedule this content</h2>
            <MonthlyCalendar onDateSelected={(date) => {
              setScheduledDate(date);
              setIsScheduleModalOpen(false);
              // Save to localStorage for now
              localStorage.setItem('scheduledContent', JSON.stringify({ date, texts }));
              alert(`Content scheduled for ${date.toLocaleDateString()}`);
            }} />
          </div>
        </div>
      )}
    </>
  );
} 