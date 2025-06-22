'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { supabase } from '../../../supabaseClient';
import { usePersistence } from '../../services/persistenceService';

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
  const { data: uploadedImages, updateData: setUploadedImages } = usePersistence('userImages', []);
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
        
        // Videos are loaded separately and not part of the persistence hook for now.
        const { data: videoWork, error: videoError } = await supabase
          .from('user_work')
          .select('work_data')
          .eq('user_id', session.user.email)
          .eq('page_type', 'content_videos')
          .single();

        if (videoError && videoError.code !== 'PGRST116') {
          console.error('Error loading videos:', videoError);
        }

        const videos = videoWork?.work_data || [];
        setUploadedVideos(videos);
      } catch (error) {
        console.error('Error loading user content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [session?.user?.email, isAuthenticated]);

  const saveVideosToDatabase = async (videos) => {
    if (!session?.user?.email) return;

    try {
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
          url: uploadResult.url,
          path: uploadResult.path,
          uploadedAt: new Date().toISOString(),
          userId: session.user.email,
          size: file.size,
          type: file.type
        };
      }));

      setUploadedImages(prev => [...prev, ...newImageUploads]);
      
      showStatus(`${newImageUploads.length} image(s) uploaded successfully!`);

    } catch (error) {
      const errorMessage = error?.message || 'Please check the browser console for more details.';
      console.error('Error uploading images:', error);
      showStatus(`Failed to upload images: ${errorMessage}`, 'error');
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
      await saveVideosToDatabase(updatedVideos);

      showStatus(`${newVideoUploads.length} video(s) uploaded successfully!`);
      
    } catch (error) {
      const errorMessage = error?.message || 'Please check the browser console for more details.';
      console.error('Error uploading videos:', error);
      showStatus(`Failed to upload videos: ${errorMessage}`, 'error');
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
      showStatus('Image removed successfully.');
    } catch (error) {
      const errorMessage = error?.message || 'An unknown error occurred.';
      console.error('Error removing image:', error);
      showStatus(`Failed to remove image: ${errorMessage}`, 'error');
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
      await saveVideosToDatabase(updatedVideos);
      showStatus('Video removed successfully.');
    } catch (error) {
      const errorMessage = error?.message || 'An unknown error occurred.';
      console.error('Error removing video:', error);
      showStatus(`Failed to remove video: ${errorMessage}`, 'error');
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Images ({uploadedImages.length})</h2>
            </div>
            <label className="text-sm font-medium text-white bg-[#ff4514] hover:bg-[#ff4514]/90 px-4 py-2 rounded-lg cursor-pointer transition-colors">
              Upload Image
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map(image => (
              <div key={image.id} className="group relative aspect-w-1 aspect-h-1">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => removeImage(image.id)} className="p-2 bg-white/80 rounded-full text-gray-800 hover:bg-white">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
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