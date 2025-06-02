'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';

export default function Slides() {
  const [userPhotos, setUserPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Load user's photos when component mounts
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setIsCheckingAuth(true);
      setError(null);

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to check authentication status');
      }
      
      if (!session) {
        // If no session, redirect to login
        router.push('/login');
        return;
      }

      // If we have a session, load the photos
      await loadUserPhotos(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      setError(error.message);
    } finally {
      setIsCheckingAuth(false);
      setLoading(false);
    }
  };

  const loadUserPhotos = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get photos from the database
      const { data, error: photosError } = await supabase
        .from('photos')
        .select('file_path')
        .eq('user_id', userId);

      if (photosError) {
        console.error('Database error:', photosError);
        throw new Error('Failed to load photos from database');
      }

      if (!data || data.length === 0) {
        setUserPhotos([]);
        return;
      }

      // Get public URLs for all photos
      const photos = await Promise.all(data.map(async (photo) => {
        try {
          const { data: urlData } = supabase.storage
            .from('user-photos')
            .getPublicUrl(photo.file_path);

          if (!urlData?.publicUrl) {
            console.warn('No public URL for photo:', photo.file_path);
            return null;
          }

          return {
            path: photo.file_path,
            url: urlData.publicUrl
          };
        } catch (error) {
          console.error('Error getting URL for photo:', photo.file_path, error);
          return null;
        }
      }));

      // Filter out any null values from failed URL generations
      const validPhotos = photos.filter(photo => photo !== null);
      setUserPhotos(validPhotos);

    } catch (error) {
      console.error('Error loading photos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photo) => {
    if (!photo?.path || !photo?.url) {
      console.error('Invalid photo object:', photo);
      return;
    }

    setSelectedPhotos(prev => {
      const isSelected = prev.some(p => p.path === photo.path);
      if (isSelected) {
        return prev.filter(p => p.path !== photo.path);
      } else {
        return [...prev, photo];
      }
    });
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching photos
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading your photos...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={checkUser}
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
              if (!photo?.url) return null; // Skip invalid photos
              
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
                    onError={(e) => {
                      console.error('Error loading image:', photo.url);
                      e.target.src = '/placeholder-image.png'; // You might want to add a placeholder image
                    }}
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
                    onError={(e) => {
                      console.error('Error loading preview image:', photo.url);
                      e.target.src = '/placeholder-image.png';
                    }}
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