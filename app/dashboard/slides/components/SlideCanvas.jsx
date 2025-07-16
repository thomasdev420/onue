'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from "next/image";
import { useSlideCanvas } from '../hooks/useSlideCanvas';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useInlineEditing } from '../hooks/useInlineEditing';
import TextOverlay from './TextOverlay';
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
  onPromptModalOpen,
  onFontSizeIncrease,
  onFontSizeDecrease,
  onDeleteText,
  onOpenDownloadModal,
  modeColor
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

  // Enhanced mouse up handler that integrates with inline editing
  const handleTextMouseUp = (e) => {
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

    const newText = {
      id: `text-${activeSlide.id}-${activeSlide.texts.length}`,
      content: 'New Text',
      position: { x: 50, y: 50 }, // Center at 50% for both x and y
      style: {
        fontSize: '16px',
        color: 'white',
        fontWeight: 'normal'
      }
    };
    const newTexts = [...activeSlide.texts, newText];
    onSlideUpdate(activeSlideIndex, { texts: newTexts });
  };

  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="editor-canvas" style={{ 
      flexGrow: 1, 
      display: "flex", 
      alignItems: 'center', 
      position: 'relative', 
      overflow: 'hidden',
      height: '100%'
    }}>
      {/* No dot here! Only the mode toggle dot should exist in the parent/layout. */}
      <div className="slides-track" style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        transform: `translateX(calc(50% - ${slideWidth / 2}% - (${activeSlideIndex} * ${slideWidth}%)))`,
        transition: 'transform 0.5s ease-in-out'
      }}>
        {slides && slides.length > 0 ? slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className="slide-item" 
            data-slide-index={index}
            data-slide-data={JSON.stringify(slide)}
            onClick={() => onSlideSelect(index)} 
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
            {slide.image ? (
              <div
                ref={el => imageContainerRefs.current[index] = el}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: (slide.ratio === '16:9') ? '16 / 9' : (slide.ratio === '4:3') ? '4 / 3' : (slide.ratio === '1:1') ? '1 / 1' : '9 / 16',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {/* Slide number display removed */}
                <Image
                  fill
                  src={slide.image.image_url}
                  alt={slide.image.title}
                  style={{ objectFit: 'cover' }}
                />
                
                {slide.texts && slide.texts.length > 0 && (
                  slide.texts.map((textItem, i) => {
                    const isEditing = inlineEditing.isEditing && inlineEditing.slideIndex === index && inlineEditing.textIndex === i;
                    const isDragging = draggingInfo.isDragging && draggingInfo.textIndex === i;
                    return (
                      <TextOverlay
                        key={textItem.id || `text-${slide.id}-${i}`}
                        textItem={textItem}
                        textIndex={i}
                        slideIndex={index}
                        activeSlideIndex={activeSlideIndex}
                        isInlineEditing={isEditing}
                        isBeingDragged={isDragging}
                        draggingInfo={draggingInfo}
                        inlineEditText={inlineEditText}
                        inlineEditRef={inlineEditRef}
                        onMouseDown={handleTextMouseDown}
                        onInlineEditChange={handleInlineEditChange}
                        onKeyDown={handleKeyDown}
                        onBlur={saveInlineEdit}
                        onClick={handleTextClick}
                        onFontSizeIncrease={onFontSizeIncrease}
                        onFontSizeDecrease={onFontSizeDecrease}
                        onDeleteText={onDeleteText}
                      />
                    );
                  })
                )}
                
                {/* Center Guides - Vertical and Horizontal lines with magnetic snapping */}
                {draggingInfo.isDragging && draggingInfo.textIndex !== -1 && index === activeSlideIndex && (
                  <>
                    {/* Vertical line */}
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
                    {/* Horizontal line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        width: '100%',
                        height: '1px',
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                      }}
                    />
                  </>
                )}
              </div>
            ) : ( 
              <div 
                onClick={index === activeSlideIndex ? (e) => {
                  e.stopPropagation();
                  onContentModalOpen();
                } : undefined}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: (slide.ratio === '16:9') ? '16 / 9' : (slide.ratio === '4:3') ? '4 / 3' : (slide.ratio === '1:1') ? '1 / 1' : '9 / 16',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '12px',
                  backgroundColor: '#F7F7F7',
                  border: '2px dashed #D1D5DB',
                  transition: 'all 0.2s ease-in-out',
                  color: "#6B7280",
                  fontWeight: "500",
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: index === activeSlideIndex ? 'pointer' : 'default',
                  fontSize: '18px',
                }}
              >
                {/* Slide number display for placeholder removed */}
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
              onAddText={handleAddText}
              onPromptModalOpen={onPromptModalOpen}
              onOpenDownloadModal={onOpenDownloadModal}
            />
          </div>
        )) : (
          <div style={{
            width: `${slideWidth}%`,
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#6B7280',
            fontSize: '14px'
          }}>
            No slides available
          </div>
        )}
        
        {/* Add New Slide Button */}
        <div 
          onClick={onAddSlide} 
          className="slide-item" 
          style={{ 
            width: `${slideWidth}%`, 
            height: '100%', 
            flexShrink: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out', 
            transform: `scale(${activeSlideIndex === slides.length ? 1 : 0.8})`, 
            opacity: activeSlideIndex === slides.length ? 1 : 0.6, 
            cursor: 'pointer' 
          }}
        >
          <button style={{ 
            all: 'unset', 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            border: '2px dashed #bbb', 
            backgroundColor: 'rgba(255,255,255,0.5)', 
            fontSize: '40px', 
            color: '#888', 
            cursor: 'pointer', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            +
          </button>
        </div>
      </div>
    </div>
  );
} 