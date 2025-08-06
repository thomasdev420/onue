import { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Globe, Loader2, Upload, SkipForward, Video, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { saveUserWork } from '../services/persistenceService';

const ONBOARDING_STEPS = {
  URL_INPUT: 'url_input',
  SCANNING: 'scanning',
  CONFIRMATION: 'confirmation',
  MEDIA_UPLOAD: 'media_upload',
  VIDEO_CREATION: 'video_creation'
};

const VIDEO_FORMATS = [
  {
    id: 'ugc',
    name: 'UGC-style',
    description: 'User-generated content style videos',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'veo3',
    name: 'Veo 3-style',
    description: 'Advanced AI-generated video format',
    icon: <Video className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500'
  }
];

export default function WebsiteOnboardingModal({ open, onClose, onComplete }) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.URL_INPUT);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(open);

  useEffect(() => {
    setShow(open);
    if (open) {
      setCurrentStep(ONBOARDING_STEPS.URL_INPUT);
      setWebsiteUrl('');
      setExtractedData(null);
      setErrors({});
      setScanProgress(0);
    }
  }, [open]);

  const validateUrl = (url) => {
    if (!url) return 'Website URL is required';
    
    let normalizedUrl = url.trim();
    
    // If URL doesn't start with http:// or https://, add https://
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    try {
      new URL(normalizedUrl);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const simulateWebsiteScan = async (url) => {
    setIsLoading(true);
    setCurrentStep(ONBOARDING_STEPS.SCANNING);
    
    // Simulate scanning progress
    const steps = [
      { progress: 20, message: 'Fetching product information...' },
      { progress: 40, message: 'Generating product page...' },
      { progress: 60, message: 'Extracting key details...' },
      { progress: 80, message: 'Analyzing content...' },
      { progress: 100, message: 'Scan complete!' }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setScanProgress(steps[i].progress);
    }

    // Simulate extracted data
    const mockData = {
      companyName: 'TechCorp Solutions',
      productType: 'SaaS Platform',
      productInfo: 'Advanced analytics and reporting platform for businesses',
      companyUrl: url,
      logo: null,
      images: []
    };

    setExtractedData(mockData);
    setIsLoading(false);
    setCurrentStep(ONBOARDING_STEPS.CONFIRMATION);
  };

  const handleUrlSubmit = async () => {
    const error = validateUrl(websiteUrl);
    if (error) {
      setErrors({ url: error });
      return;
    }

    setErrors({});
    
    // Normalize the URL before scanning
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    await simulateWebsiteScan(normalizedUrl);
  };

  const handleDataUpdate = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkipMedia = () => {
    setCurrentStep(ONBOARDING_STEPS.VIDEO_CREATION);
  };

  const handleComplete = async (selectedFormat) => {
    try {
      // Save onboarding data
      const onboardingData = {
        websiteUrl,
        extractedData,
        selectedVideoFormat: selectedFormat,
        completedAt: new Date().toISOString()
      };

      if (session?.user?.email) {
        await saveUserWork(session.user.email, 'onboarding', onboardingData);
      }

      setShow(false);
      if (onComplete) onComplete(onboardingData);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Still close the modal even if save fails
      setShow(false);
      if (onComplete) onComplete({ websiteUrl, extractedData, selectedVideoFormat: selectedFormat });
    }
  };

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 relative">
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 text-center pr-8">
            {currentStep === ONBOARDING_STEPS.URL_INPUT && "Website Setup"}
            {currentStep === ONBOARDING_STEPS.SCANNING && "Scanning Website"}
            {currentStep === ONBOARDING_STEPS.CONFIRMATION && "Review Information"}
            {currentStep === ONBOARDING_STEPS.MEDIA_UPLOAD && "Add Media"}
            {currentStep === ONBOARDING_STEPS.VIDEO_CREATION && "Choose Format"}
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* URL Input Step */}
          {currentStep === ONBOARDING_STEPS.URL_INPUT && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter your website URL</h3>
                <p className="text-gray-600">We'll automatically fetch key product data to accelerate your setup</p>
              </div>

              <div>
                <input
                  type="url"
                  className={`w-full border-2 rounded-xl px-5 py-4 focus:outline-none focus:ring-4 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base ${
                    errors.url 
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-50' 
                      : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                  }`}
                  placeholder="apple.com or https://yourcompany.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  autoFocus
                />
                {errors.url && (
                  <p className="text-red-500 text-sm mt-2">{errors.url}</p>
                )}
              </div>

              <button
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={handleUrlSubmit}
                disabled={!websiteUrl.trim()}
              >
                <ChevronRight className="w-5 h-5" />
                Start Scanning
              </button>
            </div>
          )}

          {/* Scanning Step */}
          {currentStep === ONBOARDING_STEPS.SCANNING && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scanning your website</h3>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              
              <p className="text-gray-600">
                {scanProgress < 20 && 'Fetching product information...'}
                {scanProgress >= 20 && scanProgress < 40 && 'Generating product page...'}
                {scanProgress >= 40 && scanProgress < 60 && 'Extracting key details...'}
                {scanProgress >= 60 && scanProgress < 80 && 'Analyzing content...'}
                {scanProgress >= 80 && 'Scan complete!'}
              </p>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === ONBOARDING_STEPS.CONFIRMATION && extractedData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Review your information</h3>
                <p className="text-gray-600">Please review and edit the extracted information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-50"
                    value={extractedData.companyName}
                    onChange={(e) => handleDataUpdate('companyName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-50"
                    value={extractedData.productType}
                    onChange={(e) => handleDataUpdate('productType', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Info</label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-50"
                    rows="3"
                    value={extractedData.productInfo}
                    onChange={(e) => handleDataUpdate('productInfo', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company URL</label>
                  <input
                    type="url"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-50"
                    value={extractedData.companyUrl}
                    onChange={(e) => handleDataUpdate('companyUrl', e.target.value)}
                  />
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() => setCurrentStep(ONBOARDING_STEPS.MEDIA_UPLOAD)}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Media Upload Step */}
          {currentStep === ONBOARDING_STEPS.MEDIA_UPLOAD && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Add your media</h3>
                <p className="text-gray-600">Upload images, logos, and videos to enhance your content</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Drag and drop your files here, or click to browse</p>
                <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Choose Files
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  onClick={handleSkipMedia}
                >
                  <SkipForward className="w-4 h-4" />
                  Skip for now
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setCurrentStep(ONBOARDING_STEPS.VIDEO_CREATION)}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Video Creation Step */}
          {currentStep === ONBOARDING_STEPS.VIDEO_CREATION && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-orange-600 mx-auto mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create your first video</h3>
                <p className="text-gray-600">Choose a format to get started with video creation</p>
              </div>

              <div className="grid gap-4">
                {VIDEO_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
                    onClick={() => handleComplete(format.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${format.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        {format.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{format.name}</h4>
                        <p className="text-gray-600 text-sm">{format.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 