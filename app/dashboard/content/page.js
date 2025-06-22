'use client';

import { useState, useEffect, useCallback } from 'react';
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
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Content</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Loader2 className="mx-auto animate-spin text-gray-400" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Content</h1>
        {session?.user && (
          <div className="text-sm text-gray-600">
            Logged in as: <strong>{session.user.email}</strong>
          </div>
        )}
      </header>

      {statusMessage.message && <div className="mb-6"><StatusMessage message={statusMessage.message} type={statusMessage.type} /></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="text-gray-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-700">Images ({uploadedImages.length})</h2>
          </div>
          <Dropzone onDrop={onImageDrop} acceptedFileType="image" Icon={Upload} label="Click to upload images" uploading={uploading} />
        </div>

        {/* Video Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <VideoIcon className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-700">Video Upload</h2>
          </div>
          <Dropzone onDrop={onVideoDrop} acceptedFileType="video" Icon={Upload} label="Click to upload videos" uploading={uploading} />
        </div>
      </div>

      {/* Uploaded Content Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Your Uploaded Content</h2>

        {(uploadedImages.length > 0 || uploadedVideos.length > 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...uploadedImages, ...uploadedVideos].map((file) => (
              <div key={file.id} className="group relative rounded-lg overflow-hidden border border-gray-200">
                {file.type.startsWith('image/') ? (
                  <Image src={file.url} alt={file.name} width={200} height={200} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-black flex items-center justify-center">
                    <VideoIcon className="text-white" size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => (file.type.startsWith('image/') ? removeImage(file.id) : removeVideo(file.id))}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                  <div className="text-white text-xs">
                    <p className="font-semibold truncate">{file.name}</p>
                    <p>{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">Your uploaded content will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
} 