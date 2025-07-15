'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Video as VideoIcon, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { getSupabase } from '../../../supabaseClient';
import { usePersistence } from '../../services/persistenceService';
import { validateFile } from '../../utils/validation';

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

// Reusable Dropzone component
const Dropzone = ({ onDrop, acceptedFileType, Icon, label, uploading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : Array.from(e.target.files);
    const filteredFiles = files.filter(file => file.type.startsWith(acceptedFileType));
    if (filteredFiles.length > 0) {
      onDrop({ target: { files: filteredFiles } });
    }
  }, [acceptedFileType, onDrop]);

  const handleFileChange = (e) => {
    handleDrop(e);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input
        type="file"
        multiple
        accept={`${acceptedFileType}/*`}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'}`}>
          {uploading ? <Loader2 className="animate-spin text-gray-500" size={32} /> : <Icon className="text-gray-500" size={32} />}
        </div>
        <p className="text-gray-600 font-medium">{label}</p>
        <p className="text-sm text-gray-500">or drag and drop</p>
      </div>
    </div>
  );
};

export default function UploadPage() {
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
        const supabase = getSupabase();
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
        showStatus('Error loading content', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [session?.user?.email, isAuthenticated]);

  const saveVideosToDatabase = async (videos) => {
    if (!session?.user?.email) return;

    try {
      const supabase = getSupabase();
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
      const supabase = getSupabase();
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
        // Validate file before upload
        const validation = validateFile(file, 'image');
        if (!validation.success) {
          throw new Error(validation.error);
        }

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

      const successfulUploads = newImageUploads.filter(img => img !== null);
      setUploadedImages(prev => [...prev, ...successfulUploads]);
      showStatus(`Successfully uploaded ${successfulUploads.length} image(s)`);
    } catch (error) {
      console.error('Error uploading images:', error);
      showStatus(error.message || 'Error uploading images', 'error');
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
        // Validate file before upload
        const validation = validateFile(file, 'video');
        if (!validation.success) {
          throw new Error(validation.error);
        }

        const uploadResult = await uploadFileToStorage(file, 'video');
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

      const successfulUploads = newVideoUploads.filter(video => video !== null);
      const updatedVideos = [...uploadedVideos, ...successfulUploads];
      setUploadedVideos(updatedVideos);
      await saveVideosToDatabase(updatedVideos);
      showStatus(`Successfully uploaded ${successfulUploads.length} video(s)`);
    } catch (error) {
      console.error('Error uploading videos:', error);
      showStatus(error.message || 'Error uploading videos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id) => {
    const imageToRemove = uploadedImages.find(img => img.id === id);
    if (!imageToRemove) return;

    try {
      const supabase = getSupabase();
      // Remove from Supabase storage
      const { error: deleteError } = await supabase.storage
        .from('user-images')
        .remove([imageToRemove.path]);

      if (deleteError) {
        console.error("Error deleting image from storage:", deleteError);
        showStatus('Error deleting image from storage', 'error');
        return;
      }

      // Remove from local state and persistence
      setUploadedImages(prev => prev.filter(img => img.id !== id));
      showStatus('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      showStatus('Error removing image', 'error');
    }
  };

  const removeVideo = async (id) => {
    const videoToRemove = uploadedVideos.find(video => video.id === id);
    if (!videoToRemove) return;

    try {
      const supabase = getSupabase();
      // Remove from Supabase storage
      const { error: deleteError } = await supabase.storage
        .from('user-videos')
        .remove([videoToRemove.path]);

      if (deleteError) {
        console.error("Error deleting video from storage:", deleteError);
        showStatus('Error deleting video from storage', 'error');
        return;
      }

      // Remove from local state and database
      const updatedVideos = uploadedVideos.filter(video => video.id !== id);
      setUploadedVideos(updatedVideos);
      await saveVideosToDatabase(updatedVideos);
      showStatus('Video removed successfully');
    } catch (error) {
      console.error('Error removing video:', error);
      showStatus('Error removing video', 'error');
    }
  };

  const onImageDrop = (event) => {
    handleImageUpload(event);
  };

  const onVideoDrop = (event) => {
    handleVideoUpload(event);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Content Upload</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-gray-500" size={32} />
          <span className="ml-2 text-gray-600">Loading your content...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <StatusMessage message={statusMessage.message} type={statusMessage.type} />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Content Upload</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Image Upload */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Images</h2>
          <Dropzone
            onDrop={onImageDrop}
            acceptedFileType="image"
            Icon={ImageIcon}
            label="Upload Images"
            uploading={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPG, PNG, GIF, WebP (max 10MB each)
          </p>
        </div>

        {/* Video Upload */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Videos</h2>
          <Dropzone
            onDrop={onVideoDrop}
            acceptedFileType="video"
            Icon={VideoIcon}
            label="Upload Videos"
            uploading={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: MP4, WebM, OGG, MOV (max 100MB each)
          </p>
        </div>
      </div>

      {/* Uploaded Content Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div
          style={{
            border: '2px solid #e5e7eb',
            borderRadius: '24px',
            boxShadow: '0 4px 24px 0 rgba(57,83,230,0.08)',
            padding: '24px',
            marginBottom: '32px',
            background: 'white',
          }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Images ({uploadedImages.length})</h3>
          {uploadedImages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No images uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{image.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos */}
        <div
          style={{
            border: '2px solid #e5e7eb',
            borderRadius: '24px',
            boxShadow: '0 4px 24px 0 rgba(57,83,230,0.08)',
            padding: '24px',
            marginBottom: '32px',
            background: 'white',
          }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Videos ({uploadedVideos.length})</h3>
          {uploadedVideos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No videos uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {uploadedVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg group">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <VideoIcon className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{video.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(video.size)}</p>
                  </div>
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 