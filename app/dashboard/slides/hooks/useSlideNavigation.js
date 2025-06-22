'use client';

import { useCallback, useEffect } from 'react';

export function useSlideNavigation({ activeSlideIndex, setActiveSlideIndex, slidesLength }) {
  const goToPrevSlide = useCallback(() => 
    setActiveSlideIndex(p => (p === 0 ? 0 : p - 1)), 
    [setActiveSlideIndex]
  );

  const goToNextSlide = useCallback(() => 
    setActiveSlideIndex(p => (p < slidesLength ? p + 1 : p)), 
    [setActiveSlideIndex, slidesLength]
  );
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevSlide();
      else if (e.key === 'ArrowRight') goToNextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevSlide, goToNextSlide]);

  return {
    goToPrevSlide,
    goToNextSlide
  };
} 