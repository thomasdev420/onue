import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import { toPng } from 'html-to-image';
import { supabase } from './supabaseClient';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function SlidesTab({ selectedPhotos }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exporting, setExporting] = useState(false);
  const sliderRef = useRef(null);
  const slideContainerRef = useRef(null);

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

  if (selectedPhotos.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Create Slides</h2>
        <p className="text-gray-600">
          Select photos from the Content tab to create slides
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Create Slides</h2>
        
        <div className="flex gap-4 mb-6">
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

        <div className="mt-4 text-center text-gray-600">
          <p>Slide {currentSlide + 1} of {selectedPhotos.length}</p>
          <p className="text-sm mt-2">
            Export slides as images for TikTok or Instagram
          </p>
        </div>
      </div>
    </div>
  );
} 