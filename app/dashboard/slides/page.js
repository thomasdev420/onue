'use client';

import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { usePersistence } from '../../services/persistenceService';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';
import SlideCanvas from './components/SlideCanvas';
import ContentModal from './components/ContentModal';
import PromptModal from './components/PromptModal';
import { useSlideManagement } from './hooks/useSlideManagement';
import { useSlideNavigation } from './hooks/useSlideNavigation';

export default function SlidesEditor() {
  // State for image library
  const [libraryImages, setLibraryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentType, setContentType] = useState('stock');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

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

  // Active slide state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Custom hooks for slide management
  const {
    updateSlide,
    addSlide,
    deleteSlide,
    changeRatio,
    handleSelectImageForSlide
  } = useSlideManagement({
    slides,
    setSlides,
    activeSlideIndex,
    setActiveSlideIndex
  });

  // Navigation hook
  useSlideNavigation({
    activeSlideIndex,
    setActiveSlideIndex,
    slidesLength: slides.length
  });

  // Fetch images from database
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('images').select('id, title, image_url');
        if (error) throw error;
        setLibraryImages(data);
      } catch (error) { 
        console.error("Error fetching images:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchImages();
  }, []);

  // Event handlers
  const handleSlideSelect = (index) => {
    setActiveSlideIndex(index);
  };

  const handleSlideUpdate = (slideIndex, newProps) => {
    updateSlide(slideIndex, newProps);
  };

  const handleAddSlide = () => {
    addSlide();
  };

  const handleDeleteSlide = (slideIndex) => {
    deleteSlide(slideIndex);
  };

  const handleRatioChange = (slideIndex) => {
    changeRatio(slideIndex);
  };

  const handleContentModalOpen = () => {
    setIsContentModalOpen(true);
  };

  const handleContentModalClose = () => {
    setIsContentModalOpen(false);
  };

  const handlePromptModalOpen = () => {
    setIsPromptModalOpen(true);
  };

  const handlePromptModalClose = () => {
    setIsPromptModalOpen(false);
  };

  const handlePromptSubmit = (prompt) => {
    // TODO: Implement AI prompt functionality
    console.log('Prompt submitted:', prompt);
  };

  const handleImageSelect = (image) => {
    handleSelectImageForSlide(image);
    setIsContentModalOpen(false);
  };

  // Add a guard to prevent rendering with invalid slide data
  if (isLoadingSlides || !slides || slides.length === 0) {
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

      <ContentModal
        isOpen={isContentModalOpen}
        onClose={handleContentModalClose}
        contentType={contentType}
        setContentType={setContentType}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        libraryImages={libraryImages}
        userImages={userImages}
        onImageSelect={handleImageSelect}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={handlePromptModalClose}
        onSubmit={handlePromptSubmit}
      />

      <div style={{ 
        display: "flex", 
        height: "90vh", 
        padding: "0px 8px", 
        boxSizing: "border-box", 
        fontFamily: "'Inter', sans-serif" 
      }}>
        <div style={{ 
          flexBasis: "100%", 
          display: "flex", 
          flexDirection: "column",
          position: "relative"
        }}>
          <SlideCanvas
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSlideSelect={handleSlideSelect}
            onSlideUpdate={handleSlideUpdate}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onRatioChange={handleRatioChange}
            onContentModalOpen={handleContentModalOpen}
            onPromptModalOpen={handlePromptModalOpen}
          />
        </div>
      </div>
    </>
  );
} 