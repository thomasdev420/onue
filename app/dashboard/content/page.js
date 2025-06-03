'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { supabase } from '../../../supabaseClient';

export default function Content() {
  const { data: session } = useSession();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's content when component mounts
  useEffect(() => {
    const loadContent = async () => {
      if (session?.user) {
        try {
          setIsLoading(true);
          setError(null);

          // Fetch photos from Supabase
          const { data: photos, error: photosError } = await supabase
            .from('photos')
            .select('file_path')
            .eq('user_id', session.user.id);

          if (photosError) throw photosError;

          // Generate URLs for photos
          const imagesWithUrls = photos.map(photo => ({
            id: photo.file_path,
            path: photo.file_path,
            url: supabase.storage.from('user-photos').getPublicUrl(photo.file_path).data.publicUrl,
            name: photo.file_path.split('/').pop(),
            uploadedAt: new Date().toISOString()
          }));

          setUploadedImages(imagesWithUrls);
        } catch (error) {
          console.error('Error loading content:', error);
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadContent();
  }, [session]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    setError(null);

    try {
      for (const file of files) {
        // Upload to Supabase Storage
        const filePath = `${session.user.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('photos')
          .insert([{ 
            user_id: session.user.id, 
            file_path: filePath 
          }]);

        if (dbError) throw dbError;

        // Add to local state
        const newImage = {
          id: filePath,
          path: filePath,
          url: supabase.storage.from('user-photos').getPublicUrl(filePath).data.publicUrl,
          name: file.name,
          uploadedAt: new Date().toISOString()
        };

        setUploadedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message);
    }
  };

  const handleVideoUpload = async (event) => {
    const files = Array.from(event.target.files);
    setError(null);

    try {
      for (const file of files) {
        // Upload to Supabase Storage
        const filePath = `${session.user.id}/videos/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-videos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('videos')
          .insert([{ 
            user_id: session.user.id, 
            file_path: filePath 
          }]);

        if (dbError) throw dbError;

        // Add to local state
        const newVideo = {
          id: filePath,
          path: filePath,
          name: file.name,
          uploadedAt: new Date().toISOString()
        };

        setUploadedVideos(prev => [...prev, newVideo]);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setError(error.message);
    }
  };

  const removeImage = async (id) => {
    try {
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('user-photos')
        .remove([id]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('file_path', id);

      if (dbError) throw dbError;

      // Update local state
      setUploadedImages(prev => prev.filter(img => img.id !== id));
    } catch (error) {
      console.error('Error removing image:', error);
      setError(error.message);
    }
  };

  const removeVideo = async (id) => {
    try {
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('user-videos')
        .remove([id]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('file_path', id);

      if (dbError) throw dbError;

      // Update local state
      setUploadedVideos(prev => prev.filter(vid => vid.id !== id));
    } catch (error) {
      console.error('Error removing video:', error);
      setError(error.message);
    }
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

      {/* Uploaded Content Preview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Uploaded Content</h2>
        
        {/* Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  <div className="mt-2 text-sm text-gray-600 truncate">{image.name}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(image.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Preview */}
        {uploadedVideos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Videos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="relative group bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <VideoIcon size={24} className="text-gray-400" />
                    <div className="flex-1">
                      <span className="text-gray-600 truncate block">{video.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(video.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => removeVideo(video.id)}
                      className="ml-auto bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length === 0 && uploadedVideos.length === 0 && (
          <p className="text-gray-500 text-center py-8">No content uploaded yet</p>
        )}
      </div>
    </div>
  );
} 