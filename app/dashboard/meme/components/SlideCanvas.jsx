'use client';

import React from 'react';
import Image from "next/image";
import { useSlideCanvas } from '../hooks/useSlideCanvas';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useInlineEditing } from '../hooks/useInlineEditing';
import TextOverlay from './TextOverlay';
import GifOverlay from './GifOverlay';
import SlideControls from './SlideControls';

export default function SlideCanvas({ 
  slides, 
  activeSlideIndex, 
  onSlideSelect, 
  onSlideUpdate,
  onAddSlide,
  onDeleteSlide,
  onRatioChange,
  onContentModalOpen,
  onGifModalOpen,
  onPromptModalOpen
}) {
  const {
    slideWidth,
    slideItemRefs,
    imageContainerRefs,
    canvasRef
  } = useSlideCanvas();

  const {
    inlineEditing,
    inlineEditText,
    inlineEditRef,
    startInlineEditing,
    saveInlineEdit,
    handleInlineEditChange,
    handleKeyDown
  } = useInlineEditing({
    slides,
    onSlideUpdate
  });

  const {
    draggingInfo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useDragAndDrop({
    slides,
    activeSlideIndex,
    onSlideUpdate,
    imageContainerRefs
  });

  // Enhanced mouse down handler that integrates with inline editing
  const handleTextMouseDown = (e, textIndex) => {
    if (inlineEditing.isEditing) return; // Don't start dragging if editing
    
    handleMouseDown(e, textIndex);
  };

  // Direct click handler for text editing
  const handleTextClick = (e, textIndex) => {
    e.stopPropagation();
    if (!inlineEditing.isEditing) {
      startInlineEditing(activeSlideIndex, textIndex);
    }
  };

  // GIF mouse down handler
  const handleGifMouseDown = (e, gifIndex) => {
    handleMouseDown(e, gifIndex, 'gif');
  };

  // Enhanced mouse up handler that integrates with inline editing
  const handleTextMouseUp = (e) => {
    if (draggingInfo.isDragging) {
      const { initialMousePos, textIndex } = draggingInfo;
      if (initialMousePos && textIndex !== undefined) {
        const finalX = e.clientX;
        const finalY = e.clientY;
        const distance = Math.sqrt(Math.pow(finalX - initialMousePos.x, 2) + Math.pow(finalY - initialMousePos.y, 2));
        
        if (distance < 5) { // Threshold for click vs drag
          startInlineEditing(activeSlideIndex, textIndex);
        }
      }
    }
    handleMouseUp(e);
  };

  // Add mouse up listener for the canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mouseup', handleTextMouseUp);
      return () => canvas.removeEventListener('mouseup', handleTextMouseUp);
    }
  }, [handleTextMouseUp]);

  // Handle add text with proper refs
  const handleAddText = () => {
    const activeSlide = slides[activeSlideIndex];
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
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        content: 'New Text',
        position: { x: centerX, y: centerY }
      };
      const newTexts = [...activeSlide.texts, newText];
      onSlideUpdate(activeSlideIndex, { texts: newTexts });
    }
  };

  return (
    <div ref={canvasRef} className="editor-canvas" style={{ 
      flexGrow: 1, 
      display: "flex", 
      alignItems: 'center', 
      position: 'relative', 
      overflow: 'hidden',
      height: '100%'
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
            onClick={() => onSlideSelect(index)} 
            className="slide-item" 
            style={{
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
            }}
          >
            {/* Colored dot above the active slide - REMOVED DUPLICATE */}
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
                }}
              >
                <Image
                  fill
                  src={slide.image.image_url}
                  alt={slide.image.title}
                  style={{ objectFit: 'cover' }}
                />
                
                {slide.texts.map((textItem, textIndex) => (
                  <TextOverlay
                    key={textItem.id}
                    textItem={textItem}
                    textIndex={textIndex}
                    slideIndex={index}
                    activeSlideIndex={activeSlideIndex}
                    isInlineEditing={inlineEditing.isEditing && 
                      inlineEditing.slideIndex === index && 
                      inlineEditing.textIndex === textIndex}
                    isBeingDragged={draggingInfo.isDragging && draggingInfo.textIndex === textIndex}
                    draggingInfo={draggingInfo}
                    inlineEditText={inlineEditText}
                    inlineEditRef={inlineEditRef}
                    onMouseDown={handleTextMouseDown}
                    onInlineEditChange={handleInlineEditChange}
                    onKeyDown={handleKeyDown}
                    onBlur={saveInlineEdit}
                    onClick={handleTextClick}
                  />
                ))}
                
                {/* GIF Overlays */}
                {slide.gifOverlays && slide.gifOverlays.map((gifOverlay, gifIndex) => (
                  <GifOverlay
                    key={gifOverlay.id}
                    gifOverlay={gifOverlay}
                    gifIndex={gifIndex}
                    slideIndex={index}
                    activeSlideIndex={activeSlideIndex}
                    isBeingDragged={draggingInfo.isDragging && draggingInfo.textIndex === gifIndex && draggingInfo.type === 'gif'}
                    draggingInfo={draggingInfo}
                    onMouseDown={handleGifMouseDown}
                    onDelete={(deleteIndex) => {
                      const newGifOverlays = slide.gifOverlays.filter((_, i) => i !== deleteIndex);
                      onSlideUpdate(index, { gifOverlays: newGifOverlays });
                    }}
                  />
                ))}
                
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
                onClick={index === activeSlideIndex ? (e) => {
                  e.stopPropagation();
                  onContentModalOpen();
                } : undefined}
                style={{
                  color: "#6B7280",
                  fontWeight: "500",
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  backgroundColor: '#F7F7F7',
                  border: '2px dashed #D1D5DB',
                  transition: 'all 0.2s ease-in-out',
                  cursor: index === activeSlideIndex ? 'pointer' : 'default'
                }}
              >
                Select an image
              </div> 
            )}
            
            <SlideControls
              slide={slide}
              slideIndex={index}
              activeSlideIndex={activeSlideIndex}
              onDeleteSlide={onDeleteSlide}
              onRatioChange={onRatioChange}
              onContentModalOpen={onContentModalOpen}
              onGifModalOpen={onGifModalOpen}
              onAddText={handleAddText}
              onPromptModalOpen={onPromptModalOpen}
            />
          </div>
        ))}
        
        {/* LFG only supports one slide - no add button */}
      </div>
    </div>
  );
} 