'use client';

import { useState, useCallback, useEffect } from 'react';

export function useDragAndDrop({ slides, activeSlideIndex, onSlideUpdate, imageContainerRefs }) {
  const [draggingInfo, setDraggingInfo] = useState({ 
    isDragging: false, 
    textIndex: -1, 
    initialMousePos: null, 
    initialTextPos: null,
    elementWidth: 0,
    elementHeight: 0 
  });

  const handleMouseDown = useCallback((e, textIndex) => {
    const textRefs = document.querySelectorAll('[data-text-overlay]');
    const textElement = textRefs[textIndex];
    
    if (textElement) {
      e.preventDefault();
      e.stopPropagation();

      const textPosition = slides[activeSlideIndex].texts[textIndex].position;
      const rect = textElement.getBoundingClientRect();
      
      setDraggingInfo({
        isDragging: true,
        textIndex,
        initialMousePos: { x: e.clientX, y: e.clientY },
        initialTextPos: { x: textPosition.x, y: textPosition.y },
        elementWidth: rect.width,
        elementHeight: rect.height,
      });
    }
  }, [slides, activeSlideIndex]);

  const handleMouseMove = useCallback((e) => {
    if (!draggingInfo.isDragging || draggingInfo.textIndex === -1) return;

    e.preventDefault();
    e.stopPropagation();

    const { textIndex, initialMousePos, initialTextPos, elementWidth, elementHeight } = draggingInfo;
    const imageContainerEl = imageContainerRefs.current[activeSlideIndex];
    
    if(!imageContainerEl) return;

    const imageContainerRect = imageContainerEl.getBoundingClientRect();
    
    const dx = e.clientX - initialMousePos.x;
    const dy = e.clientY - initialMousePos.y;

    let newX = initialTextPos.x + dx;
    let newY = initialTextPos.y + dy;
    
    if (elementWidth > 0 && elementHeight > 0) {
      const halfWidth = elementWidth / 2;
      const halfHeight = elementHeight / 2;
      
      // Magnetic snapping to vertical center
      const centerX = imageContainerRect.width / 2;
      const snapThreshold = 10;
      
      if (Math.abs(newX - centerX) < snapThreshold) {
        newX = centerX;
      }
      
      // Clamp position within the container bounds
      newX = Math.max(halfWidth, Math.min(newX, imageContainerRect.width - halfWidth));
      newY = Math.max(halfHeight, Math.min(newY, imageContainerRect.height - halfHeight));
    }
    
    const newTexts = slides[activeSlideIndex].texts.map((text, i) => 
      i === textIndex ? { ...text, position: { x: newX, y: newY } } : text
    );
    onSlideUpdate(activeSlideIndex, { texts: newTexts });
  }, [activeSlideIndex, draggingInfo, slides, onSlideUpdate, imageContainerRefs]);
  
  const handleMouseUp = useCallback((e) => {
    if (draggingInfo.isDragging) {
      const { initialMousePos, textIndex, elementWidth, elementHeight } = draggingInfo;
      if (initialMousePos) {
        const finalX = e.clientX;
        const finalY = e.clientY;
        const distance = Math.sqrt(Math.pow(finalX - initialMousePos.x, 2) + Math.pow(finalY - initialMousePos.y, 2));
        
        if (distance < 5) {
          // This is a click, not a drag - will be handled by inline editing
        } else {
          // It's a drag, so persist the size
          const newTexts = slides[activeSlideIndex].texts.map((text, i) => 
            i === textIndex ? { ...text, width: elementWidth, height: elementHeight } : text
          );
          onSlideUpdate(activeSlideIndex, { texts: newTexts });
        }
      }
    }
    setDraggingInfo({ isDragging: false, textIndex: -1, initialMousePos: null, initialTextPos: null, elementWidth: 0, elementHeight: 0 });
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