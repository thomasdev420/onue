'use client';

import { useState, useCallback, useEffect } from 'react';

export function useSlideManagement({ slides, setSlides, activeSlideIndex, setActiveSlideIndex }) {
  const updateSlide = useCallback((slideIndex, newProps) => {
    setSlides(currentSlides =>
      currentSlides.map((slide, i) => (i === slideIndex ? { ...slide, ...newProps } : slide))
    );
  }, [setSlides]);

  const addSlide = useCallback(() => {
    const newSlide = { id: Date.now(), image: null, texts: [], ratio: '16:9' };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  }, [slides, setSlides, setActiveSlideIndex]);

  const deleteSlide = useCallback((slideIndex) => {
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
  }, [slides, setSlides, activeSlideIndex, setActiveSlideIndex]);

  const changeRatio = useCallback((slideIndex) => {
    const currentRatio = slides[slideIndex].ratio;
    const ratios = ['16:9', '4:3', '1:1', '9:16'];
    const currentIndex = ratios.indexOf(currentRatio);
    const nextIndex = (currentIndex + 1) % ratios.length;
    updateSlide(slideIndex, { ratio: ratios[nextIndex] });
  }, [slides, updateSlide]);

  const handleSelectImageForSlide = useCallback((image) => {
    const imageToUse = { ...image, image_url: image.image_url || image.url };
    updateSlide(activeSlideIndex, { image: imageToUse, ratio: '9:16' });
  }, [activeSlideIndex, updateSlide]);

  return {
    updateSlide,
    addSlide,
    deleteSlide,
    changeRatio,
    handleSelectImageForSlide
  };
} 