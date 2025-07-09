import { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Globe, Loader2, Upload, SkipForward, Video, Sparkles, Target, User, Building, Briefcase, Star, Clock, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { saveUserWork } from '../services/persistenceService';
import { scanWebsite, validateWebsiteUrl, getScanningSteps } from '../services/websiteScanService';
import { validateUserData, sanitizeText } from '../utils/validation';

const ONBOARDING_STEPS = {
  URL_INPUT: 'url_input',
  SCANNING: 'scanning',
  CONFIRMATION: 'confirmation',
  PERSONALIZATION: 'personalization',
  MEDIA_UPLOAD: 'media_upload',
  VIDEO_CREATION: 'video_creation'
};

// Personalization questions from the original UserOnboardingModal
const PERSONALIZATION_QUESTIONS = [
  {
    key: 'interests',
    label: 'What are your main interests?',
    placeholder: 'e.g. marketing, memes, AI',
    type: 'text',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'This helps us suggest relevant content and features',
    maxLength: 200
  },
  {
    key: 'goals',
    label: 'What is your main goal using this app?',
    placeholder: 'e.g. Grow my TikTok following',
    type: 'text',
    icon: <Target className="w-5 h-5" />,
    description: 'We\'ll tailor your experience to help you achieve this',
    maxLength: 300
  },
  {
    key: 'role',
    label: 'What is your role?',
    placeholder: 'e.g. Founder, Marketer, Creator',
    type: 'text',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'This helps us customize your dashboard and tools',
    maxLength: 100
  },
  {
    key: 'experienceLevel',
    label: 'What is your experience level?',
    type: 'select',
    icon: <Star className="w-5 h-5" />,
    description: 'We\'ll adjust the complexity of features accordingly',
    options: ['Beginner', 'Intermediate', 'Expert'],
  },
  {
    key: 'timeCommitment',
    label: 'How much time can you dedicate weekly?',
    type: 'select',
    icon: <Clock className="w-5 h-5" />,
    description: 'This helps us suggest realistic content creation schedules',
    options: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'],
  },
  {
    key: 'targetAudience',
    label: 'Who is your target audience?',
    placeholder: 'e.g. young professionals, small business owners',
    type: 'text',
    icon: <Users className="w-5 h-5" />,
    description: 'This helps us tailor content suggestions and AI prompts',
    maxLength: 200
  },
];

const VIDEO_FORMATS = [
  {
    id: 'ugc',
    name: 'UGC-style',
    description: 'User-generated content style videos',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'veo3',
    name: 'Veo 3-style',
    description: 'Advanced AI-generated video format',
    icon: <Video className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500'
  }
];

export default function WebsiteOnboarding({ open, onClose, onComplete }) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.URL_INPUT);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [personalizationAnswers, setPersonalizationAnswers] = useState({});
  const [personalizationStep, setPersonalizationStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(open);

  useEffect(() => {
    setShow(open);
    if (open) {
      setCurrentStep(ONBOARDING_STEPS.URL_INPUT);
      setWebsiteUrl('');
      setExtractedData(null);
      setPersonalizationAnswers({});
      setPersonalizationStep(0);
      setErrors({});
      setScanProgress(0);
    }
  }, [open]);

  const validateUrl = (url) => {
    const validation = validateWebsiteUrl(url);
    return validation.valid ? null : validation.error;
  };

  const simulateWebsiteScan = async (url) => {
    setIsLoading(true);
    setCurrentStep(ONBOARDING_STEPS.SCANNING);
    
    // Start with realistic progress simulation
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (currentProgress < 85) { // Cap at 85% until API completes
        currentProgress += Math.random() * 3 + 1; // Random increment between 1-4%
        setScanProgress(Math.min(currentProgress, 85));
      }
    }, 200); // Update every 200ms for smooth animation

    // Real scraping API call (pages/api)
    try {
      const res = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
      if (!res.ok) {
        const err = await res.json();
        setErrors({ scan: err.error || 'Failed to scan website.' });
        setCurrentStep(ONBOARDING_STEPS.URL_INPUT);
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      setExtractedData(data);
      
      // Jump to 100% when scan completes successfully
      setScanProgress(100);
      
      // Brief pause to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep(ONBOARDING_STEPS.CONFIRMATION);
    } catch (e) {
      // Clear the progress interval on error
      clearInterval(progressInterval);
      
      setErrors({ scan: 'Failed to scan website.' });
      setCurrentStep(ONBOARDING_STEPS.URL_INPUT);
    }
    setIsLoading(false);
  };

  const handleUrlSubmit = async () => {
    const validation = validateWebsiteUrl(websiteUrl);
    if (!validation.valid) {
      setErrors({ url: validation.error });
      return;
    }

    setErrors({});
    // Use the normalized URL for the scan
    await simulateWebsiteScan(validation.normalizedUrl);
  };

  const handleUrlChange = (e) => {
    setWebsiteUrl(e.target.value);
    // Clear errors when user starts typing
    if (errors.url || errors.scan) {
      setErrors({});
    }
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
        personalizationAnswers,
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
      if (onComplete) onComplete({ websiteUrl, extractedData, personalizationAnswers, selectedVideoFormat: selectedFormat });
    }
  };

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  // Personalization step functions
  const validatePersonalizationStep = () => {
    const currentQuestion = PERSONALIZATION_QUESTIONS[personalizationStep];
    const currentAnswer = personalizationAnswers[currentQuestion.key];
    const newErrors = { ...errors };

    // Clear previous error for this field
    delete newErrors[currentQuestion.key];

    if (!currentAnswer || currentAnswer.trim() === '') {
      newErrors[currentQuestion.key] = 'This field is required';
    } else if (currentQuestion.type === 'text') {
      const sanitized = sanitizeText(currentAnswer, currentQuestion.maxLength, true);
      if (sanitized !== currentAnswer.trim()) {
        newErrors[currentQuestion.key] = `Invalid characters detected. Maximum ${currentQuestion.maxLength} characters allowed.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePersonalizationChange = (e) => {
    const value = e.target.value;
    const currentQuestion = PERSONALIZATION_QUESTIONS[personalizationStep];
    
    // Sanitize text input (don't trim during typing to allow spaces)
    if (currentQuestion.type === 'text') {
      const sanitized = sanitizeText(value, currentQuestion.maxLength, false);
      setPersonalizationAnswers({ ...personalizationAnswers, [currentQuestion.key]: sanitized });
    } else {
      setPersonalizationAnswers({ ...personalizationAnswers, [currentQuestion.key]: value });
    }

    // Clear error when user starts typing
    if (errors[currentQuestion.key]) {
      setErrors({ ...errors, [currentQuestion.key]: null });
    }
  };

  const handlePersonalizationNext = () => {
    if (!validatePersonalizationStep()) {
      return;
    }

    if (personalizationStep < PERSONALIZATION_QUESTIONS.length - 1) {
      setPersonalizationStep(personalizationStep + 1);
    } else {
      // All personalization questions completed
      setCurrentStep(ONBOARDING_STEPS.MEDIA_UPLOAD);
    }
  };

  const handlePersonalizationKeyPress = (e) => {
    if (e.key === 'Enter' && personalizationAnswers[PERSONALIZATION_QUESTIONS[personalizationStep].key] && !errors[PERSONALIZATION_QUESTIONS[personalizationStep].key]) {
      handlePersonalizationNext();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto relative max-h-[90vh] flex flex-col" style={{overflowY: 'auto'}}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 relative">
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 text-center pr-8">
            {currentStep === ONBOARDING_STEPS.URL_INPUT && ""}
            {currentStep === ONBOARDING_STEPS.SCANNING && ""}
            {currentStep === ONBOARDING_STEPS.CONFIRMATION && ""}
            {currentStep === ONBOARDING_STEPS.PERSONALIZATION && ""}
            {currentStep === ONBOARDING_STEPS.MEDIA_UPLOAD && ""}
            {currentStep === ONBOARDING_STEPS.VIDEO_CREATION && ""}
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
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
                    errors.url || errors.scan
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-50' 
                      : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                  }`}
                  placeholder="Enter your websites address eg somerbysit.co.uk"
                  value={websiteUrl}
                  onChange={handleUrlChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  autoFocus
                />
                {errors.url && (
                  <p className="text-red-500 text-sm mt-2">{errors.url}</p>
                )}
                {errors.scan && (
                  <p className="text-red-500 text-sm mt-2">{errors.scan}</p>
                )}
              </div>
            </div>
          )}

          {/* Scanning Step */}
          {currentStep === ONBOARDING_STEPS.SCANNING && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scanning your website</h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-gray-600">
                {scanProgress < 15 && 'Initializing scan...'}
                {scanProgress >= 15 && scanProgress < 30 && 'Connecting to website...'}
                {scanProgress >= 30 && scanProgress < 50 && 'Fetching product information...'}
                {scanProgress >= 50 && scanProgress < 70 && 'Extracting key details...'}
                {scanProgress >= 70 && scanProgress < 85 && 'Analyzing content...'}
                {scanProgress >= 85 && scanProgress < 100 && 'Finalizing scan...'}
                {scanProgress >= 100 && 'Scan complete!'}
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
            </div>
          )}

          {/* Personalization Step */}
          {currentStep === ONBOARDING_STEPS.PERSONALIZATION && (
            <div className="space-y-6">
              {(() => {
                const q = PERSONALIZATION_QUESTIONS[personalizationStep];
                const currentError = errors[q.key];
                return (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{q.label}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{q.description}</p>
                    </div>
                    <div className="mb-8">
                      {q.type === 'text' && (
                        <div>
                          <input
                            type="text"
                            className={`w-full border-2 rounded-xl px-5 py-4 focus:outline-none focus:ring-4 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base ${
                              currentError 
                                ? 'border-red-400 focus:border-red-400 focus:ring-red-50' 
                                : 'border-gray-200 focus:border-purple-400 focus:ring-purple-50'
                            }`}
                            placeholder={q.placeholder}
                            value={personalizationAnswers[q.key] || ''}
                            onChange={handlePersonalizationChange}
                            onKeyPress={handlePersonalizationKeyPress}
                            maxLength={q.maxLength}
                            autoFocus
                          />
                          {currentError && (
                            <p className="text-red-500 text-sm mt-2">{currentError}</p>
                          )}
                          {q.maxLength && (
                            <p className="text-gray-400 text-xs mt-1 text-right">
                              {(personalizationAnswers[q.key] || '').length}/{q.maxLength}
                            </p>
                          )}
                        </div>
                      )}
                      {q.type === 'select' && (
                        <div>
                          <select
                            className={`w-full border-2 rounded-xl px-5 py-4 focus:outline-none focus:ring-4 transition-all duration-200 text-gray-900 bg-white text-base ${
                              currentError 
                                ? 'border-red-400 focus:border-red-400 focus:ring-red-50' 
                                : 'border-gray-200 focus:border-purple-400 focus:ring-purple-50'
                            }`}
                            value={personalizationAnswers[q.key] || ''}
                            onChange={handlePersonalizationChange}
                          >
                            <option value="">Select an option...</option>
                            {q.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {currentError && (
                            <p className="text-red-500 text-sm mt-2">{currentError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Media Upload Step */}
          {currentStep === ONBOARDING_STEPS.MEDIA_UPLOAD && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-4">
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

        {/* Sticky Bottom Navigation Buttons */}
        <div className="px-8 py-6 border-t border-gray-100 bg-white sticky bottom-0 left-0 right-0 z-10 flex flex-col gap-2">
          {/* Progress dots for personalization step */}
          {currentStep === ONBOARDING_STEPS.PERSONALIZATION && (
            <div className="flex gap-2 mb-2 justify-center">
              {PERSONALIZATION_QUESTIONS.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === personalizationStep ? 'bg-purple-500' : 
                    index < personalizationStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navigation Buttons for each step */}
          {currentStep === ONBOARDING_STEPS.URL_INPUT && (
            <button
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${!websiteUrl.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={handleUrlSubmit}
              disabled={!websiteUrl.trim()}
            >
              <ChevronRight className="w-5 h-5" />
              Start Scanning
            </button>
          )}

          {currentStep === ONBOARDING_STEPS.CONFIRMATION && (
            <button
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => setCurrentStep(ONBOARDING_STEPS.PERSONALIZATION)}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {currentStep === ONBOARDING_STEPS.PERSONALIZATION && (() => {
            const q = PERSONALIZATION_QUESTIONS[personalizationStep];
            const isLastPersonalizationStep = personalizationStep === PERSONALIZATION_QUESTIONS.length - 1;
            const currentError = errors[q.key];
            return (
              <button
                className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
                  personalizationAnswers[q.key] && !currentError
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handlePersonalizationNext}
                disabled={!personalizationAnswers[q.key] || currentError}
              >
                {isLastPersonalizationStep ? (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            );
          })()}

          {currentStep === ONBOARDING_STEPS.MEDIA_UPLOAD && (
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={handleSkipMedia}
              >
                <SkipForward className="w-4 h-4" />
                Skip for now
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setCurrentStep(ONBOARDING_STEPS.VIDEO_CREATION)}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 