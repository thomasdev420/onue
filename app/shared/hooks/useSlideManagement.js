'use client';

import { useCallback } from 'react';
import { SLIDE_CONFIG } from '../constants/slideConstants';

export function useSlideManagement({ slides, setSlides, activeSlideIndex, setActiveSlideIndex, onError }) {
  const updateSlide = useCallback((slideIndex, newProps) => {
    setSlides(currentSlides =>
      currentSlides.map((slide, i) => (i === slideIndex ? { ...slide, ...newProps } : slide))
    );
  }, [setSlides]);

  const addSlide = useCallback(() => {
    const newSlide = { 
      id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`, 
      image: null, 
      texts: [], 
      ratio: SLIDE_CONFIG.DEFAULT_RATIO 
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  }, [slides, setSlides, setActiveSlideIndex]);

  const deleteSlide = useCallback((slideIndex) => {
    if (slides.length <= 1) {
      const errorMessage = "Cannot delete the last slide. At least one slide is required.";
      if (onError) {
        onError(errorMessage);
      } else {
        console.error(errorMessage);
      }
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
  }, [slides, setSlides, activeSlideIndex, setActiveSlideIndex, onError]);

  const changeRatio = useCallback((slideIndex) => {
    const currentRatio = slides[slideIndex].ratio;
    const ratios = SLIDE_CONFIG.AVAILABLE_RATIOS;
    const currentIndex = ratios.indexOf(currentRatio);
    const nextIndex = (currentIndex + 1) % ratios.length;
    updateSlide(slideIndex, { ratio: ratios[nextIndex] });
  }, [slides, updateSlide]);

  // Add: handleSelectImageForSlide
  const handleSelectImageForSlide = useCallback((image, slideIndex = activeSlideIndex) => {
    updateSlide(slideIndex, { image });
  }, [updateSlide, activeSlideIndex]);

  return {
    updateSlide,
    addSlide,
    deleteSlide,
    changeRatio,
    handleSelectImageForSlide
  };
} 