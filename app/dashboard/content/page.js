'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Content() {
  const { data: session } = useSession();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's content when component mounts
  useEffect(() => {
    const loadContent = async () => {
      if (session?.user) {
        try {
          setIsLoading(true);
          // Here you would typically fetch the user's content from your backend
          // For now, we'll use localStorage as a temporary solution
          const userContent = localStorage.getItem(`userContent_${session.user.email}`);
          if (userContent) {
            const { images, videos } = JSON.parse(userContent);
            setUploadedImages(images);
            setUploadedVideos(videos);
          }
        } catch (error) {
          console.error('Error loading user content:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadContent();
  }, [session]);

  const saveUserContent = async (images, videos) => {
    try {
      // Here you would typically save to your backend
      // For now, we'll use localStorage as a temporary solution
      localStorage.setItem(
        `userContent_${session.user.email}`,
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Uploaded Content</h2>
        
        {/* Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <Image
                    src={image.preview}
                    alt={image.name}
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{objectFit: "cover"}}
                    className="rounded-lg"
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