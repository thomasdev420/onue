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

import DownloadModal from './components/DownloadModal';
import { useSlideManagement } from './hooks/useSlideManagement';
import { useSlideNavigation } from './hooks/useSlideNavigation';
import { validateSlide } from '../../utils/validation';
import MonthlyCalendar from '../schedule/components/MonthlyCalendar';
import ModeToggle from '../components/ModeToggle';
import { useRouter, usePathname } from 'next/navigation';
import { downloadSlide, downloadAllSlides } from '../../utils/slideDownload';

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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadSlideIndex, setDownloadSlideIndex] = useState(0);
  const pathname = usePathname();
  const [mode, setMode] = useState('slides');
  
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

  // Use persistence hook for slides
  const defaultSlides = [{
    id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    image: null,
    texts: [{
      id: `text-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      content: "Click to add your content",
      position: { x: 50, y: 50 },
      style: {
        fontSize: '18px',
        color: 'white',
        fontWeight: 'normal',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }
    }],
    ratio: '9:16',
    imageCategory: 'business'
  }];
  
  const { 
    data: slidesData, 
    updateData: setSlides, 
    resetData: resetSlides,
    saveStatus, 
    isLoading: isLoadingSlides 
  } = usePersistence('slides', defaultSlides);
  
  // Ensure slides is always an array and patch missing ratio
  const slides = (Array.isArray(slidesData) && slidesData.length > 0 ? slidesData : defaultSlides).map(slide => ({
    ...slide,
    ratio: ['16:9', '4:3', '1:1', '9:16'].includes(slide.ratio) ? slide.ratio : '9:16'
  }));

  const { data: userImagesData } = usePersistence('userImages', []);
  const userImages = Array.isArray(userImagesData) ? userImagesData : [];

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
    setActiveSlideIndex,
    onError: setError
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
        const { data, error } = await supabase.from('images').select('id, title, image_url, category');
        if (error) {
          console.warn('Failed to fetch images from database:', error);
          // Use empty array as fallback
          setLibraryImages([]);
          return;
        }
        console.log('Fetched images from database:', data?.length || 0, 'images');
        if (data && data.length > 0) {
          console.log('Sample image:', data[0]);
        }
        setLibraryImages(data || []);
      } catch (error) { 
        console.error("Error fetching images:", error);
        setError('Failed to load image library. Please refresh the page.');
        // Ensure libraryImages is always an array
        setLibraryImages([]);
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
  }, [effectiveStatus, businessContextFetched, isPromptModalOpen]); // Depend on effectiveStatus and isPromptModalOpen

  // Check for AI-generated slides from localStorage
  useEffect(() => {
    const aiGeneratedSlides = localStorage.getItem('aiGeneratedSlides');
    console.log('Checking for AI-generated slides in localStorage:', aiGeneratedSlides);
    
    // Process slides even if library images aren't loaded yet - we'll add images later
    if (aiGeneratedSlides && !isLoading) {
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
              let positionedSlides;
              try {
                const { applySmartPositioning } = await import('../../utils/textPositioning');
                positionedSlides = parsedSlides.map(slide => applySmartPositioning(slide));
              } catch (error) {
                console.error('Error importing textPositioning:', error);
                // Fallback to unprocessed slides
                positionedSlides = parsedSlides;
              }
              
              // Ensure all text elements have proper styling
              positionedSlides = positionedSlides.map(slide => ({
                ...slide,
                texts: slide.texts.map(text => ({
                  ...text,
                  content: text.content, // Keep original formatting from AI
                  style: {
                    fontSize: '16px',
                    color: 'white',
                    fontWeight: 'normal',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    maxWidth: '90%'
                  }
                }))
              }));
              
              // Replace current slides with processed ones (images will be added later)
              setSlides(positionedSlides);
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
  }, [setSlides, isLoading]);

  // Add images to slides that don't have them once library images are loaded
  useEffect(() => {
    if (slides && slides.length > 0 && libraryImages && libraryImages.length > 0) {
      const slidesWithoutImages = slides.filter(slide => !slide.image);
      
      if (slidesWithoutImages.length > 0) {
        console.log(`Adding images to ${slidesWithoutImages.length} slides that don't have images`);
        
        const updatedSlides = slides.map(slide => {
          if (!slide.image) {
            // Find a suitable image based on category
            let selectedImage = null;
            
            if (slide.imageCategory) {
              const categoryKeywords = {
                'business': ['business', 'office', 'corporate', 'professional', 'executive'],
                'technology': ['tech', 'computer', 'digital', 'innovation', 'ai', 'data'],
                'success': ['success', 'achievement', 'winning', 'trophy', 'accomplishment'],
                'motivation': ['motivation', 'inspiration', 'positive', 'energy', 'drive'],
                'growth': ['growth', 'progress', 'development', 'improvement', 'evolution'],
                'creativity': ['creative', 'art', 'design', 'imagination', 'aesthetic'],
                'social_media': ['social', 'media', 'connection', 'network', 'community'],
                'entrepreneurship': ['entrepreneur', 'startup', 'business', 'leadership', 'founder'],
                'marketing': ['marketing', 'advertising', 'promotion', 'brand', 'strategy'],
                'lifestyle': ['lifestyle', 'life', 'daily', 'personal', 'wellness'],
                'luxury': ['luxury', 'premium', 'exclusive', 'high-end', 'sophisticated', 'elegant'],
                'nature': ['nature', 'outdoor', 'landscape', 'environmental', 'sustainable', 'green'],
                'health': ['health', 'wellness', 'fitness', 'medical', 'healthcare', 'healthy'],
                'education': ['education', 'learning', 'academic', 'school', 'university', 'knowledge'],
                'finance': ['finance', 'money', 'investment', 'banking', 'financial', 'wealth'],
                'travel': ['travel', 'adventure', 'exploration', 'journey', 'destination', 'tourism'],
                'food': ['food', 'dining', 'restaurant', 'culinary', 'gastronomy', 'cuisine'],
                'fashion': ['fashion', 'style', 'clothing', 'apparel', 'trendy', 'designer'],
                'sports': ['sports', 'athletic', 'fitness', 'competition', 'training', 'athlete'],
                'family': ['family', 'relationships', 'love', 'connection', 'togetherness'],
                'abstract': ['abstract', 'conceptual', 'minimal', 'geometric', 'modern', 'contemporary'],
                'industrial': ['industrial', 'manufacturing', 'factory', 'production', 'machinery'],
                'urban': ['urban', 'city', 'metropolitan', 'architecture', 'skyline', 'downtown'],
                'rural': ['rural', 'countryside', 'farm', 'agriculture', 'pastoral', 'village'],
                'science': ['science', 'research', 'laboratory', 'experiment', 'discovery', 'scientific']
              };
              
              const keywords = categoryKeywords[slide.imageCategory] || ['business'];
              const matchingImages = libraryImages.filter(img => 
                img && img.title && keywords.some(keyword => 
                  img.title.toLowerCase().includes(keyword.toLowerCase())
                )
              );
              
              if (matchingImages.length > 0) {
                selectedImage = matchingImages[Math.floor(Math.random() * matchingImages.length)];
              }
            }
            
            // If no category match, pick a random image
            if (!selectedImage && libraryImages.length > 0) {
              selectedImage = libraryImages[Math.floor(Math.random() * libraryImages.length)];
            }
            
            // If still no image, create a placeholder image object
            if (!selectedImage) {
              // Use some default technology/business images
              const defaultImages = [
                {
                  id: `default-tech-${slide.id || Date.now()}`,
                  title: 'Technology Background',
                  image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop'
                },
                {
                  id: `default-business-${slide.id || Date.now()}`,
                  title: 'Business Background',
                  image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop'
                },
                {
                  id: `default-abstract-${slide.id || Date.now()}`,
                  title: 'Abstract Background',
                  image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=600&fit=crop'
                }
              ];
              
              selectedImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
              console.log(`Using default image for slide:`, selectedImage.title);
            }
            
            return {
              ...slide,
              image: selectedImage
            };
          }
          return slide;
        });
        
        setSlides(updatedSlides);
      }
    }
  }, [slides, libraryImages, libraryImages.length, setSlides]);

  // Validate slides data and ensure text styles are properly initialized
  useEffect(() => {
    if (slides && slides.length > 0) {
      const validationErrors = [];
      let needsUpdate = false;
      const updatedSlides = slides.map((slide, slideIndex) => {
        const validation = validateSlide(slide);
        if (!validation.success) {
          validationErrors.push(`Slide ${slideIndex + 1}: ${validation.error}`);
        }
        
        // Ensure all text items have proper style structure
        if (slide.texts && slide.texts.length > 0) {
          const updatedTexts = slide.texts.map(text => {
            if (!text.style) {
              needsUpdate = true;
              return {
                ...text,
                style: {
                  fontSize: '16px',
                  color: 'white',
                  fontWeight: 'normal'
                }
              };
            }
            return text;
          });
          
          if (needsUpdate) {
            return { ...slide, texts: updatedTexts };
          }
        }
        
        return slide;
      });
      
      if (validationErrors.length > 0) {
        console.error('Slide validation errors:', validationErrors);
        setError(`Data validation errors: ${validationErrors.join(', ')}`);
      } else {
        setError(null);
      }
      
      // Update slides if text styles needed initialization
      if (needsUpdate) {
        console.log('Initializing text styles for existing slides');
        setSlides(updatedSlides);
      }
    }
  }, [slides, setSlides]);

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
        slidesLength: generatedSlides?.length,
        existingSlidesCount: slides.length
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

      console.log('Applying generated slides from unified content engine...');
      
      // Slides are already complete with text and images from unified engine
      const slidesWithImages = generatedSlides;
      
      // Analyze user intent to determine whether to add or replace slides
      const lowerPrompt = prompt.toLowerCase();
      const addKeywords = ['add', 'another', 'more', 'additional', 'extra', 'one more', 'two more', 'three more', 'four more', 'five more'];
      const replaceKeywords = ['replace', 'new', 'completely new', 'start over', 'fresh', 'different', 'change', 'redo', 'remake'];
      
      const isAddRequest = addKeywords.some(keyword => lowerPrompt.includes(keyword));
      const isReplaceRequest = replaceKeywords.some(keyword => lowerPrompt.includes(keyword));
      
      let finalSlides;
      let newActiveIndex;
      
      if (isAddRequest && !isReplaceRequest) {
        // Add slides to existing ones
        finalSlides = [...slides, ...slidesWithImages];
        newActiveIndex = slides.length; // Set active to first new slide
        console.log(`Adding ${slidesWithImages.length} new slides to existing ${slides.length} slides`);
      } else {
        // Replace all slides (default behavior for new requests, replace requests, or unclear intent)
        finalSlides = slidesWithImages;
        newActiveIndex = 0;
        console.log(`Replacing all slides with ${slidesWithImages.length} new slides`);
      }
      
      // Update slides
      setSlides(finalSlides);
      setActiveSlideIndex(newActiveIndex);
      
      console.log('AI-generated slides applied successfully:', finalSlides.length, 'total slides');
      console.log('Generated slides structure:', finalSlides);
      
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

  const handleFontSizeIncrease = (slideIndex, textIndex) => {
    try {
      console.log('handleFontSizeIncrease called for slideIndex:', slideIndex, 'textIndex:', textIndex);
      const currentSlide = slides[slideIndex];
      if (!currentSlide || !currentSlide.texts || !currentSlide.texts[textIndex]) {
        console.log('Text not found');
        return;
      }

      const updatedTexts = [...currentSlide.texts];
      const text = updatedTexts[textIndex];
      const currentStyle = text.style || {};
      const currentFontSize = parseInt(currentStyle.fontSize) || 16;
      const newFontSize = Math.min(currentFontSize + 2, 48); // Max 48px
      
      console.log('Text:', text.content, 'Current fontSize:', currentFontSize, 'New fontSize:', newFontSize);
      
      updatedTexts[textIndex] = {
        ...text,
        style: {
          ...currentStyle,
          fontSize: `${newFontSize}px`
        }
      };

      console.log('Updated texts:', updatedTexts);
      updateSlide(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error increasing font size:', error);
      setError('Failed to increase font size. Please try again.');
    }
  };

  const handleFontSizeDecrease = (slideIndex, textIndex) => {
    try {
      const currentSlide = slides[slideIndex];
      if (!currentSlide || !currentSlide.texts || !currentSlide.texts[textIndex]) {
        return;
      }

      const updatedTexts = [...currentSlide.texts];
      const text = updatedTexts[textIndex];
      const currentStyle = text.style || {};
      const currentFontSize = parseInt(currentStyle.fontSize) || 16;
      const newFontSize = Math.max(currentFontSize - 2, 8); // Min 8px
      
      updatedTexts[textIndex] = {
        ...text,
        style: {
          ...currentStyle,
          fontSize: `${newFontSize}px`
        }
      };

      updateSlide(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error decreasing font size:', error);
      setError('Failed to decrease font size. Please try again.');
    }
  };

  const handleDeleteText = (slideIndex, textIndex) => {
    try {
      const currentSlide = slides[slideIndex];
      if (!currentSlide || !currentSlide.texts || !currentSlide.texts[textIndex]) {
        return;
      }

      const updatedTexts = currentSlide.texts.filter((_, index) => index !== textIndex);
      updateSlide(slideIndex, { texts: updatedTexts });
    } catch (error) {
      console.error('Error deleting text:', error);
      setError('Failed to delete text. Please try again.');
    }
  };

  const handleDownloadSlide = async (slideIndex, format = 'png', quality = 0.95) => {
    try {
      const slide = slides[slideIndex];
      if (!slide) {
        setError('Slide not found. Please try again.');
        return;
      }

      if (!slide.image) {
        setError('Please select an image for this slide before downloading.');
        return;
      }

      console.log('Downloading slide:', slideIndex);

      // Find the actual slide element in the DOM
      const slideElements = document.querySelectorAll('.slide-item');
      let targetSlideElement = null;
      let slideCount = 0;
      
      for (let i = 0; i < slideElements.length; i++) {
        const element = slideElements[i];
        // Skip the "add slide" button
        if (element.querySelector('button') && element.querySelector('button').textContent === '+') {
          continue;
        }
        if (slideCount === slideIndex) {
          targetSlideElement = element;
          break;
        }
        slideCount++;
      }
      
      if (!targetSlideElement) {
        setError('Slide element not found. Please try again.');
        return;
      }

      // Download the slide exactly as it appears
      const slideTitle = `slide-${slideIndex + 1}`;
      const result = await downloadSlide(targetSlideElement, slideTitle, format, quality);
      
      if (result.success) {
        console.log('Download successful:', result.filename);
      }
      
      // Show success message
      setError(null);
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg';
      successMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-sm font-medium">Slide ${slideIndex + 1} downloaded successfully!</span>
          <button onclick="this.parentElement.parentElement.remove()" class="text-green-500 hover:text-green-700 ml-2">×</button>
        </div>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
    } catch (error) {
      console.error('Error downloading slide:', error);
      setError('Download failed. Please ensure the slide has an image and try again.');
    }
  };

  const handleOpenDownloadModal = (slideIndex) => {
    setDownloadSlideIndex(slideIndex);
    setIsDownloadModalOpen(true);
  };

  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const handleDownloadAllSlides = async (format = 'png', quality = 0.95) => {
    try {
      if (!slides || slides.length === 0) {
        setError('No slides to download.');
        return;
      }

      // Find all slide elements in the DOM
      const slideElements = document.querySelectorAll('.slide-item');
      const validSlideElements = [];
      let slideCount = 0;
      
      // Filter out the "add slide" button and get only actual slides with images
      for (let i = 0; i < slideElements.length; i++) {
        const slideElement = slideElements[i];
        
        // Skip the "add slide" button
        if (slideElement.querySelector('button') && slideElement.querySelector('button').textContent === '+') {
          continue;
        }
        
        if (slideCount < slides.length) {
          const slide = slides[slideCount];
          if (slide && slide.image && slideElement.offsetWidth > 0 && slideElement.offsetHeight > 0) {
            validSlideElements.push(slideElement);
          }
          slideCount++;
        }
      }

      if (validSlideElements.length === 0) {
        setError('No slides with images found to download.');
        return;
      }

      console.log('Downloading all slides:', validSlideElements.length);

      const projectName = 'my-slides';
      const result = await downloadAllSlides(validSlideElements, projectName);
      
      if (result.success) {
        console.log('All slides downloaded successfully');
      }
      
      // Show success message
      setError(null);
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg';
      successMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-sm font-medium">All slides downloaded successfully!</span>
          <button onclick="this.parentElement.parentElement.remove()" class="text-green-700 hover:text-green-900 ml-2">×</button>
        </div>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
    } catch (error) {
      console.error('Error downloading slides:', error);
      setError('Download failed. Please ensure all slides have images and try again.');
    }
  };

  const handleDateSelected = (date) => {
    setScheduledDate(date);
    setIsScheduleModalOpen(false);
    // Save to localStorage for now
    localStorage.setItem('scheduledContent', JSON.stringify({ date, slides }));
    alert(`Content scheduled for ${date.toLocaleDateString()}`);
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

  // Handler for closing the mode modal and navigating if needed
  const handleModeModalClose = () => {
    setShowModeModal(false);
    const modeToRoute = {
      videos: '/dashboard/videos',
      text: '/dashboard/text',
      avatars: '/dashboard/images',
      slides: '/dashboard/slides',
    };
    const targetRoute = modeToRoute[mode];
    if (targetRoute && pathname !== targetRoute) {
      router.push(targetRoute);
    }
  };

  // Add a guard to prevent rendering while loading
  if (isLoadingSlides) {
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
          onClick={handleModeModalClose}
        >
          {/* Only show the ModeToggle, no white box, no close button */}
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
        existingSlides={slides}
        mode="slides"
      />

              <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={handleCloseDownloadModal}
          onDownloadSingle={handleDownloadSlide}
          onDownloadAll={handleDownloadAllSlides}
          slideIndex={downloadSlideIndex}
          totalSlides={slides.length}
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
          {/* Colored dot centered above the slide */}
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
            onFontSizeIncrease={handleFontSizeIncrease}
            onFontSizeDecrease={handleFontSizeDecrease}
            onDeleteText={handleDeleteText}
            onOpenDownloadModal={handleOpenDownloadModal}
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