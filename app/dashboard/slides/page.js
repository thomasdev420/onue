'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { supabase } from "../../../supabaseClient";
import { Input } from './../../components/ui/Input';
import { Button } from './../../components/ui/Button';
import { Trash2, ChevronDown, PanelLeft, X, Image as ImageIcon, Expand, Minimize, ArrowRight } from 'lucide-react';
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

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [draggingInfo, setDraggingInfo] = useState({ isDragging: false, textIndex: -1, offset: { x: 0, y: 0 } });
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
    updateSlide(activeSlideIndex, { image, ratio: '9:16' });
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
      const textRect = textRefs.current[textIndex].getBoundingClientRect();
      const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
      const imageContainerRect = imageContainerEl.getBoundingClientRect();
      
      // Calculate the center of the text element
      const textCenterX = textRect.left + textRect.width / 2;
      const textCenterY = textRect.top + textRect.height / 2;
      
      setDraggingInfo({
        isDragging: true,
        textIndex,
        initialX: e.clientX,
        initialY: e.clientY,
        offset: {
          x: e.clientX - textCenterX,
          y: e.clientY - textCenterY,
        }
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
      const { initialX, initialY, textIndex } = draggingInfo;
      if (initialX !== undefined && initialY !== undefined) {
        const finalX = e.clientX;
        const finalY = e.clientY;
        const distance = Math.sqrt(Math.pow(finalX - initialX, 2) + Math.pow(finalY - initialY, 2));
        
        if (distance < 5) { // Threshold for click vs drag
          // Start inline editing instead of the old editing system
          startInlineEditing(activeSlideIndex, textIndex);
        }
      }
    }
    setDraggingInfo({ isDragging: false, textIndex: -1, offset: { x: 0, y: 0 } });
  }, [draggingInfo, activeSlideIndex, startInlineEditing]);

  const handleMouseMove = useCallback((e) => {
    if (!draggingInfo.isDragging || draggingInfo.textIndex === -1) return;

    const { textIndex, offset } = draggingInfo;
    const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
    
    if(!imageContainerEl) return;

    const imageContainerRect = imageContainerEl.getBoundingClientRect();
    
    let newX = e.clientX - imageContainerRect.left - offset.x;
    let newY = e.clientY - imageContainerRect.top - offset.y;
    
    const textRect = textRefs.current[textIndex]?.getBoundingClientRect();
    if (textRect) {
      // Account for the centered positioning - the position represents the center
      const halfWidth = textRect.width / 2;
      const halfHeight = textRect.height / 2;
      
      // Magnetic snapping to vertical center
      const centerX = imageContainerRect.width / 2;
      const snapThreshold = 20; // pixels from center to trigger snap
      
      if (Math.abs(newX - centerX) < snapThreshold) {
        newX = centerX; // Snap to center
      }
      
      newX = Math.max(halfWidth, Math.min(newX, imageContainerRect.width - halfWidth));
      newY = Math.max(halfHeight, Math.min(newY, imageContainerRect.height - halfHeight));
    }
    
    const newTexts = activeSlide.texts.map((text, i) => 
      i === textIndex ? { ...text, position: { x: newX, y: newY } } : text
    );
    updateSlide(activeSlideIndex, { texts: newTexts });
  }, [activeSlide.texts, activeSlideIndex, draggingInfo, updateSlide]);
  
  useEffect(() => {
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
      
      if (trimmedText === '') {
        // If the text is empty, delete the caption
        const newTexts = slides[inlineEditing.slideIndex].texts.filter((_, i) => i !== inlineEditing.textIndex);
        updateSlide(inlineEditing.slideIndex, { texts: newTexts });
      } else {
        // Save the trimmed text
        const newTexts = slides[inlineEditing.slideIndex].texts.map((text, i) =>
          i === inlineEditing.textIndex ? { ...text, content: trimmedText } : text
        );
        updateSlide(inlineEditing.slideIndex, { texts: newTexts });
      }
    }
    setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
    setInlineEditText('');
  }, [inlineEditing.isEditing, inlineEditing.textIndex, inlineEditing.slideIndex, inlineEditText, slides, updateSlide]);

  const cancelInlineEdit = useCallback(() => {
    setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
    setInlineEditText('');
  }, []);

  const deleteInlineText = useCallback(() => {
    if (inlineEditing.isEditing && inlineEditing.textIndex !== -1 && inlineEditing.slideIndex !== -1) {
      const newTexts = slides[inlineEditing.slideIndex].texts.filter((_, i) => i !== inlineEditing.textIndex);
      updateSlide(inlineEditing.slideIndex, { texts: newTexts });
    }
    setInlineEditing({ isEditing: false, textIndex: -1, slideIndex: -1 });
    setInlineEditText('');
  }, [inlineEditing.isEditing, inlineEditing.textIndex, inlineEditing.slideIndex, slides, updateSlide]);

  // Handle keyboard events for inline editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!inlineEditing.isEditing) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        saveInlineEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelInlineEdit();
      } else if (e.key === 'Delete' && e.ctrlKey) {
        e.preventDefault();
        deleteInlineText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inlineEditing.isEditing, saveInlineEdit, cancelInlineEdit, deleteInlineText]);

  // Render content based on selected dropdown option
  const renderContent = () => {
    if (contentType === 'stock') {
      return (
        <>
          {isLoading ? <p>Loading images...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginTop: '8px' }}>
              {libraryImages.map(image => (
                <div key={image.id} onClick={() => handleSelectImageForSlide(image)} style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', position: 'relative', width: '100%', height: '100px' }}>
                  <Image fill src={image.image_url} alt={image.title} style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </>
      );
    } else if (contentType === 'your-photos') {
      return (
        <div style={{ 
          backgroundColor: '#FFF', 
          color: '#777', 
          textAlign: 'center', 
          padding: '40px 20px', 
          borderRadius: '8px',
          marginTop: '8px',
          fontFamily: "'Inter', sans-serif"
        }}>
          No photos uploaded yet
        </div>
      );
    }
    return null;
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
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#F4F4F4',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      border: '1px solid #E5E5E5',
                    }}
                  >
                    <span>{contentType === 'stock' ? 'Stock' : 'Your Photos'}</span>
                    <ChevronDown size={16} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>

                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFF',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      border: '1px solid #E5E5E5',
                      zIndex: 10,
                      marginTop: '2px',
                    }}>
                      <div
                        onClick={() => {
                          setContentType('stock');
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          color: '#333',
                          backgroundColor: contentType === 'stock' ? '#F0F0F0' : 'transparent',
                          borderBottom: '1px solid #F0F0F0',
                        }}
                      >
                        Stock
                      </div>
                      <div
                        onClick={() => {
                          setContentType('your-photos');
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          color: '#333',
                          backgroundColor: contentType === 'your-photos' ? '#F0F0F0' : 'transparent',
                        }}
                      >
                        Your Photos
                      </div>
                    </div>
                  )}
                </div>

                {renderContent()}
              </div>
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
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsSlideSectionExpanded(!isSlideSectionExpanded)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E5E5E5',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              zIndex: 1000,
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
            {isSlideSectionExpanded ? (
              <Minimize size={16} color="#374151" />
            ) : (
              <Expand size={16} color="#374151" />
            )}
          </button>

          <div ref={canvasRef} className="editor-canvas" style={{ 
            flexGrow: 1, 
            display: "flex", 
            alignItems: 'center', 
            position: 'relative', 
            overflow: 'hidden',
            height: isSlideSectionExpanded ? '100%' : 'calc(100% - 100px)' // Leave space for input bar when collapsed
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
                        
                        // Calculate the width based on text content to maintain consistent sizing
                        const textLength = textItem.content.length;
                        const baseWidth = Math.min(Math.max(textLength * 8, 50), 250); // 8px per character, min 50px, max 250px
                        
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
                              minWidth: '20px',
                              minHeight: '20px',
                              width: isInlineEditing ? 'auto' : `${baseWidth}px`,
                              maxWidth: isInlineEditing ? '400px' : '250px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              hyphens: 'auto',
                            }}
                          >
                            {isInlineEditing ? (
                              <textarea
                                ref={inlineEditRef}
                                value={inlineEditText}
                                onChange={(e) => setInlineEditText(e.target.value)}
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
                                  minWidth: '100px',
                                  maxWidth: '400px',
                                  padding: '0',
                                  margin: '0',
                                  lineHeight: 'inherit',
                                  resize: 'none',
                                  overflow: 'hidden',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  hyphens: 'auto',
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    saveInlineEdit();
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelInlineEdit();
                                  }
                                }}
                                onInput={(e) => {
                                  // Auto-resize the textarea to fit content
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                              />
                            ) : (
                              <span style={{ 
                                textAlign: 'center', 
                                width: '100%',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto',
                              }}>
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
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F0F0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F7F7F7'; }}
                      style={{
                        color: "#777",
                        fontWeight: "600",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        backgroundColor: '#F7F7F7',
                        border: '1px solid #EAEAEA',
                        transition: 'background-color 0.2s ease',
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
                  </div>
                </div>
              ))}
              {/* Add New Slide Button */}
              <div onClick={addSlide} className="slide-item" style={{ width: `${slideWidth}%`, height: '100%', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out', transform: `scale(${activeSlideIndex === slides.length ? 1 : 0.8})`, opacity: activeSlideIndex === slides.length ? 1 : 0.6, cursor: 'pointer' }}>
                <button style={{ all: 'unset', width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed #bbb', backgroundColor: 'rgba(255,255,255,0.5)', fontSize: '40px', color: '#888', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
              </div>
            </div>
          </div>

          {/* Text Input Bar - Only shown when collapsed */}
          {!isSlideSectionExpanded && (
            <div className="flex items-center p-4 mt-8">
              <div className="relative flex-grow">
                <Input
                    type="text"
                  placeholder="Enter your prompt here..."
                  className="w-full bg-transparent border-2 border-gray-300 focus:border focus:border-blue-500 focus:ring-0 text-sm pr-12"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                      // TODO: Add prompt functionality later
                      console.log('Prompt submitted:', e.target.value);
                      e.target.value = '';
                        }
                    }}
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                  onClick={() => {
                    // TODO: Add prompt functionality later
                    const input = document.querySelector('input[placeholder="Enter your prompt here..."]');
                    if (input) {
                      console.log('Prompt submitted:', input.value);
                      input.value = '';
                    }
                  }}
                >
                  <ArrowRight size={16} color="black" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
