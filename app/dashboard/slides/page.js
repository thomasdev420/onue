'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { supabase } from "../../../supabaseClient";
import { Input } from './../../components/ui/Input';
import { Button } from './../../components/ui/Button';
import { Trash2, ChevronDown, PanelLeft, X, Image as ImageIcon, Expand, Minimize, ArrowRight, MessageSquare } from 'lucide-react';
import { usePersistence } from '../../services/persistenceService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';

export default function SlidesEditor() {
  const [libraryImages, setLibraryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentType, setContentType] = useState('stock'); // New state for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state for dropdown open/close
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  // Use persistence hook for slides
  const defaultSlides = [{ id: Date.now(), image: null, texts: [], ratio: '16:9' }];
  const { 
    data: slides, 
    updateData: setSlides, 
    resetData: resetSlides,
    saveStatus, 
    isLoading: isLoadingSlides 
  } = usePersistence('slides', defaultSlides);

  const { data: userImages } = usePersistence('userImages', []);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [draggingInfo, setDraggingInfo] = useState({ 
    isDragging: false, 
    textIndex: -1, 
    initialMousePos: null, 
    initialTextPos: null,
    elementWidth: 0,
    elementHeight: 0 
  });
  const canvasRef = useRef(null);
  
  const textRefs = useRef([]);
  const imageRefs = useRef([]);
  const slideItemRefs = useRef([]);
  const imageContainerRefs = useRef([]);

  const activeSlide = slides[activeSlideIndex];

  // Inline editing state
  const [inlineEditing, setInlineEditing] = useState({ isEditing: false, textIndex: -1, slideIndex: -1 });
  const [inlineEditText, setInlineEditText] = useState('');
  const inlineEditRef = useRef(null);

  // Expand/collapse state for slide section
  const [isSlideSectionExpanded, setIsSlideSectionExpanded] = useState(false);
  
  // New state for prompt modal visibility
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('images').select('id, title, image_url');
        if (error) throw error;
        setLibraryImages(data);
      } catch (error) { console.error("Error fetching images:", error); } 
      finally { setIsLoading(false); }
    };
    fetchImages();
  }, []);

  const goToPrevSlide = useCallback(() => setActiveSlideIndex(p => (p === 0 ? 0 : p - 1)), []);
  const goToNextSlide = useCallback(() => setActiveSlideIndex(p => (p < slides.length ? p + 1 : p)), [slides.length]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevSlide();
      else if (e.key === 'ArrowRight') goToNextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevSlide, goToNextSlide]);

  const updateSlide = useCallback((slideIndex, newProps) => {
    setSlides(currentSlides =>
      currentSlides.map((slide, i) => (i === slideIndex ? { ...slide, ...newProps } : slide))
    );
  }, [setSlides]);

  const addSlide = () => {
    const newSlide = { id: Date.now(), image: null, texts: [], ratio: '16:9' };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const deleteSlide = (slideIndex) => {
    if (slides.length <= 1) {
      alert("Cannot delete the last slide. At least one slide is required.");
      return;
    }
    
    const newSlides = slides.filter((_, index) => index !== slideIndex);
    setSlides(newSlides);
    
    // Adjust active slide index if necessary
    if (slideIndex <= activeSlideIndex && activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (slideIndex < activeSlideIndex) {
      // Keep the same active slide index
    } else {
      // If we deleted the last slide and it was active, go to the new last slide
      setActiveSlideIndex(Math.min(activeSlideIndex, newSlides.length - 1));
    }
  };

  const changeRatio = (slideIndex) => {
    const currentRatio = slides[slideIndex].ratio;
    const ratios = ['16:9', '4:3', '1:1', '9:16'];
    const currentIndex = ratios.indexOf(currentRatio);
    const nextIndex = (currentIndex + 1) % ratios.length;
    updateSlide(slideIndex, { ratio: ratios[nextIndex] });
  };

  const handleSelectImageForSlide = (image) => {
    // Normalize the image object to have an image_url property
    const imageToUse = { ...image, image_url: image.image_url || image.url };
    updateSlide(activeSlideIndex, { image: imageToUse, ratio: '9:16' });
    setIsContentModalOpen(false);
  };
  
  const addText = () => {
    if (!activeSlide.image) {
      alert("Please select an image before adding text.");
      return;
    }

    const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
    
    if (imageContainerEl) {
        const imageContainerRect = imageContainerEl.getBoundingClientRect();
        const centerX = imageContainerRect.width / 2;
        const centerY = imageContainerRect.height / 2;

        const newText = {
          id: Date.now(),
          content: 'New Text',
          position: { x: centerX, y: centerY }
        };
        const newTexts = [...activeSlide.texts, newText];
        updateSlide(activeSlideIndex, { texts: newTexts });
    }
  };
  
  const handleMouseDown = (e, textIndex) => {
    if (textRefs.current[textIndex]) {
      // Prevent default drag behavior
      e.preventDefault();
      e.stopPropagation();

      const textPosition = slides[activeSlideIndex].texts[textIndex].position;
      const rect = textRefs.current[textIndex].getBoundingClientRect();
      
      setDraggingInfo({
        isDragging: true,
        textIndex,
        // Store initial mouse position and text position
        initialMousePos: { x: e.clientX, y: e.clientY },
        initialTextPos: { x: textPosition.x, y: textPosition.y },
        elementWidth: rect.width,
        elementHeight: rect.height,
      });
    }
  };

  // Inline editing functions - moved before handleMouseUp
  const startInlineEditing = useCallback((slideIndex, textIndex) => {
    if (slideIndex === -1 || textIndex === -1 || !slides[slideIndex]?.texts[textIndex]) return;
    
    setInlineEditing({ isEditing: true, textIndex, slideIndex });
    setInlineEditText(slides[slideIndex].texts[textIndex].content);
    
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (inlineEditRef.current) {
        inlineEditRef.current.focus();
        inlineEditRef.current.select();
      }
    }, 10);
  }, [slides]);

  const handleMouseUp = useCallback((e) => {
    if (draggingInfo.isDragging) {
      const { initialMousePos, textIndex } = draggingInfo;
      if (initialMousePos) {
        const finalX = e.clientX;
        const finalY = e.clientY;
        const distance = Math.sqrt(Math.pow(finalX - initialMousePos.x, 2) + Math.pow(finalY - initialMousePos.y, 2));
        
        if (distance < 5) { // Threshold for click vs drag
          startInlineEditing(activeSlideIndex, textIndex);
        }
      }
    }
    setDraggingInfo({ isDragging: false, textIndex: -1, initialMousePos: null, initialTextPos: null, elementWidth: 0, elementHeight: 0 });
  }, [draggingInfo, activeSlideIndex, startInlineEditing]);

  const handleMouseMove = useCallback((e) => {
    if (!draggingInfo.isDragging || draggingInfo.textIndex === -1) return;

    e.preventDefault();
    e.stopPropagation();

    const { textIndex, initialMousePos, initialTextPos, elementWidth, elementHeight } = draggingInfo;
    const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
    
    if(!imageContainerEl) return;

    const imageContainerRect = imageContainerEl.getBoundingClientRect();
    
    // Calculate the distance the mouse has moved
    const dx = e.clientX - initialMousePos.x;
    const dy = e.clientY - initialMousePos.y;

    // Calculate new position based on initial position and mouse delta
    let newX = initialTextPos.x + dx;
    let newY = initialTextPos.y + dy;
    
    if (elementWidth > 0 && elementHeight > 0) {
      // Account for the centered positioning - the position represents the center
      const halfWidth = elementWidth / 2;
      const halfHeight = elementHeight / 2;
      
      // Magnetic snapping to vertical center
      const centerX = imageContainerRect.width / 2;
      const snapThreshold = 10; // pixels from center to trigger snap
      
      if (Math.abs(newX - centerX) < snapThreshold) {
        newX = centerX; // Snap to center
      }
      
      // Clamp position within the container bounds
      newX = Math.max(halfWidth, Math.min(newX, imageContainerRect.width - halfWidth));
      newY = Math.max(halfHeight, Math.min(newY, imageContainerRect.height - halfHeight));
    }
    
    const newTexts = activeSlide.texts.map((text, i) => 
      i === textIndex ? { ...text, position: { x: newX, y: newY } } : text
    );
    updateSlide(activeSlideIndex, { texts: newTexts });
  }, [activeSlide.texts, activeSlideIndex, draggingInfo, updateSlide]);
  
  useEffect(() => {
    // We bind to the window to catch mouse movements everywhere on the page
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const saveInlineEdit = useCallback(() => {
    if (inlineEditing.isEditing && inlineEditing.textIndex !== -1 && inlineEditing.slideIndex !== -1) {
      const trimmedText = inlineEditText.trim();
      
      if (!trimmedText) {
        // If text is empty, delete it
        const newTexts = slides[inlineEditing.slideIndex].texts.filter((_, i) => i !== inlineEditing.textIndex);
        updateSlide(inlineEditing.slideIndex, { texts: newTexts });
      } else {
        // Otherwise, update it
        const newTexts = slides[inlineEditing.slideIndex].texts.map((text, i) => 
          i === inlineEditing.textIndex ? { ...text, content: trimmedText } : text
        );
        updateSlide(inlineEditing.slideIndex, { texts: newTexts });
      }
      
      setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
      setInlineEditText('');
    }
  }, [inlineEditing, inlineEditText, slides, updateSlide]);
  
  const handleInlineEditChange = (e) => {
    setInlineEditText(e.target.value);
  };
  
  // New: Handle keydown for inline editing (Enter to save, Escape to cancel)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default newline behavior
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
      setInlineEditText('');
    }
  };

  const renderContent = () => {
    let imagesToShow = [];
    if (contentType === 'stock') {
      imagesToShow = libraryImages;
    } else if (contentType === 'user') {
      imagesToShow = userImages;
    }

    return (
      <div className="grid grid-cols-4 gap-2 p-2">
        {imagesToShow.map((image) => (
          <div key={image.id} className="cursor-pointer relative aspect-square" onClick={() => handleSelectImageForSlide(image)}>
            <Image
              src={image.image_url || image.url}
              alt={image.title || 'User image'}
              fill
              sizes="200px"
              className="rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  const slideWidth = 35;

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

  return (
    <>
      <SaveStatusIndicator saveStatus={saveStatus} />

      {isContentModalOpen && (
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
          onClick={() => setIsContentModalOpen(false)}
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
              onClick={() => setIsContentModalOpen(false)}
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
                  {/* Content Library Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 inline-flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                        {contentType === 'stock' ? 'Stock Photos' : 'Your Photos'}
                        <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-100">
                          <ul className="p-1">
                            {contentType !== 'stock' && (
                              <li>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); setContentType('stock'); setIsDropdownOpen(false); }}
                                  className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#ff4514]/10 hover:text-[#ff4514]"
                                >
                                  Stock Photos
                                </a>
                              </li>
                            )}
                            {contentType !== 'user' && (
                              <li>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); setContentType('user'); setIsDropdownOpen(false); }}
                                  className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#ff4514]/10 hover:text-[#ff4514]"
                                >
                                  Your Photos
                                </a>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {renderContent()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {isPromptModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsPromptModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFF',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '90%',
              maxWidth: '500px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPromptModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: '#9CA3AF',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
                e.currentTarget.style.color = '#6B7280';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9CA3AF';
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px', paddingRight: '40px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                textAlign: 'center',
                margin: 0,
                fontFamily: "'Inter', sans-serif"
              }}>
                AI Prompt
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center',
                margin: '8px 0 0 0',
                fontFamily: "'Inter', sans-serif"
              }}>
                Describe what you want to create and let AI help you
              </p>
            </div>

            {/* Input Field */}
            <div style={{ marginBottom: '24px' }}>
              <textarea
                placeholder="e.g., Create a motivational slide about entrepreneurship with a modern design..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontFamily: "'Inter', sans-serif",
                  resize: 'none',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    // TODO: Add prompt functionality later
                    console.log('Prompt submitted:', e.target.value);
                    setIsPromptModalOpen(false);
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  backgroundColor: '#FFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Inter', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Add prompt functionality later
                  const textarea = document.querySelector('textarea[placeholder*="Create a motivational"]');
                  if (textarea) {
                    console.log('Prompt submitted:', textarea.value);
                  }
                  setIsPromptModalOpen(false);
                }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#3B82F6',
                  color: '#FFF',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Inter', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3B82F6';
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", height: "90vh", padding: "0px 8px", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}>
      {/* Right Panel */}
        <div style={{ 
          flexBasis: isSlideSectionExpanded ? "100%" : "100%", 
          display: "flex", 
          flexDirection: "column",
          position: "relative"
        }}>
          <div ref={canvasRef} className="editor-canvas" style={{ 
            flexGrow: 1, 
            display: "flex", 
            alignItems: 'center', 
            position: 'relative', 
            overflow: 'hidden',
            height: '100%' // Full height since we're using a modal now
          }}>
            <div className="slides-track" style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              transform: `translateX(calc(50% - ${slideWidth / 2}% - (${activeSlideIndex} * ${slideWidth}%)))`,
              transition: 'transform 0.5s ease-in-out'
            }}>
              {slides.map((slide, index) => (
                <div 
                  key={slide.id} 
                  ref={el => slideItemRefs.current[index] = el}
                  onClick={() => setActiveSlideIndex(index)} 
                  className="slide-item" style={{
                    width: `${slideWidth}%`,
                    height: '100%',
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                    transform: `scale(${index === activeSlideIndex ? 1 : 0.8})`,
                    opacity: index === activeSlideIndex ? 1 : 0.6
                  }}>
                  {slide.image ? (
                    <div
                      ref={el => imageContainerRefs.current[index] = el}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: slide.ratio.replace(':', ' / '),
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                      <Image
                        ref={el => imageRefs.current[index] = el}
                        fill
                        src={slide.image.image_url}
                        alt={slide.image.title}
                        style={{ objectFit: 'cover' }}
                      />
                      {slide.texts.map((textItem, textIndex) => {
                        const isInlineEditing = inlineEditing.isEditing && 
                          inlineEditing.slideIndex === index && 
                          inlineEditing.textIndex === textIndex;
                        
                        const isBeingDragged = draggingInfo.isDragging && draggingInfo.textIndex === textIndex;

                        return (
                        <div
                          key={textItem.id}
                          ref={el => textRefs.current[textIndex] = el}
                          onMouseDown={(e) => index === activeSlideIndex && !isInlineEditing && handleMouseDown(e, textIndex)}
                          style={{
                            position: 'absolute',
                            left: `${textItem.position.x}px`,
                            top: `${textItem.position.y}px`,
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            cursor: index === activeSlideIndex ? 'move' : 'default',
                            userSelect: 'none',
                            width: isBeingDragged ? `${draggingInfo.elementWidth}px` : 'auto',
                            minWidth: '50px', // A reasonable minimum width
                            maxWidth: isInlineEditing ? '400px' : '300px', // Max width before wrapping
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center', // Center the text within the div
                            overflowWrap: 'break-word', // Allow wrapping for long text
                          }}
                          >
                            {isInlineEditing ? (
                              <textarea
                                ref={inlineEditRef}
                                value={inlineEditText}
                                onChange={handleInlineEditChange}
                                onBlur={saveInlineEdit}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  outline: 'none',
                                  color: 'white',
                                  fontSize: 'inherit',
                                  fontFamily: 'inherit',
                                  fontWeight: 'inherit',
                                  textAlign: 'center',
                                  width: '100%',
                                  padding: '0',
                                  margin: '0',
                                  lineHeight: 'inherit',
                                  resize: 'none',
                                  overflow: 'hidden', // Hide scrollbar, handled by auto-height
                                }}
                                onKeyDown={handleKeyDown}
                                onInput={(e) => {
                                  // Auto-resize the textarea to fit content
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                              />
                            ) : (
                              <span>
                                {textItem.content}
                              </span>
                            )}
                        </div>
                        );
                      })}
                      
                      {/* Center Guides - Vertical line with magnetic snapping */}
                      {draggingInfo.isDragging && draggingInfo.textIndex !== -1 && index === activeSlideIndex && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '0',
                            width: '1px',
                            height: '100%',
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                            zIndex: 1000,
                          }}
                        />
                      )}
                    </div>
                  ) : ( 
                    <div 
                      onClick={() => setIsContentModalOpen(true)}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.backgroundColor = '#F9FAFB'; // A slightly lighter gray
                        e.currentTarget.style.borderColor = '#9CA3AF'; // A medium gray
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.backgroundColor = '#F7F7F7';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      style={{
                        color: "#6B7280", // Darker text for better contrast
                        fontWeight: "500",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        backgroundColor: '#F7F7F7',
                        border: '2px dashed #D1D5DB', // Thicker, dashed border
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Select an image
                    </div> 
                  )}
                  
                  {/* Action Buttons */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                    opacity: index === activeSlideIndex ? 1 : 0,
                    visibility: index === activeSlideIndex ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                    zIndex: 10
                  }}>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #E5E5E5',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEF2F2';
                        e.currentTarget.style.borderColor = '#FCA5A5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = '#E5E5E5';
                      }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </button>

                    {/* Ratio Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeRatio(index);
                      }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #E5E5E5',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#374151',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = '#E5E5E5';
                      }}
                    >
                      {slide.ratio}
                    </button>

                    {/* Toggle Panel Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsContentModalOpen(true);
                      }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #E5E5E5',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = '#E5E5E5';
                      }}
                    >
                      <ImageIcon size={16} color="#374151" />
                    </button>

                    {/* Add Text Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addText();
                      }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #E5E5E5',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#374151',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = '#E5E5E5';
                      }}
                    >
                      T
                    </button>

                    {/* Prompt Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPromptModalOpen(true);
                      }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #E5E5E5',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = '#E5E5E5';
                      }}
                    >
                      <MessageSquare size={16} color="#374151" />
                    </button>
                  </div>
                </div>
              ))}
              {/* Add New Slide Button */}
              <div onClick={addSlide} className="slide-item" style={{ width: `${slideWidth}%`, height: '100%', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out', transform: `scale(${activeSlideIndex === slides.length ? 1 : 0.8})`, opacity: activeSlideIndex === slides.length ? 1 : 0.6, cursor: 'pointer' }}>
                <button style={{ all: 'unset', width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed #bbb', backgroundColor: 'rgba(255,255,255,0.5)', fontSize: '40px', color: '#888', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
