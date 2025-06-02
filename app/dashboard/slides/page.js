'use client';

import React, { useState, useRef, useEffect } from 'react';
import Slider from 'react-slick';
import { toPng } from 'html-to-image';
import { supabase } from '../../../supabaseClient';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Slides() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [userPhotos, setUserPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const slideContainerRef = useRef(null);

  // Load user's photos when component mounts
  useEffect(() => {
    loadUserPhotos();
  }, []);

  const loadUserPhotos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to view photos');
      }

      // Get photos from the database
      const { data, error } = await supabase
        .from('photos')
        .select('file_path')
        .eq('user_id', user.id);

      if (error) throw error;

      // Get public URLs for all photos
      const photos = data.map(photo => ({
        path: photo.file_path,
        url: supabase.storage.from('user-photos').getPublicUrl(photo.file_path).data.publicUrl
      }));

      setUserPhotos(photos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photo) => {
    setSelectedPhotos(prev => {
      const isSelected = prev.some(p => p.path === photo.path);
      if (isSelected) {
        return prev.filter(p => p.path !== photo.path);
      } else {
        return [...prev, photo];
      }
    });
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  const handleExport = async () => {
    if (!slideContainerRef.current) return;

    try {
      setExporting(true);
      
      // Get the current slide element
      const currentSlideElement = slideContainerRef.current.querySelector('.slick-current');
      if (!currentSlideElement) return;

      // Convert the slide to an image
      const dataUrl = await toPng(currentSlideElement, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: 'white',
      });

      // Create a download link
      const link = document.createElement('a');
      link.download = `slide-${currentSlide + 1}.png`;
      link.href = dataUrl;
      link.click();

    } catch (error) {
      console.error('Error exporting slide:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (!slideContainerRef.current) return;

    try {
      setExporting(true);
      const totalSlides = selectedPhotos.length;

      for (let i = 0; i < totalSlides; i++) {
        // Move to the next slide
        sliderRef.current.slickGoTo(i);
        
        // Wait for the slide transition
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the current slide element
        const currentSlideElement = slideContainerRef.current.querySelector('.slick-current');
        if (!currentSlideElement) continue;

        // Convert the slide to an image
        const dataUrl = await toPng(currentSlideElement, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: 'white',
        });

        // Create a download link
        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();

        // Wait a bit before processing the next slide
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error exporting slides:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading your photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create Slides</h1>
        <p className="text-gray-600 mt-2">
          Select photos to create slides for TikTok or Instagram
        </p>
      </div>

      {/* Photo Selection Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Photos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userPhotos.map((photo) => {
            const isSelected = selectedPhotos.some(p => p.path === photo.path);
            return (
              <div 
                key={photo.path} 
                className={`relative aspect-square group cursor-pointer
                  ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
                onClick={() => togglePhotoSelection(photo)}
              >
                <img
                  src={photo.url}
                  alt="Uploaded photo"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                  transition-opacity duration-200 rounded-lg flex items-center justify-center`}>
                  {isSelected && (
                    <div className="bg-blue-500 text-white p-2 rounded-full">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slides Preview */}
      {selectedPhotos.length > 0 && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {exporting ? 'Exporting...' : 'Export Current Slide'}
            </button>
            
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {exporting ? 'Exporting...' : 'Export All Slides'}
            </button>
          </div>

          <div ref={slideContainerRef} className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
            <Slider ref={sliderRef} {...settings}>
              {selectedPhotos.map((photo, index) => (
                <div key={photo.path} className="p-4">
                  <div className="aspect-[9/16] relative">
                    <img
                      src={photo.url}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-lg">
                      <p className="text-center">Slide {index + 1}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>

          <div className="text-center text-gray-600">
            <p>Slide {currentSlide + 1} of {selectedPhotos.length}</p>
            <p className="text-sm mt-2">
              Export slides as images for TikTok or Instagram
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 