'use client';

import React, { useState } from 'react';
import { X, Download, FileImage, Archive } from 'lucide-react';

export default function DownloadModal({ 
  isOpen, 
  onClose, 
  onDownloadSingle, 
  onDownloadAll, 
  onSaveContent,
  slideIndex,
  totalSlides
}) {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.95);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownloadSingle = async () => {
    setIsDownloading(true);
    try {
      await onDownloadSingle(slideIndex, format, quality);
    } finally {
      setIsDownloading(false);
      onClose();
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      await onDownloadAll(format, quality);
    } finally {
      setIsDownloading(false);
      onClose();
    }
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      await onSaveContent();
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Download Slide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('png')}
              className={`p-3 rounded-xl border-2 transition-all ${
                format === 'png'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                <span className="font-medium">PNG</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">High quality</p>
            </button>
            <button
              onClick={() => setFormat('jpeg')}
              className={`p-3 rounded-xl border-2 transition-all ${
                format === 'jpeg'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                <span className="font-medium">JPEG</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Smaller file</p>
            </button>
          </div>
        </div>

        {/* Quality Selection (for JPEG) */}
        {format === 'jpeg' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Save Content */}
          <button
            onClick={handleSaveContent}
            disabled={isSaving}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Content
              </>
            )}
          </button>

          {/* Download Single Slide */}
          <button
            onClick={handleDownloadSingle}
            disabled={isDownloading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Slide {slideIndex + 1}
              </>
            )}
          </button>

          {/* Download All Slides */}
          {totalSlides > 1 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Download All {totalSlides} Slides (ZIP)
                </>
              )}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Downloads exactly what you see on screen, ready for social media sharing.
          </p>
        </div>
      </div>
    </div>
  );
} 