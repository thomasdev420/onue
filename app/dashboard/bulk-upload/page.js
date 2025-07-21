'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, X, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { getSupabase } from '../../../supabaseClient';
import ErrorAlert from '../../components/ErrorAlert';

export default function BulkUploadPage() {
  const { data: session } = useSession();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // File selection handler
  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setError(null);
  }, []);

  // Remove file handler
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload file to storage
  const uploadFileToStorage = async (file) => {
    // Use a default user for development
    const userEmail = session?.user?.email || 'dev-user@example.com';

    const fileExt = file.name.split('.').pop();
    const fileName = `${userEmail}/bulk-upload/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const supabase = getSupabase();
      
      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName);

      return {
        path: fileName,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw error;
    }
  };

  // Main upload process
  const processBulkUpload = async () => {
    console.log('=== BULK UPLOAD STARTED ===');
    console.log('Session:', session);
    console.log('Uploaded files:', uploadedFiles);
    
    // Validation
    if (uploadedFiles.length === 0) {
      console.log('No files selected');
      setError('Please select at least one image to upload.');
      return;
    }

    console.log('Validation passed, setting upload state...');
    // Initialize upload state
    setIsUploading(true);
    setError(null);
    setResults(null);
    setUploadProgress({});
    setOverallProgress(0);
    setCurrentStep('Initializing...');
    
    console.log('Upload state set, should show progress bar now');

    try {
      // Step 1: Upload files to storage
      setCurrentStep('Uploading files to storage...');
      const uploadPromises = uploadedFiles.map(async (file, index) => {
        setUploadProgress(prev => ({ ...prev, [index]: 'uploading' }));
        setCurrentStep(`Uploading ${file.name}...`);
        
        try {
          const uploadResult = await uploadFileToStorage(file);
          setUploadProgress(prev => ({ ...prev, [index]: 'uploaded' }));
          
          // Update progress
          const progressPercent = ((index + 1) / uploadedFiles.length) * 50;
          setOverallProgress(progressPercent);
          
          return {
            url: uploadResult.url,
            title: file.name,
            originalFile: file
          };
        } catch (error) {
          setUploadProgress(prev => ({ ...prev, [index]: 'error' }));
          throw error;
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setOverallProgress(50);
      setCurrentStep('Files uploaded successfully!');

      // Step 2: Process with AI
      setCurrentStep('Processing with AI...');
      setUploadProgress(prev => ({ ...prev, labeling: 'processing' }));

      const response = await fetch('/api/upload-images-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadedImages,
          userId: session?.user?.email || 'dev-user@example.com'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process images');
      }

      const result = await response.json();
      setOverallProgress(100);
      setCurrentStep('Complete!');
      setResults(result);
      setShowResults(true);
      
      // Clear files
      setUploadedFiles([]);
      setUploadProgress({});

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload images');
      setCurrentStep('Error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  // Progress helpers
  const getProgressIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'uploaded':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-purple-500" />;
      default:
        return null;
    }
  };

  const getProgressText = (status) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'uploaded':
        return 'Uploaded';
      case 'error':
        return 'Error';
      case 'processing':
        return 'AI Labeling...';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bulk Image Upload with AI Labeling
            </h1>
            <p className="text-gray-600">
              Upload multiple images and let AI automatically generate detailed labels, categories, and keywords for optimal content matching.
            </p>
          </div>

          {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

          {/* File Upload Area */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop images here or click to browse
              </h3>
              <p className="text-gray-500 mb-4">
                Supports JPG, PNG, GIF, WebP up to 10MB each
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Images
              </label>
            </div>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selected Images ({uploadedFiles.length})
              </h3>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getProgressIcon(uploadProgress[index])}
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {getProgressText(uploadProgress[index])}
                      </span>
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="mb-8">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{currentStep}</span>
                  <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {overallProgress < 50 ? 'Uploading files...' : 
                   overallProgress < 100 ? 'Processing with AI...' : 
                   'Complete!'}
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {uploadedFiles.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => {
                  console.log('BUTTON CLICKED!');
                  alert('Button clicked!');
                  processBulkUpload();
                }}
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload & Label {uploadedFiles.length} Images</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {results && showResults && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-green-900">
                  Upload Complete!
                </h3>
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="text-green-600 hover:text-green-800"
                >
                  {showResults ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {showResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {results.results.summary.successful}
                      </p>
                      <p className="text-sm text-gray-600">Successfully Processed</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {results.results.summary.failed}
                      </p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {results.results.summary.total}
                      </p>
                      <p className="text-sm text-gray-600">Total Images</p>
                    </div>
                  </div>

                  {results.results.successful.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Successfully Labeled Images:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {results.results.successful.map((image, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{image.title}</p>
                            <p className="text-sm text-gray-600">
                              Category: {image.category} • Quality: {image.qualityScore}/100
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.results.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {results.results.errors.map((error, index) => (
                          <div key={index} className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-800">{error.url}</p>
                            <p className="text-xs text-red-600">{error.error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              How AI Labeling Works
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Visual Analysis:</strong> AI examines each image to identify content, objects, and visual elements</p>
              <p>• <strong>Smart Categorization:</strong> Automatically assigns the most relevant category from 25+ options</p>
              <p>• <strong>Keyword Generation:</strong> Creates 10-15 relevant keywords for optimal search matching</p>
              <p>• <strong>Quality Assessment:</strong> Rates image quality and usefulness for content creation</p>
              <p>• <strong>Use Case Identification:</strong> Suggests when and how to best use each image</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 