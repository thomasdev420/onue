'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../../supabaseClient';
import { uploadPhoto, fetchUserPhotos } from '../../../photoService';

export default function Content() {
  const { data: session } = useSession();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's content when component mounts
  useEffect(() => {
    const loadContent = async () => {
      if (session?.supabaseUserId) {
        try {
          setIsLoading(true);
          // Fetch photos from Supabase using the user ID from the session
          const photos = await fetchUserPhotos(session.supabaseUserId);
          setUploadedImages(photos);
          
          // TODO: Implement video fetching from Supabase
          setUploadedVideos([]);
        } catch (error) {
          console.error('Error loading user content:', error);
          setError('Failed to load content');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadContent();
  }, [session]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    try {
      if (!session?.supabaseUserId) {
        throw new Error('You must be logged in to upload photos');
      }

      for (const file of files) {
        await uploadPhoto(file, session.supabaseUserId);
      }

      // Reload photos after upload
      const photos = await fetchUserPhotos(session.supabaseUserId);
      setUploadedImages(photos);
    } catch (error) {
      console.error('Error uploading photos:', error);
      setError('Failed to upload photos');
    }
  };

  const handleVideoUpload = (event) => {
    // TODO: Implement video upload to Supabase
    setError('Video upload not implemented yet');
  };

  const removeImage = async (path) => {
    try {
      if (!session?.supabaseUserId) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-photos')
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('file_path', path)
        .eq('user_id', session.supabaseUserId);

      if (dbError) throw dbError;

      // Update local state
      setUploadedImages(prev => prev.filter(img => img.path !== path));
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Failed to remove image');
    }
  };

  const removeVideo = (id) => {
    // TODO: Implement video removal from Supabase
    setError('Video removal not implemented yet');
  };

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Content</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Please sign in to access your content.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Content</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Loading your content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Content</h1>
        <div className="text-sm text-gray-500">
          Logged in as: {session.user.email}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={24} className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">Image Upload</h2>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-gray-600">Click to upload images</span>
              <span className="text-sm text-gray-500">or drag and drop</span>
            </label>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <VideoIcon size={24} className="text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Video Upload</h2>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-gray-600">Click to upload videos</span>
              <span className="text-sm text-gray-500">or drag and drop</span>
            </label>
          </div>
        </div>
      </div>

      {/* Display uploaded content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images Grid */}
        {uploadedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.path} className="relative group">
                  <img
                    src={image.url}
                    alt="Uploaded content"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.path)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {uploadedVideos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Videos</h3>
            <div className="grid grid-cols-1 gap-4">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="relative group">
                  <video
                    src={video.url}
                    controls
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 