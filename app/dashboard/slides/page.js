'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { supabase } from "../../../supabaseClient";
import { Input } from './../../components/ui/Input';
import { Button } from './../../components/ui/Button';
import { Trash2, ChevronDown, PanelLeft, X } from 'lucide-react';

export default function SlidesEditor() {
  const [libraryImages, setLibraryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentType, setContentType] = useState('stock'); // New state for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state for dropdown open/close
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  const [slides, setSlides] = useState([
    { id: Date.now(), image: null, texts: [], ratio: '16:9' }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [draggingInfo, setDraggingInfo] = useState({ isDragging: false, textIndex: -1, offset: { x: 0, y: 0 } });
  const canvasRef = useRef(null);
  
  const textRefs = useRef([]);
  const imageRefs = useRef([]);
  const slideItemRefs = useRef([]);
  const imageContainerRefs = useRef([]);

  const activeSlide = slides[activeSlideIndex];

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
  }, []);

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

  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [text, setText] = useState('');

  const startEditing = useCallback((index) => {
    if (index === null || !activeSlide.texts[index]) return;
    setIsEditing(true);
    setEditingIndex(index);
    setText(activeSlide.texts[index].content);
  }, [activeSlide.texts]);

  const handleSelectImageForSlide = (image) => {
    updateSlide(activeSlideIndex, { image, ratio: '9:16' });
    setIsContentModalOpen(false);
  };
  
  const addText = () => {
    if (!activeSlide.image) {
      alert("Please select an image before adding text.");
      return;
    }
    const content = text.trim() || 'New Text';

    const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
    
    if (imageContainerEl) {
        const imageContainerRect = imageContainerEl.getBoundingClientRect();
        const centerX = imageContainerRect.width / 2;
        const centerY = imageContainerRect.height / 2;

        const newText = {
          id: Date.now(),
          content: content,
          position: { x: centerX - 50, y: centerY - 20 }
        };
        const newTexts = [...activeSlide.texts, newText];
        updateSlide(activeSlideIndex, { texts: newTexts });
        setText('');
    }
  };
  
  const handleMouseDown = (e, textIndex) => {
    if (textRefs.current[textIndex]) {
      const textRect = textRefs.current[textIndex].getBoundingClientRect();
      setDraggingInfo({
        isDragging: true,
        textIndex,
        initialX: e.clientX,
        initialY: e.clientY,
        offset: {
          x: e.clientX - textRect.left,
          y: e.clientY - textRect.top,
        }
      });
    }
  };

  const handleMouseUp = useCallback((e) => {
    if (draggingInfo.isDragging) {
      const { initialX, initialY, textIndex } = draggingInfo;
      if (initialX !== undefined && initialY !== undefined) {
        const finalX = e.clientX;
        const finalY = e.clientY;
        const distance = Math.sqrt(Math.pow(finalX - initialX, 2) + Math.pow(finalY - initialY, 2));
        
        if (distance < 5) { // Threshold for click vs drag
          startEditing(textIndex);
        }
      }
    }
    setDraggingInfo({ isDragging: false, textIndex: -1, offset: { x: 0, y: 0 } });
  }, [draggingInfo, startEditing]);

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
      newX = Math.max(0, Math.min(newX, imageContainerRect.width - textRect.width));
      newY = Math.max(0, Math.min(newY, imageContainerRect.height - textRect.height));
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

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const updateText = () => {
    if (editingIndex !== null) {
      const newTexts = activeSlide.texts.map((t, i) =>
        i === editingIndex ? { ...t, content: text } : t
      );
      updateSlide(activeSlideIndex, { texts: newTexts });
    }
    setIsEditing(false);
    setEditingIndex(null);
    setText('');
  };

  const deleteText = () => {
    if (editingIndex !== null) {
      const newTexts = activeSlide.texts.filter((_, i) => i !== editingIndex);
      updateSlide(activeSlideIndex, { texts: newTexts });
    }
    setIsEditing(false);
    setEditingIndex(null);
    setText('');
  };

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

  return (
    <>
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
          flexBasis: "100%", 
          display: "flex", 
          flexDirection: "column"
        }}>
          <div ref={canvasRef} className="editor-canvas" style={{ flexGrow: 1, display: "flex", alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
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
                      {slide.texts.map((textItem, textIndex) => (
                        <div
                          key={textItem.id}
                          ref={el => textRefs.current[textIndex] = el}
                          onMouseDown={(e) => index === activeSlideIndex && handleMouseDown(e, textIndex)}
          style={{
                            position: 'absolute',
                            left: `${textItem.position.x}px`,
                            top: `${textItem.position.y}px`,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            cursor: index === activeSlideIndex ? 'move' : 'default',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                          }}
                        >
                          {textItem.content}
                        </div>
                      ))}
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
                      <PanelLeft size={16} color="#374151" />
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
           <div className="flex items-center p-2 mt-8 bg-gray-100 rounded-lg shadow-inner">
                <Input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Click text on slide to edit, or type to add"
                    className="flex-grow bg-transparent border-0 focus:ring-0 text-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            isEditing ? updateText() : addText();
                        }
                    }}
                />
                <Button onClick={isEditing ? updateText : addText} className="ml-2 px-3 py-1 text-sm">
                    {isEditing ? 'Update' : 'Add'}
                </Button>
                {isEditing && (
                    <Button onClick={deleteText} className="ml-2 p-2 text-sm bg-red-600 hover:bg-red-700 rounded-full">
                        <Trash2 size={16} />
                    </Button>
                )}
            </div>
        </div>
      </div>
    </>
  );
}
