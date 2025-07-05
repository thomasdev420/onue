'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from 'next-auth/react';
import { supabase } from "../../../supabaseClient";
import { usePersistence } from '../../services/persistenceService';
import { getCurrentUserBusinessContext } from '../../services/businessContextService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import SlideCanvas from './components/SlideCanvas';
import ContentModal from './components/ContentModal';
import PromptModal from './components/PromptModal';
import { useSlideManagement } from './hooks/useSlideManagement';
import { useSlideNavigation } from './hooks/useSlideNavigation';
import { validateFile, validateSlide } from '../../utils/validation';
import { X, Upload, Download } from 'lucide-react';
import Image from 'next/image';
import MemeComposer from './components/MemeComposer';

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
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [businessContext, setBusinessContext] = useState(null);
  const [businessContextFetched, setBusinessContextFetched] = useState(false);

  // Use persistence hook for slides - LFG always has exactly one slide
  const defaultSlides = [{ id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '16:9' }];
  const { 
    data: slides, 
    updateData: setSlides, 
    resetData: resetSlides,
    saveStatus, 
    isLoading: isLoadingSlides 
  } = usePersistence('lfg', defaultSlides);

  const { data: userImages, updateData: setUserImages } = usePersistence('userImages', []);

  // Background images from meme page
  const backgroundImages = useMemo(() => [
    { id: 1, src: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?cs=srgb&dl=pexels-asadphoto-457882.jpg&fm=jpg", alt: "Beach Sunset" },
    { id: 2, src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", alt: "Snowy Mountains" },
    { id: 3, src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", alt: "Dense Forest" },
    { id: 4, src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80", alt: "Desert Dunes" },
    { id: 5, src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80", alt: "Night City Lights" },
    { id: 6, src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80", alt: "Tropical Island" },
    { id: 7, src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80", alt: "Autumn Park" },
    { id: 8, src: "https://eatsleepworkrepeat.com/wp-content/uploads/2020/06/office.jpg", alt: "Modern Office" },
    { id: 9, src: "https://www.nelincs.gov.uk/assets/uploads/2024/01/Weelsby-woods-area-page-1024x683.jpg", alt: "Green Park" },
  ], []);

  // GIF thumbnails from meme page
  const gifThumbnails = useMemo(() => [
    { id: 1, src: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHg3MTQyNThqdm1sbXYxMHEzd2t6MnY2NGszZjVwMnJtbnU0aGVhdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/v1uV0oxObr9ZT48Kpa/giphy.gif", alt: "Chipi Chipi Cat" },
    { id: 2, src: "https://lh6.googleusercontent.com/proxy/5GBEY_L_Wv2AZR95S1FPNJhKJPDgcbKahA1s1yaPl_SXBZAYeRr618__M5bJzqRo6w", alt: "Tenor" },
    { id: 3, src: "https://cdn.cdnstep.com/fVskBJxBMpEvZhUnfoXE/cover-6.thumb256.png", alt: "Meme 4" },
    { id: 4, src: "https://media.tenor.com/L4ncxhqryfQAAAAi/cat.gif", alt: "Cat Meme" },
    { id: 5, src: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGc2dmZ3NTA1YW40aml4aDJlN20xNDR1MGUyOHUwdzQ3OWtlMGo1ayZlcD12MV9pbnRlcm5uYWxfnaWZfYnlfaWQmY3Q9cw/1r1srgmIN9icL74lBR/giphy.gif", alt: "Funny Cat" },
  ], []);

  // GIF modal state
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [gifStartIndex, setGifStartIndex] = useState(0);
  const gifFileInputRef = useRef(null);

  // Active slide state - LFG always has index 0
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Custom hooks for slide management
  const {
    updateSlide,
    addSlide: originalAddSlide,
    deleteSlide: originalDeleteSlide,
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

  // Ensure LFG always has exactly one slide
  useEffect(() => {
    if (slides && slides.length !== 1) {
      // If there are no slides or multiple slides, reset to exactly one slide
      const singleSlide = slides && slides.length > 0 ? slides[0] : { id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, image: null, texts: [], ratio: '16:9' };
      setSlides([singleSlide]);
      setActiveSlideIndex(0);
    }
  }, [slides, setSlides]);

  // Fetch images from database
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase.from('images').select('id, title, image_url');
        if (error) throw error;
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
        // Set a default business context if fetch fails
        setBusinessContext({
          companyName: 'Your Business',
          businessType: 'General',
          productInfo: 'Your products and services'
        });
      } finally {
        setBusinessContextFetched(true);
      }
    };
    fetchBusinessContext();
  }, [businessContextFetched]); // Only depend on the fetch flag

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

  // Override addSlide and deleteSlide to do nothing for LFG
  const addSlide = () => {
    // LFG only allows one slide - do nothing
    console.log('LFG only supports one slide');
  };

  const deleteSlide = () => {
    // LFG only allows one slide - do nothing
    console.log('LFG only supports one slide');
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
      // For LFG, we only use the first slide
      if (generatedSlides && generatedSlides.length > 0) {
        const firstSlide = generatedSlides[0];
        updateSlide(0, firstSlide);
        console.log('AI-generated slide applied to LFG');
      }
    } catch (error) {
      console.error('Error applying AI-generated slide:', error);
      setError('Failed to apply generated slide. Please try again.');
    }
  };

  const handleImageSelect = (image) => {
    try {
      // For LFG, treat all images as backgrounds
      const backgroundImage = {
        id: image.id,
        title: image.title || image.alt || "Background",
        image_url: image.image_url || image.src || image.url
      };
      handleSelectImageForSlide(backgroundImage);
      setIsContentModalOpen(false);
    } catch (error) {
      console.error('Error selecting image:', error);
      setError('Failed to select image. Please try again.');
    }
  };

  // GIF modal handlers
  const handleGifModalOpen = () => {
    setIsGifModalOpen(true);
  };

  const handleGifModalClose = () => {
    setIsGifModalOpen(false);
  };

  const handleGifSelect = (gif) => {
    try {
      const gifOverlay = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        src: gif.src,
        alt: gif.alt,
        position: { x: 100, y: 100 }, // Default position
        size: 150 // Default size in pixels
      };
      
      // Add GIF as overlay to the current slide
      const currentSlide = slides[activeSlideIndex];
      const newGifOverlays = [...(currentSlide.gifOverlays || []), gifOverlay];
      handleSlideUpdate(activeSlideIndex, { gifOverlays: newGifOverlays });
      setIsGifModalOpen(false);
    } catch (error) {
      console.error('Error adding GIF:', error);
      setError('Failed to add GIF. Please try again.');
    }
  };

  const handleGifUpload = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate GIF file
      const validation = validateFile(file, 'gif');
      if (!validation.success) {
        setError(validation.error);
        return;
      }

      const gifUrl = URL.createObjectURL(file);
      const gifOverlay = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        src: gifUrl,
        alt: file.name,
        position: { x: 100, y: 100 },
        size: 150,
        file: file
      };
      
      const currentSlide = slides[activeSlideIndex];
      const newGifOverlays = [...(currentSlide.gifOverlays || []), gifOverlay];
      handleSlideUpdate(activeSlideIndex, { gifOverlays: newGifOverlays });
    } catch (error) {
      console.error('Error uploading GIF:', error);
      setError('Failed to upload GIF. Please try again.');
    }
  };

  const handleUserImageUpload = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate image file
      const validation = validateFile(file, 'image');
      if (!validation.success) {
        setError(validation.error);
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      const newImage = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        src: imageUrl,
        alt: file.name,
        file: file
      };
      
      setUserImages(prev => [...prev, newImage]);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleDownloadMeme = async () => {
    try {
      // For now, show a message that download is not implemented
      setError('Download feature is not yet implemented. Please use screenshot tools.');
    } catch (error) {
      console.error('Error downloading meme:', error);
      setError('Failed to download meme. Please try again.');
    }
  };

  // In the GIF modal, display both GIFs and meme videos as selectable overlays
  const memeVideos = [
    {
      id: 'video-just-do-it',
      src: '/memes/just-do-it.webm',
      alt: 'JUST DO IT (Shia LaBeouf)',
      type: 'video',
    },
    { id: 'video-1', src: 'https://www.w3schools.com/html/mov_bbb.webm', alt: 'Meme Video 1', type: 'video' },
    { id: 'video-2', src: 'https://www.w3schools.com/html/movie.webm', alt: 'Meme Video 2', type: 'video' },
    // Add more transparent meme videos here
  ];

  // Add a guard to prevent rendering with invalid slide data
  if (isLoadingSlides || !slides || slides.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Meme Editor</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Loading your meme...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 100 }}>
        <button
          onClick={handleDownloadMeme}
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Download Meme"
        >
          <Download size={22} color="#374151" />
        </button>
      </div>
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
        contentType="stock"
        setContentType={() => {}}
        isDropdownOpen={false}
        setIsDropdownOpen={() => {}}
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

      {/* GIF Modal */}
      {isGifModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={handleGifModalClose}
        >
          <div
            style={{
              backgroundColor: '#FFF',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              width: '80%',
              maxWidth: '1000px',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleGifModalClose}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
              }}
            >
              <X size={24} color="#555" />
            </button>
            
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
              <div>
                <div className="flex-1 flex flex-col min-h-0">
                  {/* GIF Library Header */}
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Select GIF</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {gifThumbnails.map((gif) => (
                        <div 
                          key={gif.id} 
                          className="cursor-pointer relative aspect-square" 
                          onClick={() => handleGifSelect(gif)}
                        >
                          <Image
                            src={gif.src}
                            alt={gif.alt}
                            fill
                            sizes="200px"
                            className="rounded-lg object-cover"
                          />
                        </div>
                      ))}
                      {memeVideos.map((video) => (
                        <div
                          key={video.id}
                          className="cursor-pointer relative aspect-square flex flex-col items-center justify-center bg-black rounded-lg border-2 border-gray-200 hover:border-blue-400 transition"
                          onClick={() => handleGifSelect({ id: video.id, src: video.src, alt: video.alt, type: 'video' })}
                        >
                          <video
                            src={video.src}
                            className="w-full h-full object-contain rounded"
                            style={{ background: 'transparent', maxHeight: '80px' }}
                            controls
                          />
                          <div className="text-xs text-center mt-1 text-white w-full bg-black bg-opacity-60 rounded-b">{video.alt}</div>
                        </div>
                      ))}
                      <button
                        onClick={() => gifFileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-orange-600 transition"
                      >
                        <Upload className="w-8 h-8" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <input type="file" ref={gifFileInputRef} onChange={handleGifUpload} accept="image/gif" className="hidden" />
          </div>
        </div>
      )}

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
            onAddSlide={addSlide}
            onDeleteSlide={deleteSlide}
            onRatioChange={handleRatioChange}
            onContentModalOpen={handleContentModalOpen}
            onGifModalOpen={handleGifModalOpen}
            onPromptModalOpen={handlePromptModalOpen}
          />
        </div>
      </div>
    </>
  );
} 