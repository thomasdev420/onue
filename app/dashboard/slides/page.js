'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from 'next-auth/react';
import { getSupabase } from "../../../supabaseClient";
import { usePersistence } from '../../services/persistenceService';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import SlideCanvas from './components/SlideCanvas';
import ContentModal from './components/ContentModal';
import PromptModal from './components/PromptModal';
import { useSlideManagement } from './hooks/useSlideManagement';
import { useSlideNavigation } from './hooks/useSlideNavigation';
import { validateSlide } from '../../utils/validation';
import MonthlyCalendar from '../schedule/components/MonthlyCalendar';
import ModeToggle from '../components/ModeToggle';
import { useRouter, usePathname } from 'next/navigation';

const isDev = process.env.NODE_ENV === 'development';

export default function SlidesEditor() {
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
  const [mode, setMode] = useState('slides');
  
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

  // Use persistence hook for slides
  const defaultSlides = [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '16:9' }];
  const { 
    data: slides, 
    updateData: setSlides, 
    resetData: resetSlides,
    saveStatus, 
    isLoading: isLoadingSlides 
  } = usePersistence('slides', defaultSlides);

  const { data: userImages } = usePersistence('userImages', []);

  // Active slide state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Custom hooks for slide management
  const {
    updateSlide,
    addSlide,
    deleteSlide,
    changeRatio,
    handleSelectImageForSlide
  } = useSlideManagement({
    slides,
    setSlides,
    activeSlideIndex,
    setActiveSlideIndex
  });

  // Navigation hook
  useSlideNavigation({
    activeSlideIndex,
    setActiveSlideIndex,
    slidesLength: slides.length
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
  }, [businessContextFetched]); // Only depend on the fetch flag

  // Check for AI-generated slides from localStorage
  useEffect(() => {
    const aiGeneratedSlides = localStorage.getItem('aiGeneratedSlides');
    if (aiGeneratedSlides && !isLoading && libraryImages.length > 0) {
      try {
        const parsedSlides = JSON.parse(aiGeneratedSlides);
        console.log('Found AI-generated slides in localStorage:', parsedSlides);
        
        if (parsedSlides && Array.isArray(parsedSlides) && parsedSlides.length > 0) {
          // Process the slides with images and positioning (same as handlePromptSubmit)
          const processSlides = async () => {
            try {
              console.log('Processing AI-generated slides from localStorage...');
              console.log('Available library images:', libraryImages.length);
              
              // Apply smart text positioning to each slide
              const { applySmartPositioning } = await import('../../utils/textPositioning');
              const positionedSlides = parsedSlides.map(slide => applySmartPositioning(slide));
              
              // Auto-select images based on imageCategory
              const slidesWithImages = positionedSlides.map((slide, index) => {
                // Always try to assign an image, even if no category or no library images
                let selectedImage = null;
                
                if (libraryImages.length > 0) {
                  if (slide.imageCategory) {
                    // Find images that match the category (simple keyword matching)
                    const categoryKeywords = {
                      'business': ['business', 'office', 'corporate', 'professional'],
                      'technology': ['tech', 'computer', 'digital', 'innovation'],
                      'success': ['success', 'achievement', 'winning', 'trophy'],
                      'motivation': ['motivation', 'inspiration', 'positive', 'energy'],
                      'growth': ['growth', 'progress', 'development', 'improvement'],
                      'creativity': ['creative', 'art', 'design', 'imagination'],
                      'social_media': ['social', 'media', 'connection', 'network'],
                      'entrepreneurship': ['entrepreneur', 'startup', 'business', 'leadership'],
                      'marketing': ['marketing', 'advertising', 'promotion', 'brand'],
                      'lifestyle': ['lifestyle', 'life', 'daily', 'personal']
                    };
                    
                    const keywords = categoryKeywords[slide.imageCategory] || ['business'];
                    const matchingImages = libraryImages.filter(img => 
                      keywords.some(keyword => 
                        img.title.toLowerCase().includes(keyword.toLowerCase())
                      )
                    );
                    
                    console.log(`Slide ${index + 1} - Category: ${slide.imageCategory}, Keywords: ${keywords.join(', ')}, Matching images: ${matchingImages.length}`);
                    
                    // Select a random matching image, or fallback to any image
                    selectedImage = matchingImages.length > 0 
                      ? matchingImages[Math.floor(Math.random() * matchingImages.length)]
                      : libraryImages[Math.floor(Math.random() * libraryImages.length)];
                  } else {
                    // No category specified, select a random image
                    selectedImage = libraryImages[Math.floor(Math.random() * libraryImages.length)];
                  }
                  
                  console.log(`Selected image for slide ${index + 1}:`, selectedImage?.title);
                } else {
                  console.log(`No library images available for slide ${index + 1}`);
                }
                
                return {
                  ...slide,
                  image: selectedImage
                };
              });
              
              // Replace current slides with processed ones
              setSlides(slidesWithImages);
              setActiveSlideIndex(0);
              
              console.log('Applied AI-generated slides successfully with images and positioning');
            } catch (error) {
              console.error('Error processing AI-generated slides:', error);
              // Fallback to unprocessed slides
              setSlides(parsedSlides);
              setActiveSlideIndex(0);
            }
          };
          
          processSlides();
          
          // Clear localStorage
          localStorage.removeItem('aiGeneratedSlides');
        }
      } catch (error) {
        console.error('Error parsing AI-generated slides from localStorage:', error);
        localStorage.removeItem('aiGeneratedSlides');
      }
    }
  }, [setSlides, libraryImages, isLoading]);

  // Validate slides data
  useEffect(() => {
    if (slides && slides.length > 0) {
      const validationErrors = [];
      slides.forEach((slide, index) => {
        const validation = validateSlide(slide);
        if (!validation.success) {
          validationErrors.push(`Slide ${index + 1}: ${validation.error}`);
        }
      });
      
      if (validationErrors.length > 0) {
        console.error('Slide validation errors:', validationErrors);
        setError(`Data validation errors: ${validationErrors.join(', ')}`);
      } else {
        setError(null);
      }
    }
  }, [slides]);

  // Event handlers
  const handleSlideSelect = (index) => {
    setActiveSlideIndex(index);
  };

  const handleSlideUpdate = (slideIndex, newProps) => {
    try {
      // Validate the updated slide
      const updatedSlide = { ...slides[slideIndex], ...newProps };
      const validation = validateSlide(updatedSlide);
      
      if (!validation.success) {
        console.error('Slide validation failed:', validation.error);
        return;
      }
      
      updateSlide(slideIndex, newProps);
    } catch (error) {
      console.error('Error updating slide:', error);
      setError('Failed to update slide. Please try again.');
    }
  };

  const handleAddSlide = () => {
    try {
      addSlide();
    } catch (error) {
      console.error('Error adding slide:', error);
      setError('Failed to add slide. Please try again.');
    }
  };

  const handleDeleteSlide = (slideIndex) => {
    try {
      deleteSlide(slideIndex);
    } catch (error) {
      console.error('Error deleting slide:', error);
      setError('Failed to delete slide. Please try again.');
    }
  };

  const handleRatioChange = (slideIndex) => {
    try {
      changeRatio(slideIndex);
    } catch (error) {
      console.error('Error changing ratio:', error);
      setError('Failed to change slide ratio. Please try again.');
    }
  };

  const handleContentModalOpen = () => {
    setIsContentModalOpen(true);
  };

  const handleContentModalClose = () => {
    setIsContentModalOpen(false);
  };

  const handlePromptModalOpen = () => {
    setIsPromptModalOpen(true);
  };

  const handlePromptModalClose = () => {
    setIsPromptModalOpen(false);
  };

  const handlePromptSubmit = (generatedSlides, prompt) => {
    try {
      console.log('handlePromptSubmit called with:', {
        generatedSlides,
        prompt,
        slidesLength: generatedSlides?.length
      });

      // Validate generated slides
      if (!generatedSlides || !Array.isArray(generatedSlides)) {
        console.error('Invalid generated slides data:', generatedSlides);
        setError('Invalid slide data received. Please try again.');
        return;
      }

      if (generatedSlides.length === 0) {
        console.error('No generated slides received');
        setError('No slides were generated. Please try again.');
        return;
      }

      console.log('Applying generated slides...');
      
      // Apply smart text positioning to each slide
      const { applySmartPositioning } = require('../../utils/textPositioning');
      const positionedSlides = generatedSlides.map(slide => applySmartPositioning(slide));
      
      // Auto-select images based on imageCategory
      const slidesWithImages = positionedSlides.map((slide, index) => {
        if (slide.imageCategory && libraryImages.length > 0) {
          // Find images that match the category (simple keyword matching)
          const categoryKeywords = {
            'business': ['business', 'office', 'corporate', 'professional'],
            'technology': ['tech', 'computer', 'digital', 'innovation'],
            'success': ['success', 'achievement', 'winning', 'trophy'],
            'motivation': ['motivation', 'inspiration', 'positive', 'energy'],
            'growth': ['growth', 'progress', 'development', 'improvement'],
            'creativity': ['creative', 'art', 'design', 'imagination'],
            'social_media': ['social', 'media', 'connection', 'network'],
            'entrepreneurship': ['entrepreneur', 'startup', 'business', 'leadership'],
            'marketing': ['marketing', 'advertising', 'promotion', 'brand'],
            'lifestyle': ['lifestyle', 'life', 'daily', 'personal']
          };
          
          const keywords = categoryKeywords[slide.imageCategory] || ['business'];
          const matchingImages = libraryImages.filter(img => 
            keywords.some(keyword => 
              img.title.toLowerCase().includes(keyword.toLowerCase())
            )
          );
          
          // Select a random matching image, or fallback to any image
          const selectedImage = matchingImages.length > 0 
            ? matchingImages[Math.floor(Math.random() * matchingImages.length)]
            : libraryImages[Math.floor(Math.random() * libraryImages.length)];
          
          return {
            ...slide,
            image: selectedImage
          };
        }
        return slide;
      });
      
      // Replace all slides with the positioned ones
      setSlides(slidesWithImages);
      
      // Set active slide to first generated slide
      setActiveSlideIndex(0);
      
      console.log('AI-generated slides applied successfully:', positionedSlides.length, 'slides');
      console.log('Generated slides structure:', positionedSlides);
      
      // Close the modal
      setIsPromptModalOpen(false);
      
    } catch (error) {
      console.error('Error applying AI-generated slides:', error);
      setError('Failed to apply generated slides. Please try again.');
    }
  };

  const handleImageSelect = (image) => {
    try {
      console.log('Image selected:', image);
      handleSelectImageForSlide(image);
      console.log('Image selection completed, closing modal');
      setIsContentModalOpen(false);
    } catch (error) {
      console.error('Error selecting image:', error);
      setError('Failed to select image. Please try again.');
    }
  };

  // Handler for scheduling
  const handleScheduleClick = () => {
    setIsScheduleModalOpen(true);
  };

  const handleDateSelected = (date) => {
    setScheduledDate(date);
    setIsScheduleModalOpen(false);
    // Save to localStorage for now
    localStorage.setItem('scheduledContent', JSON.stringify({ date, slides }));
    alert(`Content scheduled for ${date.toLocaleDateString()}`);
  };

  // Handler for closing the mode modal and navigating if needed
  const handleModeModalClose = () => {
    setShowModeModal(false);
    const modeToRoute = {
      videos: '/dashboard/videos',
      memes: '/dashboard/meme',
      avatars: '/dashboard/images',
      slides: '/dashboard/slides',
      'hook-demo': '/dashboard/hook-demo',
    };
    const targetRoute = modeToRoute[mode];
    if (targetRoute && pathname !== targetRoute) {
      router.push(targetRoute);
    }
  };

  // Add a guard to prevent rendering with invalid slide data
  if (isLoadingSlides || !slides || slides.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Slides Editor</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Loading your slides...</p>
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
            background: modeColorMap[mode] || '#059669',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: `0 2px 8px 0 ${(modeColorMap[mode] || '#059669')}22, 0 0 0 1px ${(modeColorMap[mode] || '#059669')}11`,
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
          {modeLabelMap[mode] || 'Slides'}
        </button>
      </div>
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
          onClick={handleModeModalClose}
        >
          {/* Only show the ModeToggle, no white box, no close button */}
          <div
            style={{ position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <ModeToggle value={mode} onChange={setMode} />
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
        onClose={handleContentModalClose}
        contentType={contentType}
        setContentType={setContentType}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        libraryImages={libraryImages}
        userImages={userImages}
        onImageSelect={handleImageSelect}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={handlePromptModalClose}
        onSubmit={handlePromptSubmit}
        businessContext={businessContext}
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
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSlideSelect={handleSlideSelect}
            onSlideUpdate={handleSlideUpdate}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onRatioChange={handleRatioChange}
            onContentModalOpen={handleContentModalOpen}
            onPromptModalOpen={handlePromptModalOpen}
            onScheduleClick={handleScheduleClick}
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
            <MonthlyCalendar onDateSelected={handleDateSelected} />
          </div>
        </div>
      )}
    </>
  );
} 