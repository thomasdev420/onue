import React, { useState, useEffect } from 'react';
import { uploadPhoto, fetchUserPhotos } from './photoService';
import { supabase } from './supabaseClient';

export default function ContentTab() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  // Load existing photos when component mounts
  useEffect(() => {
    loadUserPhotos();
  }, []);

  const loadUserPhotos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const photos = await fetchUserPhotos(user.id);
      setUploadedPhotos(photos);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to upload photos');
      }

      const filePath = await uploadPhoto(selectedFile, user.id);
      
      // Reload photos to get the newly uploaded one
      await loadUserPhotos();
      
      setSelectedFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
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

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Photo Library</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${!selectedFile || uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-red-600">{error}</p>
        )}

        {selectedPhotos.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700">
              {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected for slides
            </p>
          </div>
        )}
      </div>

      {/* Display uploaded photos */}
      {uploadedPhotos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Your Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedPhotos.map((photo) => {
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
      )}
    </div>
  );
} 