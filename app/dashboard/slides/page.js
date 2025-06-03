"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../../supabaseClient';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ASPECT_RATIOS = {
  tiktok: { width: 9, height: 16 }, // 9:16 for TikTok
  instagram: { width: 9, height: 16 }, // 9:16 for Instagram Reels
  youtube: { width: 16, height: 9 }, // 16:9 for YouTube Shorts
  square: { width: 1, height: 1 }, // 1:1 for Instagram Posts
};

export default function SlidesPage() {
  const { data: session } = useSession();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [crop, setCrop] = useState(ASPECT_RATIOS.tiktok);
  const [currentAspectRatio, setCurrentAspectRatio] = useState('tiktok');
  const [croppedImage, setCroppedImage] = useState(null);

  useEffect(() => {
    if (session?.user) {
      loadUserPhotos();
    }
  }, [session]);

  const loadUserPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('file_path')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const photosWithUrls = data.map(photo => ({
        path: photo.file_path,
        url: supabase.storage.from('user-photos').getPublicUrl(photo.file_path).data.publicUrl
      }));

      setPhotos(photosWithUrls);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (photo) => {
    setSelectedPhoto(photo);
    setCrop(ASPECT_RATIOS[currentAspectRatio]);
  };

  const handleAspectRatioChange = (ratio) => {
    setCurrentAspectRatio(ratio);
    setCrop(ASPECT_RATIOS[ratio]);
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    if (selectedPhoto) {
      const image = new Image();
      image.src = selectedPhoto.url;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        
        setCroppedImage(canvas.toDataURL('image/jpeg'));
      };
    }
  };

  const handleSaveCrop = async () => {
    if (!croppedImage) return;

    try {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      // Create a new file name with the aspect ratio
      const fileName = `${selectedPhoto.path.split('/').pop().split('.')[0]}_${currentAspectRatio}.jpg`;
      const filePath = `${session.user.id}/${fileName}`;

      // Upload the cropped image
      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Save metadata
      const { error: dbError } = await supabase
        .from('photos')
        .insert([{ 
          user_id: session.user.id, 
          file_path: filePath,
          aspect_ratio: currentAspectRatio 
        }]);

      if (dbError) throw dbError;

      // Reload photos
      await loadUserPhotos();
      setSelectedPhoto(null);
      setCroppedImage(null);
    } catch (err) {
      console.error('Error saving cropped image:', err);
      setError('Failed to save cropped image');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Slides</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your photos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No photos found. Upload some photos in the Content tab first!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {photos.map((photo, index) => (
                <div 
                  key={photo.path} 
                  className="relative aspect-square group cursor-pointer bg-gray-100 rounded-lg overflow-hidden"
                  onClick={() => handlePhotoSelect(photo)}
                >
                  <img
                    src={photo.url}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-white text-sm font-medium">Slide {index + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cropping Modal */}
            {selectedPhoto && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
                  <h2 className="text-xl font-semibold mb-4">Crop Image</h2>
                  
                  {/* Aspect Ratio Selector */}
                  <div className="flex gap-2 mb-4">
                    {Object.keys(ASPECT_RATIOS).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => handleAspectRatioChange(ratio)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          currentAspectRatio === ratio
                            ? 'bg-[#ff4514] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {ratio.charAt(0).toUpperCase() + ratio.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Crop Area */}
                  <div className="mb-4">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={handleCropComplete}
                      aspect={ASPECT_RATIOS[currentAspectRatio].width / ASPECT_RATIOS[currentAspectRatio].height}
                    >
                      <img src={selectedPhoto.url} alt="Crop" className="max-h-[60vh]" />
                    </ReactCrop>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setSelectedPhoto(null);
                        setCroppedImage(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCrop}
                      className="px-4 py-2 bg-[#ff4514] text-white rounded-lg hover:bg-[#e63e12]"
                    >
                      Save Crop
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 