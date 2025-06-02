'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

export default function Slides() {
  const [userPhotos, setUserPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's photos when component mounts
  useEffect(() => {
    loadUserPhotos();
  }, []);

  const loadUserPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        throw new Error('You must be logged in to view photos');
      }

      // Get photos from the database
      const { data, error: photosError } = await supabase
        .from('photos')
        .select('file_path')
        .eq('user_id', user.id);

      if (photosError) throw photosError;
      if (!data || data.length === 0) {
        setUserPhotos([]);
        return;
      }

      // Get public URLs for all photos
      const photos = data.map(photo => ({
        path: photo.file_path,
        url: supabase.storage.from('user-photos').getPublicUrl(photo.file_path).data.publicUrl
      }));

      setUserPhotos(photos);
    } catch (error) {
      console.error('Error loading photos:', error);
      setError(error.message);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading your photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={loadUserPhotos}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create Slides</h1>
        <p className="text-gray-600 mt-2">
          Select photos from your content to create slides for TikTok or Instagram
        </p>
      </div>

      {/* Photo Selection Grid */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Photos</h2>
          {selectedPhotos.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {userPhotos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No photos found. Upload some photos in the Content tab first.</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Selected Photos Preview */}
      {selectedPhotos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Selected Photos Preview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedPhotos.map((photo, index) => (
              <div key={photo.path} className="relative">
                <div className="aspect-[9/16] relative">
                  <img
                    src={photo.url}
                    alt={`Selected photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    Slide {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 