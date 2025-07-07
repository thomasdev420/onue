'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getSupabase } from '../../../supabaseClient';
import { Upload, Instagram, Facebook, Twitter, Linkedin, Youtube, Check, X } from 'lucide-react';
import ErrorAlert from '../../components/ErrorAlert';
import Image from 'next/image';
import MemoryManager from '../components/MemoryManager';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [userImages, setUserImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserImages();
    }
  }, [session, fetchUserImages]);

  const fetchUserImages = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('user_images')
        .select('*')
        .eq('user_id', session.user.email);

      if (error) throw error;
      setUserImages(data || []);
    } catch (error) {
      console.error('Error fetching user images:', error);
      setError('Failed to load your images');
    }
  }, [session?.user?.email]);

  const handleFileUpload = async (event) => {
    if (!session?.user?.email) {
      setError('You must be logged in to upload images.');
      return;
    }

    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          setError('Please upload only image files');
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          setError('File size must be less than 10MB');
          continue;
        }

        const fileName = `${Date.now()}-${file.name}`;
        const supabase = getSupabase();
        const { data, error } = await supabase.storage
          .from('user-content')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-content')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('user_images')
          .insert({
            user_id: session.user.email,
            title: file.name,
            image_url: publicUrl,
            file_size: file.size,
            file_type: file.type
          });

        if (dbError) throw dbError;
      }

      setSuccessMessage('Images uploaded successfully!');
      fetchUserImages(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('user_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setSuccessMessage('Image deleted successfully!');
      fetchUserImages(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete image. Please try again.');
    }
  };

  const socialPlatforms = [
    { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { name: 'Facebook', icon: Facebook, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Twitter', icon: Twitter, color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-gradient-to-r from-blue-600 to-blue-700' },
    { name: 'YouTube', icon: Youtube, color: 'bg-gradient-to-r from-red-500 to-red-600' }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span className="text-sm font-medium">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Image Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Management</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {isUploading ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF up to 10MB each
                </p>
              </label>
            </div>
          </div>

          {userImages.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Your Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {userImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <Image
                      src={image.image_url}
                      alt={image.title}
                      width={256}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social Media Connections */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Social Media Connections</h2>
          
          <div className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                    <platform.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{platform.name}</h3>
                    <p className="text-sm text-gray-500">Connect your account</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(`${platform.name} connection coming soon!`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Memory Management */}
      <MemoryManager />
    </div>
  );
}