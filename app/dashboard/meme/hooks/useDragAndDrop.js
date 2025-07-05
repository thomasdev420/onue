'use client';

import { useState, useCallback, useEffect } from 'react';

export function useDragAndDrop({ slides, activeSlideIndex, onSlideUpdate, imageContainerRefs }) {
  const [draggingInfo, setDraggingInfo] = useState({ 
    isDragging: false, 
    textIndex: -1, 
    type: null, // 'text' or 'gif'
    initialMousePos: null, 
    initialElementPos: null,
    elementWidth: 0,
    elementHeight: 0 
  });

  const handleMouseDown = useCallback((e, elementIndex, type = 'text') => {
    e.preventDefault();
    e.stopPropagation();

    const currentSlide = slides[activeSlideIndex];
    let elementPosition, elementSize;

    if (type === 'text') {
      elementPosition = currentSlide.texts[elementIndex].position;
      elementSize = { width: 100, height: 50 }; // Default text size
    } else if (type === 'gif') {
      elementPosition = currentSlide.gifOverlays[elementIndex].position;
      elementSize = { 
        width: currentSlide.gifOverlays[elementIndex].size, 
        height: currentSlide.gifOverlays[elementIndex].size 
      };
    }
    
    setDraggingInfo({
      isDragging: true,
      textIndex: elementIndex,
      type,
      initialMousePos: { x: e.clientX, y: e.clientY },
      initialElementPos: { x: elementPosition.x, y: elementPosition.y },
      elementWidth: elementSize.width,
      elementHeight: elementSize.height,
    });
  }, [slides, activeSlideIndex]);

  const handleMouseMove = useCallback((e) => {
    if (!draggingInfo.isDragging || draggingInfo.textIndex === -1) return;

    e.preventDefault();
    e.stopPropagation();

    const { textIndex, type, initialMousePos, initialElementPos, elementWidth, elementHeight } = draggingInfo;
    const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
    
    if(!imageContainerEl) return;

    const imageContainerRect = imageContainerEl.getBoundingClientRect();
    
    const dx = e.clientX - initialMousePos.x;
    const dy = e.clientY - initialMousePos.y;

    // Convert pixel movement to percentage movement
    const percentDx = (dx / imageContainerRect.width) * 100;
    const percentDy = (dy / imageContainerRect.height) * 100;

    let newX = initialElementPos.x + percentDx;
    let newY = initialElementPos.y + percentDy;
    
    if (type === 'text' || type === 'gif') {
      if (elementWidth > 0 && elementHeight > 0) {
        if (type === 'text') {
          const halfWidthPercent = (elementWidth / imageContainerRect.width) * 50;
          const halfHeightPercent = (elementHeight / imageContainerRect.height) * 50;
          // Magnetic snapping to vertical center (50%)
          const snapThreshold = 5; // 5% threshold
          if (Math.abs(newX - 50) < snapThreshold) {
            newX = 50;
          }
          // Clamp position within the container bounds (0-100%)
          newX = Math.max(halfWidthPercent, Math.min(newX, 100 - halfWidthPercent));
          newY = Math.max(halfHeightPercent, Math.min(newY, 100 - halfHeightPercent));
        } else if (type === 'gif') {
          // Allow GIF to go up to 12px outside the border
          const margin = 12;
          newX = Math.max(0 - margin, Math.min(newX, imageContainerRect.width - elementWidth + margin));
          newY = Math.max(0 - margin, Math.min(newY, imageContainerRect.height - elementHeight + margin));
        }
      }
      if (type === 'text') {
        const newTexts = slides[activeSlideIndex].texts.map((text, i) => 
          i === textIndex ? { ...text, position: { x: newX, y: newY } } : text
        );
        onSlideUpdate(activeSlideIndex, { texts: newTexts });
      } else if (type === 'gif') {
        const newGifOverlays = slides[activeSlideIndex].gifOverlays.map((gif, i) => 
          i === textIndex ? { ...gif, position: { x: newX, y: newY } } : gif
        );
        onSlideUpdate(activeSlideIndex, { gifOverlays: newGifOverlays });
      }
    }
  }, [activeSlideIndex, draggingInfo, slides, onSlideUpdate, imageContainerRefs]);
  
  const handleMouseUp = useCallback((e) => {
    if (draggingInfo.isDragging) {
      const { initialMousePos, textIndex, type, elementWidth, elementHeight } = draggingInfo;
      if (initialMousePos) {
        const finalX = e.clientX;
        const finalY = e.clientY;
        const distance = Math.sqrt(Math.pow(finalX - initialMousePos.x, 2) + Math.pow(finalY - initialMousePos.y, 2));
        
        if (distance < 5) {
          // This is a click, not a drag - will be handled by inline editing for text
        } else {
          // It's a drag, so persist the size for text elements
          if (type === 'text') {
            const newTexts = slides[activeSlideIndex].texts.map((text, i) => 
              i === textIndex ? { ...text, width: elementWidth, height: elementHeight } : text
            );
            onSlideUpdate(activeSlideIndex, { texts: newTexts });
          }
        }
      }
    }
    setDraggingInfo({ 
      isDragging: false, 
      textIndex: -1, 
      type: null,
      initialMousePos: null, 
      initialElementPos: null, 
      elementWidth: 0, 
      elementHeight: 0 
    });
  }, [draggingInfo, activeSlideIndex, slides, onSlideUpdate]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    draggingInfo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
} 