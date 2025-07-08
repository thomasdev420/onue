'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Upload, Download, Trash2, Settings } from 'lucide-react';

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      const newAvatars = files.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      }));
      
      setAvatars(prev => [...prev, ...newAvatars]);
      setIsUploading(false);
    }, 2000);
  };

  const handleDeleteAvatar = (id) => {
    setAvatars(prev => prev.filter(avatar => avatar.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Avatar Generator</h1>
        <p className="text-gray-600">Upload and manage your AI avatars for content creation</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ImagePlus className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Upload New Avatars</h2>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Upload images to create AI avatars for your content
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Choose Files
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          {isUploading && (
            <p className="text-blue-600 mt-2">Uploading...</p>
          )}
        </div>
      </div>

      {/* Avatars Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Avatars</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Settings className="w-4 h-4" />
            <span>{avatars.length} avatars</span>
          </div>
        </div>

        {avatars.length === 0 ? (
          <div className="text-center py-12">
            <ImagePlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No avatars uploaded yet</p>
            <p className="text-gray-400 text-sm">Upload some images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {avatars.map((avatar) => (
              <div key={avatar.id} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    src={avatar.url}
                    alt={avatar.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-xl flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <button className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAvatar(avatar.id)}
                      className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 truncate">{avatar.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 