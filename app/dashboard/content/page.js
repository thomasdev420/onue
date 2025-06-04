'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Upload, Plus } from 'lucide-react';

export default function ContentPage() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [uploadedContent, setUploadedContent] = useState([]); // { type: 'image'|'video', file: File }
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages(files);
    setError(null);
  };

  const handleVideoSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedVideos(files);
    setError(null);
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0 && selectedVideos.length === 0) {
      setError('Please select at least one file');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newContent = [
        ...selectedImages.map(file => ({ type: 'image', file })),
        ...selectedVideos.map(file => ({ type: 'video', file })),
      ];
      setUploadedContent(prev => [...prev, ...newContent]);
      setSelectedImages([]);
      setSelectedVideos([]);
    } catch (err) {
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Content Library</h2>
      {/* Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Image Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Images</h3>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600">Select images</span>
              </label>
            </div>
            {selectedImages.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-700 font-medium mb-3">
                  {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative aspect-square bg-white rounded-lg overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Video Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <VideoIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Videos</h3>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoSelect}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600">Select videos</span>
              </label>
            </div>
            {selectedVideos.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-purple-700 font-medium mb-3">
                  {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedVideos.map((file, index) => (
                    <div key={index} className="relative aspect-square bg-white rounded-lg overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <VideoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Upload Button */}
      <div className="flex justify-end mb-12">
        <button
          onClick={handleUpload}
          disabled={(selectedImages.length === 0 && selectedVideos.length === 0) || uploading}
          className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2
            ${(selectedImages.length === 0 && selectedVideos.length === 0) || uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload All'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-600">{error}</p>
      )}
      {/* Uploaded Content Section */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-6">Your Content</h3>
        {uploadedContent.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No content uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedContent.map((item, idx) => (
              <div key={idx} className="relative aspect-square bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  {item.type === 'image' ? (
                    <ImageIcon className="w-10 h-10 text-blue-400" />
                  ) : (
                    <VideoIcon className="w-10 h-10 text-purple-400" />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate">
                  {item.file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 