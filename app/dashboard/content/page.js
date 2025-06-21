'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { supabase } from '../../../supabaseClient';

// A simple component to display status messages
const StatusMessage = ({ message, type }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-center gap-2 p-3 rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
      {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default function Content() {
  const { data: session, status } = useSession();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });
  const isAuthenticated = status === 'authenticated';

  const showStatus = (message, type = 'success', duration = 3000) => {
    setStatusMessage({ message, type });
    setTimeout(() => setStatusMessage({ message: '', type: '' }), duration);
  };

  useEffect(() => {
    const loadContent = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Load images from user_work table
        const { data: imageWork, error: imageError } = await supabase
          .from('user_work')
          .select('work_data')
          .eq('user_id', session.user.email)
          .eq('page_type', 'content_images')
          .single();

        // Load videos from user_work table
        const { data: videoWork, error: videoError } = await supabase
          .from('user_work')
          .select('work_data')
          .eq('user_id', session.user.email)
          .eq('page_type', 'content_videos')
          .single();

        if (imageError && imageError.code !== 'PGRST116') {
          console.error('Error loading images:', imageError);
        }

        if (videoError && videoError.code !== 'PGRST116') {
          console.error('Error loading videos:', videoError);
        }

        // Set images from database or empty array
        const images = imageWork?.work_data || [];
        const videos = videoWork?.work_data || [];

        setUploadedImages(images);
        setUploadedVideos(videos);
      } catch (error) {
        console.error('Error loading user content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [session?.user?.email, isAuthenticated]);

  const saveContentToDatabase = async (images, videos) => {
    if (!session?.user?.email) return;

    try {
      // Save images
      const { error: imageError } = await supabase
        .from('user_work')
        .upsert({
          user_id: session.user.email,
          page_type: 'content_images',
          work_data: images,
          updated_at: new Date().toISOString()
        });

      if (imageError) throw imageError;

      // Save videos
      const { error: videoError } = await supabase
        .from('user_work')
        .upsert({
          user_id: session.user.email,
          page_type: 'content_videos',
          work_data: videos,
          updated_at: new Date().toISOString()
        });

      if (videoError) throw videoError;

    } catch (error) {
      console.error('Error saving content to database:', error);
      throw error;
    }
  };

  const uploadFileToStorage = async (file, type) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.email}/${Date.now()}.${fileExt}`;
    const bucketName = type === 'image' ? 'user-images' : 'user-videos';

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return {
        path: fileName,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error(`Error uploading ${type} to storage:`, error);
      throw error;
    }
  };

  const handleImageUpload = async (event) => {
    if (!isAuthenticated) {
      return showStatus('You must be logged in to upload.', 'error');
    }
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const newImageUploads = await Promise.all(files.map(async (file) => {
        const uploadResult = await uploadFileToStorage(file, 'image');
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          preview: uploadResult.url,
          path: uploadResult.path,
          uploadedAt: new Date().toISOString(),
          userId: session.user.email,
          size: file.size,
          type: file.type
        };
      }));

      const updatedImages = [...uploadedImages, ...newImageUploads];
      setUploadedImages(updatedImages);
      await saveContentToDatabase(updatedImages, uploadedVideos);
      
      showStatus(`${newImageUploads.length} image(s) uploaded successfully!`);

    } catch (error) {
      console.error('Error uploading images:', error);
      showStatus('Failed to upload images. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (event) => {
    if (!isAuthenticated) {
      return showStatus('You must be logged in to upload.', 'error');
    }
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const newVideoUploads = await Promise.all(files.map(async (file) => {
        const uploadResult = await uploadFileToStorage(file, 'video');
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: uploadResult.url,
          path: uploadResult.path,
          uploadedAt: new Date().toISOString(),
          userId: session.user.email,
          size: file.size,
          type: file.type,
        };
      }));

      const updatedVideos = [...uploadedVideos, ...newVideoUploads];
      setUploadedVideos(updatedVideos);
      await saveContentToDatabase(uploadedImages, updatedVideos);

      showStatus(`${newVideoUploads.length} video(s) uploaded successfully!`);
      
    } catch (error) {
      console.error('Error uploading videos:', error);
      showStatus('Failed to upload videos. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id) => {
    try {
      const imageToRemove = uploadedImages.find(img => img.id === id);
      
      // Remove from storage if it has a path
      if (imageToRemove?.path) {
        await supabase.storage
          .from('user-images')
          .remove([imageToRemove.path]);
      }

      const updatedImages = uploadedImages.filter(img => img.id !== id);
      setUploadedImages(updatedImages);
      await saveContentToDatabase(updatedImages, uploadedVideos);
      showStatus('Image removed successfully.');
    } catch (error) {
      console.error('Error removing image:', error);
      showStatus('Failed to remove image.', 'error');
    }
  };

  const removeVideo = async (id) => {
    try {
      const videoToRemove = uploadedVideos.find(vid => vid.id === id);
      
      // Remove from storage if it has a path
      if (videoToRemove?.path) {
        await supabase.storage
          .from('user-videos')
          .remove([videoToRemove.path]);
      }

      const updatedVideos = uploadedVideos.filter(vid => vid.id !== id);
      setUploadedVideos(updatedVideos);
      await saveContentToDatabase(uploadedImages, updatedVideos);
      showStatus('Video removed successfully.');
    } catch (error) {
      console.error('Error removing video:', error);
      showStatus('Failed to remove video.', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Content</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading your content...</span>
          </div>
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

      <div className="mb-4">
        <StatusMessage message={statusMessage.message} type={statusMessage.type} />
      </div>

      {/* Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={24} className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">Image Upload</h2>
            {uploading && <Loader2 className="animate-spin h-5 w-5 text-blue-500" />}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={uploading || !isAuthenticated}
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${uploading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload images'}
              </span>
              <span className="text-sm text-gray-500">or drag and drop</span>
            </label>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <VideoIcon size={24} className="text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Video Upload</h2>
            {uploading && <Loader2 className="animate-spin h-5 w-5 text-green-500" />}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
              disabled={uploading || !isAuthenticated}
            />
            <label
              htmlFor="video-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${uploading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload videos'}
              </span>
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
        {uploadedImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Images ({uploadedImages.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={`${image.id}-${index}`} className="relative group aspect-w-1 aspect-h-1">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.png'; // Add a placeholder image
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg">
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate">{image.name}</div>
                    {image.size && <div>{formatFileSize(image.size)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Preview */}
        {uploadedVideos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Videos ({uploadedVideos.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="relative group bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <VideoIcon size={24} className="text-gray-400" />
                    <div className="flex-1">
                      <span className="text-gray-600 truncate block">{video.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(video.uploadedAt).toLocaleDateString()}
                        {video.size && ` • ${formatFileSize(video.size)}`}
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