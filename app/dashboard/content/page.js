'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { supabase } from '../../../supabaseClient';

export default function Content() {
  const { data: session } = useSession();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const { data: images, error } = await supabase
          .from('images')
          .select('id, title, image_url, uploaded_at');

        if (error) throw error;

        const imageUrls = images.map((image) => ({
          id: image.id,
          preview: image.image_url,
          name: image.title,
          uploadedAt: image.uploaded_at,
        }));

        const uniqueImageUrls = Array.from(new Map(imageUrls.map(item => [item.id, item])).values());
        
        setUploadedImages(uniqueImageUrls);
      } catch (error) {
        console.error('Error loading user content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const saveUserContent = async (images, videos) => {
    try {
      localStorage.setItem(
        `userContent_${session?.user?.email}`,
        JSON.stringify({ images, videos })
      );
    } catch (error) {
      console.error('Error saving user content:', error);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      uploadedAt: new Date().toISOString(),
      userId: session?.user?.email
    }));
    const updatedImages = [...uploadedImages, ...newImages];
    setUploadedImages(updatedImages);
    saveUserContent(updatedImages, uploadedVideos);
  };

  const handleVideoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newVideos = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      uploadedAt: new Date().toISOString(),
      userId: session?.user?.email
    }));
    const updatedVideos = [...uploadedVideos, ...newVideos];
    setUploadedVideos(updatedVideos);
    saveUserContent(uploadedImages, updatedVideos);
  };

  const removeImage = (id) => {
    const updatedImages = uploadedImages.filter(img => img.id !== id);
    setUploadedImages(updatedImages);
    saveUserContent(updatedImages, uploadedVideos);
  };

  const removeVideo = (id) => {
    const updatedVideos = uploadedVideos.filter(vid => vid.id !== id);
    setUploadedVideos(updatedVideos);
    saveUserContent(uploadedImages, updatedVideos);
  };

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
        {session && (
            <div className="text-sm text-gray-500">
                Logged in as: {session.user.email}
            </div>
        )}
      </div>

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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Uploaded Content</h2>
        </div>

        {/* Images Preview */}
        {uploadedImages.length > 0 ? (
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={`${image.id}-${index}`} className="relative group aspect-w-1 aspect-h-1">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : !isLoading && (
          <p className="text-gray-500 text-center py-8">No images found.</p>
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

        {uploadedImages.length === 0 && uploadedVideos.length === 0 && !isLoading && (
          <p className="text-gray-500 text-center py-8">No content uploaded yet</p>
        )}
      </div>
    </div>
  );
}