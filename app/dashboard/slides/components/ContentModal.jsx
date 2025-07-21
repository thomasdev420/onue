'use client';

import React, { useState, useMemo } from 'react';
import Image from "next/image";
import { X, ChevronDown, Grid, List } from 'lucide-react';
import { UNIFIED_CATEGORIES, CATEGORIES, CATEGORY_KEYWORDS } from '../../../shared/constants/imageCategories.js';

// Utility: extract dominant color from image using Canvas API
function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 50; // Small size for performance
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      
      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      // Sample pixels and get average color
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }
      
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      // Convert to HSL for better sorting
      const hsl = rgbToHsl(r, g, b);
      resolve({ r, g, b, h: hsl[0], s: hsl[1], l: hsl[2] });
    };
    img.onerror = () => {
      // Fallback for failed images
      resolve({ r: 128, g: 128, b: 128, h: 0, s: 0, l: 0.5 });
    };
    img.src = imageUrl;
  });
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 360, s * 100, l * 100];
}

// Sort images by color (hue first, then saturation, then lightness)
function sortImagesByColor(images) {
  return images.sort((a, b) => {
    if (!a.colorData || !b.colorData) return 0;
    
    // Sort by hue first (color wheel order)
    if (Math.abs(a.colorData.h - b.colorData.h) > 10) {
      return a.colorData.h - b.colorData.h;
    }
    
    // Then by saturation (more saturated first)
    if (Math.abs(a.colorData.s - b.colorData.s) > 5) {
      return b.colorData.s - a.colorData.s;
    }
    
    // Then by lightness
    return a.colorData.l - b.colorData.l;
  });
}

export default function ContentModal({
  isOpen,
  onClose,
  contentType,
  setContentType,
  isDropdownOpen,
  setIsDropdownOpen,
  libraryImages,
  userImages,
  onImageSelect
}) {
  // All hooks must be called before any early return
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [sortedImages, setSortedImages] = useState([]);
  const [isColorSorting, setIsColorSorting] = useState(false);

  // Load generated images from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('aiGeneratedImages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setGeneratedImages(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading generated images:', error);
    }
  }, []);

  React.useEffect(() => {
    setViewMode('grid');
    setSelectedCategory(null);
  }, [contentType, isOpen]);

  // Extract colors and sort images when libraryImages changes
  React.useEffect(() => {
    if (contentType === 'stock' && libraryImages && libraryImages.length > 0) {
      // Check if we have cached sorted results
      const cacheKey = `sortedImages_${libraryImages.length}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Verify the cache is still valid by checking if image IDs match
          const currentIds = libraryImages.map(img => img.id).sort().join(',');
          const cachedIds = parsed.imageIds;
          
          if (currentIds === cachedIds) {
            setSortedImages(parsed.images);
            setIsColorSorting(false);
            return; // Use cached results
          }
        } catch (error) {
          console.error('Error parsing cached sorted images:', error);
        }
      }
      
      // Only sort if we don't have valid cached results
      setIsColorSorting(true);
      
      // Extract colors for all images
      const extractColors = async () => {
        const imagesWithColors = await Promise.all(
          libraryImages.map(async (image) => {
            const colorData = await extractDominantColor(image.image_url);
            return { ...image, colorData };
          })
        );
        
        const sorted = sortImagesByColor(imagesWithColors);
        setSortedImages(sorted);
        setIsColorSorting(false);
        
        // Cache the results
        const cacheData = {
          images: sorted,
          imageIds: libraryImages.map(img => img.id).sort().join(','),
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      };
      
      extractColors();
    }
  }, [libraryImages, contentType]);

  // Organize images by category
  const categorizedImages = useMemo(() => {
    if (contentType !== 'stock' || !libraryImages) return {};
    const categorized = {};
    Object.keys(CATEGORIES).forEach(category => {
      categorized[category] = [];
    });
    libraryImages.forEach(image => {
      // Use database category if available, otherwise fall back to keyword matching
      const dbCategory = image.category;
      if (dbCategory && categorized[dbCategory]) {
        categorized[dbCategory].push(image);
      } else {
        // Fallback to keyword matching for images without database categories
        let matched = false;
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (image.title && keywords.some(keyword => 
            image.title.toLowerCase().includes(keyword.toLowerCase())
          )) {
            categorized[category].push(image);
            matched = true;
            break;
          }
        }
        if (!matched) {
          // Default to general instead of business
          categorized.general.push(image);
        }
      }
    });
    return categorized;
  }, [libraryImages, contentType]);

  // Get images for selected category or all images
  const imagesToShow = useMemo(() => {
    let images = [];
    if (contentType === 'user') {
      images = userImages || [];
    } else if (contentType === 'stock') {
      if (selectedCategory && categorizedImages[selectedCategory]) {
        images = categorizedImages[selectedCategory];
      } else {
        // Use sorted images for all-photos view
        images = sortedImages.length > 0 ? sortedImages : (libraryImages || []);
      }
    } else if (contentType === 'generated') {
      images = generatedImages || [];
    }
    return images;
  }, [contentType, userImages, selectedCategory, categorizedImages, sortedImages, libraryImages, generatedImages]);

  // Only after all hooks, do early return
  if (!isOpen) return null;

  const renderCategorizedView = () => {
    const hasAnyImages = Object.values(categorizedImages).some(arr => arr.length > 0);
    return (
      <div className="space-y-6">
        {/* Category Grid */}
        <div className="grid grid-cols-4 gap-4 p-4">
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const imageCount = categorizedImages[categoryKey]?.length || 0;
            const isSelected = selectedCategory === categoryKey;
            return (
              <div
                key={categoryKey}
                className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:scale-105 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : category.color
                }`}
                onClick={() => setSelectedCategory(isSelected ? null : categoryKey)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-semibold text-sm text-gray-800 mb-1">
                    {category.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {imageCount} {imageCount === 1 ? 'image' : 'images'}
                  </div>
                </div>
                {/* Preview images */}
                {imageCount > 0 && (
                  <div className="absolute bottom-2 right-2 flex space-x-1">
                    {categorizedImages[categoryKey].slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded border border-white overflow-hidden"
                      >
                        <Image
                          src={img.image_url || img.url || img.image}
                          alt={img.name || img.title || img.content}
                          width={24}
                          height={24}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* No images fallback */}
        {!hasAnyImages && (
          <div className="text-center text-gray-500 py-8">
            No stock photos available. Please upload or add images to your library.
          </div>
        )}
        {/* Selected Category Images */}
        {selectedCategory && categorizedImages[selectedCategory]?.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {CATEGORIES[selectedCategory].icon} {CATEGORIES[selectedCategory].name} Images
              </h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                View All Categories
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 p-4">
              {categorizedImages[selectedCategory].map((image) => (
                <div 
                  key={image.id} 
                  className="cursor-pointer relative aspect-[4/3] group" 
                  onClick={() => {
                    onImageSelect(image);
                    onClose();
                  }}
                >
                  <Image
                    src={image.image_url || image.url}
                    alt={image.name || image.title || 'Stock image'}
                    fill
                    className="rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
            {/* No images in category fallback */}
            {categorizedImages[selectedCategory]?.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No images in this category.
              </div>
            )}
          </div>
        )}
        
        {/* All Images (when no category is selected) */}
        {!selectedCategory && imagesToShow.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                All Stock Photos
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-4 p-4">
              {imagesToShow.map((image) => (
                <div 
                  key={image.id} 
                  className="cursor-pointer relative aspect-[4/3] group" 
                  onClick={() => {
                    onImageSelect(image);
                    onClose();
                  }}
                >
                  <Image
                    src={image.image_url || image.url || image.image}
                    alt={image.name || image.title || image.content || 'Image'}
                    fill
                    className="rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="w-full">
        {contentType === 'stock' && (
          <div className="px-4 mb-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                All Stock Photos ({imagesToShow.length})
              </h3>
              {isColorSorting && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  Sorting by color...
                </div>
              )}
            </div>
          </div>
        )}
        {contentType === 'generated' && (
          <div className="px-4 mb-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Generated Images ({imagesToShow.length})
            </h3>
          </div>
        )}
        {contentType === 'generated' && imagesToShow.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No generated images available. Use AI prompts to generate images.
          </div>
        )}
        <div className="grid grid-cols-4 gap-4 p-4 w-full">
          {imagesToShow.map((image) => (
            <div 
              key={image.id} 
              className="cursor-pointer relative aspect-[4/3] group" 
              onClick={() => {
                onImageSelect(image);
                onClose();
              }}
            >
              <Image
                src={image.image_url || image.url || image.image}
                alt={image.title || image.content || 'Image'}
                fill
                className="rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (contentType === 'stock' && viewMode === 'categorized') {
      return renderCategorizedView();
    }
    return renderGridView();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          width: '90%',
          maxWidth: '1200px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
          }}
        >
          <X size={24} color="#555" />
        </button>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
          <div>
            <div className="flex-1 flex flex-col min-h-0">
              {/* Content Library Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-xs">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                      className="w-full bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 inline-flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      {contentType === 'stock' ? 'Stock Photos' : contentType === 'user' ? 'Your Photos' : 'Generated Images'}
                      <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-100">
                        <ul className="p-1">
                          {contentType !== 'stock' && (
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  setContentType('stock'); 
                                  setIsDropdownOpen(false); 
                                }}
                                className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
                              >
                                Stock Photos
                              </a>
                            </li>
                          )}
                          {contentType !== 'user' && (
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  setContentType('user'); 
                                  setIsDropdownOpen(false); 
                                }}
                                className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
                              >
                                Your Photos
                              </a>
                            </li>
                          )}
                          {contentType !== 'generated' && (
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  setContentType('generated'); 
                                  setIsDropdownOpen(false); 
                                }}
                                className="block px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 text-gray-700 hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
                              >
                                Generated Images
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* View Mode Toggle (only for stock photos) */}
                  {contentType === 'stock' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                          viewMode === 'grid' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="All Photos"
                      >
                        All Photos
                      </button>
                      <button
                        onClick={() => setViewMode('categorized')}
                        className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                          viewMode === 'categorized' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Categories"
                      >
                        Categories
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 