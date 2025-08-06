'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from 'next-auth/react';
import { getSupabase } from "../../../supabaseClient";
import { usePersistence } from '../../services/persistenceService';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import SlideCanvas from '../slides/components/SlideCanvas';
import ColorBackgroundModal from '../slides/components/ColorBackgroundModal';
import PromptModal from '../slides/components/PromptModal';
import BottomSections from '../slides/components/BottomSections';
import { useSlideManagement } from '../slides/hooks/useSlideManagement';
import { useSlideNavigation } from '../slides/hooks/useSlideNavigation';
import { validateSlide } from '../../utils/validation';
import MonthlyCalendar from '../schedule/components/MonthlyCalendar';
import ModeToggle from '../components/ModeToggle.jsx';
import { useRouter, usePathname } from 'next/navigation';

const isDev = process.env.NODE_ENV === 'development';

export default function MemeEditor() {
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
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [businessContext, setBusinessContext] = useState(null);
  const [businessContextFetched, setBusinessContextFetched] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null);
  const pathname = usePathname();
  const [mode, setMode] = useState('meme');
  
  // Determine current mode based on route
  useEffect(() => {
    if (pathname.includes('/dashboard/videos')) {
      setMode('videos');
    } else if (pathname.includes('/dashboard/meme')) {
      setMode('meme');
    } else if (pathname.includes('/dashboard/images')) {
      setMode('avatars');
    } else if (pathname.includes('/dashboard/slides')) {
      setMode('slides');
    }
  }, [pathname]);
  
  const [showModeModal, setShowModeModal] = useState(false);
  const router = useRouter();



  // Use persistence hook for memes - INDEPENDENT from slides
  const defaultMemes = [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '9:16' }];
  const { 
    data: memes, 
    updateData: setMemes, 
    resetData: resetMemes,
    saveStatus, 
    isLoading: isLoadingMemes 
  } = usePersistence('memes', defaultMemes);

  const { data: userImages } = usePersistence('userImages', []);

  // Active meme state
  const [activeMemeIndex, setActiveMemeIndex] = useState(0);

  // Custom hooks for meme management
  const {
    updateSlide: updateMeme,
    addSlide: addMeme,
    deleteSlide: deleteMeme,
    changeRatio,
    handleSelectImageForSlide: handleSelectImageForMeme
  } = useSlideManagement({
    slides: memes,
    setSlides: setMemes,
    activeSlideIndex: activeMemeIndex,
    setActiveSlideIndex: setActiveMemeIndex
  });

  // Navigation hook
  useSlideNavigation({
    activeSlideIndex: activeMemeIndex,
    setActiveSlideIndex: setActiveMemeIndex,
    slidesLength: memes.length
  });

  // Fetch images from database
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const supabase = getSupabase();
        const { data, error } = await supabase.from('images').select('id, title, image_url, category');
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
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map(text => {
        const currentStyle = text.style || {};
        const currentFontSize = parseInt(currentStyle.fontSize) || 14;
        const newFontSize = Math.min(currentFontSize + 2, 48); // Max 48px
        
        return {
          ...text,
          style: {
            ...currentStyle,
            fontSize: `${newFontSize}px`
          }
        };
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error increasing font size:', error);
      setError('Failed to increase font size. Please try again.');
    }
  };

  const handleFontSizeDecrease = (slideIndex) => {
    try {
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map(text => {
        const currentStyle = text.style || {};
        const currentFontSize = parseInt(currentStyle.fontSize) || 14;
        const newFontSize = Math.max(currentFontSize - 2, 6); // Min 6px
        
        return {
          ...text,
          style: {
            ...currentStyle,
            fontSize: `${newFontSize}px`
          }
        };
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error decreasing font size:', error);
      setError('Failed to decrease font size. Please try again.');
    }
  };

  const handleFontChange = (slideIndex, textIndex, fontFamily) => {
    try {
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map((text, index) => {
        if (index === textIndex) {
          return {
            ...text,
            style: {
              ...text.style,
              fontFamily: fontFamily
            }
          };
        }
        return text;
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error changing font:', error);
      setError('Failed to change font. Please try again.');
    }
  };

  const handleColorChange = (slideIndex, textIndex, color) => {
    try {
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map((text, index) => {
        if (index === textIndex) {
          return {
            ...text,
            style: {
              ...text.style,
              color: color
            }
          };
        }
        return text;
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error changing color:', error);
      setError('Failed to change color. Please try again.');
    }
  };

  const handleBoldToggle = (slideIndex, textIndex) => {
    try {
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map((text, index) => {
        if (index === textIndex) {
          return {
            ...text,
            style: {
              ...text.style,
              fontWeight: text.style?.fontWeight === 'bold' ? 'normal' : 'bold'
            }
          };
        }
        return text;
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error toggling bold:', error);
      setError('Failed to toggle bold. Please try again.');
    }
  };

  const handleItalicToggle = (slideIndex, textIndex) => {
    try {
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map((text, index) => {
        if (index === textIndex) {
          return {
            ...text,
            style: {
              ...text.style,
              fontStyle: text.style?.fontStyle === 'italic' ? 'normal' : 'italic'
            }
          };
        }
        return text;
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error toggling italic:', error);
      setError('Failed to toggle italic. Please try again.');
    }
  };

  const handleCaptionToggle = (slideIndex, textIndex) => {
    try {
      const currentSlide = memes[slideIndex];
      if (!currentSlide || !currentSlide.texts || currentSlide.texts.length === 0) {
        return;
      }

      const updatedTexts = currentSlide.texts.map((text, index) => {
        if (index === textIndex) {
          return {
            ...text,
            style: {
              ...text.style,
              caption: !text.style?.caption
            }
          };
        }
        return text;
      });

      updateMeme(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error toggling caption:', error);
      setError('Failed to toggle caption. Please try again.');
    }
  };

  // Handle mode navigation
  const handleModeChange = (newMode) => {
    setShowModeModal(false);
    setMode(newMode);
    
    const routeMap = {
      videos: '/dashboard/videos',
      meme: '/dashboard/meme',
      avatars: '/dashboard/images',
      slides: '/dashboard/slides',
    };
    
    const targetRoute = routeMap[newMode];
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  const handleSlideReorder = (sourceIndex, targetIndex) => {
    const newMemes = [...memes];
    const [movedMeme] = newMemes.splice(sourceIndex, 1);
    newMemes.splice(targetIndex, 0, movedMeme);
    setMemes(newMemes);
  };

  const handleMusicSelect = (music) => {
    console.log('Selected music:', music);
    // Store selected music in meme data
    const updatedMemes = memes.map((meme, index) => {
      if (index === activeMemeIndex) {
        return {
          ...meme,
          selectedMusic: music
        };
      }
      return meme;
    });
    setMemes(updatedMemes);
  };

  const handleUpload = () => {
    console.log('Upload button clicked');
    // TODO: Implement upload functionality
  };

  // Add a guard to prevent rendering with invalid meme data
  if (isLoadingMemes || !memes || memes.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Meme Editor</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Loading your memes...</p>
        </div>
      </div>
    );
  }

  const modeLabelMap = {
    videos: 'Videos',
    meme: 'Meme',
    avatars: 'Avatars',
    slides: 'Slides',
  };
  const modeColorMap = {
    videos: '#6366F1', // Softer blue
    meme: '#DC2626', // Softer red
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
      <ColorBackgroundModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        onColorSelect={handleSelectImageForMeme}
      />
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
        }}
        onSubmit={(generatedMemes) => {
          setMemes(generatedMemes);
          setIsPromptModalOpen(false);
        }}
        businessContext={businessContext}
        existingSlides={memes}
        mode="meme"
        libraryImages={libraryImages}
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
          {/* Creative Mode Button - Positioned at the top of the canvas area */}
          <div className="flex justify-center mb-4" style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <button
              onClick={() => setShowModeModal(true)}
              style={{
                background: `${modeColorMap[mode] || '#DC2626'}20`,
                border: `1px solid ${modeColorMap[mode] || '#DC2626'}40`,
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                color: modeColorMap[mode] || '#DC2626',
                minWidth: 80,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                outline: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                padding: '0 12px',
                letterSpacing: '0.02em',
              }}
              aria-label="Switch content type"
            >
              {modeLabelMap[mode] || 'Meme'}
            </button>
          </div>
          <SlideCanvas
            slides={memes}
            activeSlideIndex={activeMemeIndex}
            onSlideSelect={setActiveMemeIndex}
            onSlideUpdate={(slideIndex, updatedSlide) => updateMeme(slideIndex, updatedSlide)}
            onAddSlide={addMeme}
            onDeleteSlide={deleteMeme}
            onRatioChange={(slideIndex) => changeRatio(slideIndex)}
            onContentModalOpen={() => setIsColorModalOpen(true)}
            onPromptModalOpen={() => setIsPromptModalOpen(true)}
            onFontSizeIncrease={handleFontSizeIncrease}
            onFontSizeDecrease={handleFontSizeDecrease}
            onFontChange={handleFontChange}
            onColorChange={handleColorChange}
            onBoldToggle={handleBoldToggle}
            onItalicToggle={handleItalicToggle}
            onCaptionToggle={handleCaptionToggle}
            onMusicSelect={handleMusicSelect}
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
              localStorage.setItem('scheduledContent', JSON.stringify({ date, memes }));
              alert(`Content scheduled for ${date.toLocaleDateString()}`);
            }} />
          </div>
        </div>
      )}

      {/* Bottom Sections */}
      <BottomSections
        slides={memes}
        activeSlideIndex={activeMemeIndex}
        onSlideSelect={setActiveMemeIndex}
        onSlideReorder={handleSlideReorder}
      />

    </>
  );
} 