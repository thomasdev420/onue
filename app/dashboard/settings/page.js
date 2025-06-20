'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, X, CreditCard, Pocket, Package, User, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Settings() {
  const { data: session } = useSession();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <div className="h-6 w-px bg-gray-200"></div>
        <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
      </div>
      
      {/* Get Started Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-[#ff4514] rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800">Get Started</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                <CreditCard size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800">Subscription required</h3>
                <p className="text-gray-500 text-sm">Estimated 2–3 minutes</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/#pricing">
                <button className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 font-medium">
                  Upgrade now
                  <span>➔</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 text-gray-700">
                <Pocket size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800">Connect TikTok account</h3>
                <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 font-medium">
                Connect TikTok
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 text-gray-700">
                <Package size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800">Add your first product</h3>
                <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 font-medium">
                Add Product
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                <Upload size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800">Upload product demo video</h3>
                <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 font-medium">
                Upload Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-[#ff4514] rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800">Content Images</h2>
        </div>
        <div 
          className={`
            bg-white border-2 border-dashed rounded-xl p-8 text-center
            ${isDragging ? 'border-[#ff4514] bg-[#ff4514]/5' : 'border-gray-200'}
            transition-colors duration-200
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileInput}
          />
          <label 
            htmlFor="image-upload"
            className="cursor-pointer"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-600">
                <span className="font-medium text-[#ff4514]">Click to upload</span> or drag and drop
              </div>
              <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </label>
        </div>

        {/* Preview Grid */}
        {uploadedImages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Uploaded Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {uploadedImages.map(image => (
                <div key={image.id} className="relative group">
                  <Image
                    src={image.preview}
                    alt="Preview"
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{objectFit: "cover"}}
                    className="rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}