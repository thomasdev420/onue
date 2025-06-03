'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ContentPage() {
  const { data: session } = useSession();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Files to upload:', selectedFiles);
      
      // Clear selection after "upload"
      setSelectedFiles([]);
    } catch (err) {
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Please sign in to view and upload content.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Content Library</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${selectedFiles.length === 0 || uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-red-600">{error}</p>
        )}

        {selectedFiles.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Placeholder for uploaded content */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Your Content</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Placeholder items */}
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 