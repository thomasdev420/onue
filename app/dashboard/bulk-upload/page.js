'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, X, Check, AlertCircle, Loader2, Eye, EyeOff, Image, Trash2, Download, Filter, Search, Grid, List } from 'lucide-react';
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
  
  // Saved content state
  const [savedContent, setSavedContent] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('slides');
  const [showSavedContent, setShowSavedContent] = useState(true);

  // Load saved content on component mount
  useEffect(() => {
    loadSavedContent();
  }, [selectedContentType]);

  const loadSavedContent = async () => {
    try {
      setIsLoadingContent(true);
      const userEmail = session?.user?.email || 'dev-user@example.com';
      
      const response = await fetch(`/api/save-user-content?userEmail=${userEmail}&contentType=${selectedContentType}`);
      if (!response.ok) {
        throw new Error('Failed to load saved content');
      }
      
      const data = await response.json();
      setSavedContent(data.content || []);
    } catch (error) {
      console.error('Error loading saved content:', error);
      setError('Failed to load saved content');
    } finally {
      setIsLoadingContent(false);
    }
  };

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
    const userEmail = session?.user?.email || 'dev-user@example.com';
    const fileExt = file.name.split('.').pop();
    const fileName = `${userEmail}/bulk-upload/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

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
    if (uploadedFiles.length === 0) {
      setError('Please select at least one image to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResults(null);
    setUploadProgress({});
    setOverallProgress(0);
    setCurrentStep('Initializing...');

    try {
      // Step 1: Upload files to storage
      setCurrentStep('Uploading files to storage...');
      const uploadPromises = uploadedFiles.map(async (file, index) => {
        setUploadProgress(prev => ({ ...prev, [index]: 'uploading' }));
        setCurrentStep(`Uploading ${file.name}...`);
        
        try {
          const uploadResult = await uploadFileToStorage(file);
          setUploadProgress(prev => ({ ...prev, [index]: 'uploaded' }));
          
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
      
      // Clear files and reload saved content
      setUploadedFiles([]);
      setUploadProgress({});
      await loadSavedContent();

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

  // Filter saved content
  const filteredContent = savedContent.filter(content => {
    const contentData = content.content_data;
    const matchesSearch = !searchTerm || 
      contentData.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contentData.slides?.some(slide => 
        slide.texts?.some(text => 
          text.content?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    
    return matchesSearch;
  });

  // Get unique content types
  const contentTypes = ['slides', 'videos', 'text', 'memes'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bulk Image Upload
          </h1>
          <p className="text-lg text-gray-600">
            Upload multiple images and let AI automatically categorize them
          </p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Upload Images</h2>
            <div className="text-sm text-gray-500">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
            </div>
          </div>

          {/* File Upload Area */}
          <div className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 transition-all duration-300 bg-gray-50 hover:bg-gray-100">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              Drop images here or click to browse
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Supports JPG, PNG, GIF, WebP up to 10MB each. AI will automatically categorize your images.
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
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Upload className="w-5 h-5 mr-2" />
              Select Images
            </label>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selected Images ({uploadedFiles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      {getProgressIcon(uploadProgress[index])}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
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
                          className="text-red-500 hover:text-red-700 p-1 rounded"
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
            <div className="mt-8">
              <div className="bg-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{currentStep}</span>
                  <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  {overallProgress < 50 ? 'Uploading files...' : 
                   overallProgress < 100 ? 'Processing with AI...' : 
                   'Complete!'}
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <button
                onClick={processBulkUpload}
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span>Upload & Label {uploadedFiles.length} Images</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {results && showResults && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6">
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
                    <div className="bg-white p-4 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">
                        {results.results.summary.successful}
                      </p>
                      <p className="text-sm text-gray-600">Successfully Processed</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <p className="text-2xl font-bold text-red-600">
                        {results.results.summary.failed}
                      </p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">
                        {results.results.summary.total}
                      </p>
                      <p className="text-sm text-gray-600">Total Images</p>
                    </div>
                  </div>

                  {results.results.successful.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-900 mb-3">Successfully Labeled Images:</h4>
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
                      <h4 className="font-medium text-red-900 mb-3">Errors:</h4>
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
        </div>

        {/* Saved Content Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Your Saved Content</h2>
              <p className="text-gray-600 mt-1">
                {savedContent.length} item{savedContent.length !== 1 ? 's' : ''} in your library
              </p>
            </div>
            <button
              onClick={() => setShowSavedContent(!showSavedContent)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showSavedContent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {showSavedContent && (
            <>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedContentType}
                  onChange={(e) => setSelectedContentType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {contentTypes.map(contentType => (
                    <option key={contentType} value={contentType}>
                      {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Grid/List */}
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading your content...</span>
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                  <p className="text-gray-500">
                    {savedContent.length === 0 ? 'Create some content to get started!' : 'Try adjusting your search or filters.'}
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                  {filteredContent.map((content, index) => {
                    const contentData = content.content_data;
                    return (
                      <div
                        key={index}
                        className={`bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 ${
                          viewMode === 'list' ? 'flex items-center p-4' : ''
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          <>
                            <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 relative flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-4xl mb-2">
                                  {contentData.content_type === 'slides' ? '📊' : 
                                   contentData.content_type === 'videos' ? '🎥' : 
                                   contentData.content_type === 'text' ? '📝' : '🎨'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {contentData.slide_count || contentData.content_type} {contentData.content_type === 'slides' ? 'slides' : 'items'}
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 mb-1 truncate">
                                {contentData.title || 'Untitled'}
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">
                                Type: {contentData.content_type || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(content.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mr-4 flex-shrink-0 flex items-center justify-center">
                              <div className="text-2xl">
                                {contentData.content_type === 'slides' ? '📊' : 
                                 contentData.content_type === 'videos' ? '🎥' : 
                                 contentData.content_type === 'text' ? '📝' : '🎨'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 mb-1 truncate">
                                {contentData.title || 'Untitled'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Type: {contentData.content_type || 'Unknown'}
                                {contentData.slide_count && ` • ${contentData.slide_count} slides`}
                                {` • ${new Date(content.created_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 