import { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Globe, Loader2, Upload, SkipForward, Video, Sparkles, Target, User, Building, Briefcase, Star, Clock, Users, FileText, Plus, Hash, AtSign, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { saveUserWork } from '../services/persistenceService';
import { scanWebsite, validateWebsiteUrl, getScanningSteps } from '../services/websiteScanService';
import { validateUserData, sanitizeText } from '../utils/validation';

const ONBOARDING_STEPS = {
  WEBSITE_CHOICE: 'website_choice',
  URL_INPUT: 'url_input',
  SCANNING: 'scanning',
  BUSINESS_INFO: 'business_info',
  CAMPAIGN_CHOICE: 'campaign_choice',
  ACCOUNT_SETUP_GUIDE: 'account_setup_guide',
  TIKTOK_SIGNUP: 'tiktok_signup',
  TIKTOK_CONNECT: 'tiktok_connect',
  TIKTOK_SETUP: 'tiktok_setup',
  COMPLETE: 'complete'
};

const BUSINESS_INFO_FIELDS = [
  { key: 'companyName', label: 'Company Name', type: 'text', required: true },
  { key: 'productType', label: 'Product Type', type: 'text', required: true },
  { key: 'productInfo', label: 'Product Description', type: 'textarea', required: true },
  { key: 'companyUrl', label: 'Website URL', type: 'text', required: false },
  { key: 'headquarters', label: 'Location', type: 'text', required: false },
  { key: 'keyProducts', label: 'Key Products/Services', type: 'text', required: false },
  { key: 'targetAudience', label: 'Target Audience', type: 'text', required: false },
  { key: 'valueProp', label: 'Unique Value Proposition', type: 'textarea', required: false },
  { key: 'contact', label: 'Contact Information', type: 'text', required: false },
  { key: 'industry', label: 'Industry', type: 'text', required: false },
  { key: 'companySize', label: 'Company Size', type: 'text', required: false },
  { key: 'foundedYear', label: 'Founded Year', type: 'text', required: false },
  { key: 'mission', label: 'Mission Statement', type: 'textarea', required: false }
];

export default function WebsiteOnboarding({ open, onClose, onComplete, isMandatory = false }) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WEBSITE_CHOICE);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState({});
  const [businessInfo, setBusinessInfo] = useState({});
  const [tiktokSuggestions, setTiktokSuggestions] = useState({});
  const [generatedSlides, setGeneratedSlides] = useState([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [contentPerformance, setContentPerformance] = useState({});
  const [learningData, setLearningData] = useState({
    successfulPatterns: [],
    failedPatterns: [],
    userPreferences: {},
    industryInsights: {}
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(open);
  const [scanLogs, setScanLogs] = useState([]);
  const [customHashtags, setCustomHashtags] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);


  useEffect(() => {
    setShow(open);
    if (open) {
      setCurrentStep(ONBOARDING_STEPS.WEBSITE_CHOICE);
      setWebsiteUrl('');
      setExtractedData({});
      setBusinessInfo({});
      setTiktokSuggestions({});
      setGeneratedSlides([]);
      setIsGeneratingContent(false);
      setCurrentIteration(1);
      setContentPerformance({});
      setLearningData({
        successfulPatterns: [],
        failedPatterns: [],
        userPreferences: {},
        industryInsights: {}
      });
      setShowFeedbackModal(false);
      setSelectedVariation(null);
      setErrors({});
      setScanProgress(0);
      setScanLogs([]);
      setCustomHashtags([]);
      setNewKeyword('');
      setProfilePicture(null);

    }
  }, [open]);

  const addScanLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setScanLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const validateUrl = (url) => {
    const validation = validateWebsiteUrl(url);
    return validation.valid ? null : validation.error;
  };

  const simulateWebsiteScan = async (url) => {
    setIsLoading(true);
    setCurrentStep(ONBOARDING_STEPS.SCANNING);
    setScanLogs([]);
    
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (currentProgress < 85) {
        currentProgress += Math.random() * 3 + 1;
        setScanProgress(Math.min(currentProgress, 85));
      }
    }, 200);

    addScanLog('🔍 Starting comprehensive website scan...', 'info');
    addScanLog(`📡 Connecting to: ${url}`, 'info');
    
    setTimeout(() => addScanLog('✅ Connection established', 'success'), 500);
    setTimeout(() => addScanLog('📄 Fetching HTML content...', 'info'), 1000);
    setTimeout(() => addScanLog('🔍 Parsing page structure...', 'info'), 1500);
    setTimeout(() => addScanLog('📊 Extracting metadata...', 'info'), 2000);
    setTimeout(() => addScanLog('🤖 Analyzing with AI...', 'info'), 2500);
    setTimeout(() => addScanLog('📋 Processing business data...', 'info'), 3000);

    try {
      const res = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      clearInterval(progressInterval);
      
      if (!res.ok) {
        const err = await res.json();
        addScanLog(`❌ Scan failed: ${err.error || 'Unknown error'}`, 'error');
        setErrors({ scan: err.error || 'Failed to scan website.' });
        setCurrentStep(ONBOARDING_STEPS.URL_INPUT);
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      
      // Enhanced logging with comprehensive data
      addScanLog('✅ HTML content fetched successfully', 'success');
      addScanLog(`📝 Title: ${data.title || 'Not found'}`, 'data');
      addScanLog(`📄 Description: ${data.description || 'Not found'}`, 'data');
      addScanLog(`🏢 Company: ${data.companyName || 'Not found'}`, 'data');
      addScanLog(`📦 Product Type: ${data.productType || 'Not found'}`, 'data');
      addScanLog(`📍 Headquarters: ${data.headquarters || 'Not found'}`, 'data');
      addScanLog(`🎯 Target Audience: ${data.targetAudience || 'Not found'}`, 'data');
      addScanLog(`💼 Key Products: ${data.keyProducts || 'Not found'}`, 'data');
      addScanLog(`💡 Value Prop: ${data.valueProp || 'Not found'}`, 'data');
      addScanLog(`📞 Contact: ${data.contact || 'Not found'}`, 'data');
      
      // Log additional comprehensive data
      if (data.industry && data.industry !== 'Not specified') {
        addScanLog(`🏭 Industry: ${data.industry}`, 'data');
      }
      if (data.companySize && data.companySize !== 'Not specified') {
        addScanLog(`📊 Company Size: ${data.companySize}`, 'data');
      }
      if (data.foundedYear && data.foundedYear !== 'Not specified') {
        addScanLog(`📅 Founded: ${data.foundedYear}`, 'data');
      }
      if (data.mission && data.mission !== 'Not specified') {
        addScanLog(`🎯 Mission: ${data.mission}`, 'data');
      }
      if (data.socialLinks && Object.keys(data.socialLinks).length > 0) {
        addScanLog(`📱 Social Media: ${Object.keys(data.socialLinks).join(', ')}`, 'data');
      }
      
      addScanLog('🎉 Comprehensive scan completed successfully!', 'success');
      
      // Ensure all fields are present with comprehensive data
      const allFields = {
        companyName: '',
        productType: '',
        productInfo: '',
        companyUrl: '',
        headquarters: '',
        keyProducts: '',
        targetAudience: '',
        valueProp: '',
        contact: '',
        industry: '',
        companySize: '',
        foundedYear: '',
        mission: '',
        socialLinks: {}
      };
      setExtractedData({ ...allFields, ...data });
      setBusinessInfo({ ...allFields, ...data });
      
      setScanProgress(100);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStep(ONBOARDING_STEPS.BUSINESS_INFO);
    } catch (e) {
      clearInterval(progressInterval);
      addScanLog(`❌ Network error: ${e.message}`, 'error');
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
    await simulateWebsiteScan(validation.normalizedUrl);
  };

  const handleUrlChange = (e) => {
    setWebsiteUrl(e.target.value);
    if (errors.url || errors.scan) {
      setErrors({});
    }
  };

  const handleBusinessInfoChange = (field, value) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkipWebsiteScan = () => {
    setCurrentStep(ONBOARDING_STEPS.BUSINESS_INFO);
  };

  const handleBusinessInfoComplete = () => {
    // Validate required fields
    const requiredFields = BUSINESS_INFO_FIELDS.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !businessInfo[field.key] || businessInfo[field.key].trim() === '');
    
    if (missingFields.length > 0) {
      setErrors({ business: `Please fill in: ${missingFields.map(f => f.label).join(', ')}` });
      return;
    }
    
    setErrors({});
    setCurrentStep(ONBOARDING_STEPS.CAMPAIGN_CHOICE);
  };

  const handleCampaignChoice = (choice) => {
    if (choice === 'setup') {
      setCurrentStep(ONBOARDING_STEPS.TIKTOK_SIGNUP);
    } else if (choice === 'login') {
      // TODO: Implement TikTok login functionality
      console.log('TikTok login functionality will be implemented later');
      // For now, just go to the TikTok setup step
      setCurrentStep(ONBOARDING_STEPS.TIKTOK_SETUP);
    } else if (choice === 'skip') {
      handleComplete();
    }
  };

  const generateTiktokSuggestions = () => {
    const companyName = businessInfo.companyName || 'Your Company';
    const productType = businessInfo.productType || '';
    const productInfo = businessInfo.productInfo || '';
    const keyProducts = businessInfo.keyProducts || '';
    const valueProp = businessInfo.valueProp || '';
    const targetAudience = businessInfo.targetAudience || '';
    
    // Only extract features that are explicitly stated
    const productFeatures = extractStatedFeatures(productInfo, keyProducts, valueProp);
    const mainBenefit = extractStatedBenefit(productInfo, valueProp);
    const targetUsers = extractStatedTargetUsers(targetAudience, productInfo);
    
    // Generate username suggestions based on available information
    const usernameSuggestions = generateConservativeUsernames(companyName, productType, productFeatures);
    
    // Generate bio suggestions using only stated information
    const bioSuggestions = generateConservativeBios(companyName, productFeatures, mainBenefit, targetUsers, productInfo);
    
    // Generate hashtag suggestions based on available data
    const hashtagSuggestions = generateConservativeHashtags(productType, productFeatures, targetUsers, companyName);
    
    setTiktokSuggestions({
      usernames: usernameSuggestions,
      bios: bioSuggestions,
      hashtags: hashtagSuggestions
    });
  };

  const extractStatedFeatures = (productInfo, keyProducts, valueProp) => {
    const features = [];
    
    // Extract features that are explicitly mentioned
    if (productInfo) {
      const infoLower = productInfo.toLowerCase();
      
      // Look for specific stated features
      if (infoLower.includes('block') || infoLower.includes('prevent')) {
        features.push('blocking');
      }
      if (infoLower.includes('track') || infoLower.includes('monitor')) {
        features.push('tracking');
      }
      if (infoLower.includes('design') || infoLower.includes('create')) {
        features.push('design');
      }
      if (infoLower.includes('manage') || infoLower.includes('organize')) {
        features.push('management');
      }
      if (infoLower.includes('analyze') || infoLower.includes('insights')) {
        features.push('analytics');
      }
      if (infoLower.includes('automate') || infoLower.includes('automatic')) {
        features.push('automation');
      }
      if (infoLower.includes('secure') || infoLower.includes('safe')) {
        features.push('security');
      }
      if (infoLower.includes('mobile') || infoLower.includes('app')) {
        features.push('mobile');
      }
      if (infoLower.includes('cloud') || infoLower.includes('online')) {
        features.push('cloud');
      }
      if (infoLower.includes('ai') || infoLower.includes('artificial intelligence')) {
        features.push('ai-powered');
      }
      if (infoLower.includes('social') || infoLower.includes('community')) {
        features.push('social');
      }
      if (infoLower.includes('e-commerce') || infoLower.includes('shop')) {
        features.push('e-commerce');
      }
      if (infoLower.includes('saas') || infoLower.includes('software')) {
        features.push('saas');
      }
    }
    
    // Extract from key products if they're specific features
    if (keyProducts && keyProducts !== 'Not specified') {
      const products = keyProducts.split(',').map(p => p.trim().toLowerCase());
      // Only add if they look like actual features, not generic terms
      products.forEach(product => {
        if (product.length > 3 && !product.includes('not specified')) {
          features.push(product);
        }
      });
    }
    
    // Intelligent inference based on product type and industry
    if (features.length === 0 && productInfo) {
      const infoLower = productInfo.toLowerCase();
      
      // Infer features based on common patterns
      if (infoLower.includes('platform') || infoLower.includes('software')) {
        features.push('platform');
      }
      if (infoLower.includes('tool') || infoLower.includes('utility')) {
        features.push('productivity');
      }
      if (infoLower.includes('service') || infoLower.includes('consulting')) {
        features.push('services');
      }
      if (infoLower.includes('marketplace') || infoLower.includes('market')) {
        features.push('marketplace');
      }
    }
    
    return features.slice(0, 3); // Limit to top 3 features
  };

  const extractStatedBenefit = (productInfo, valueProp) => {
    // Use explicitly stated benefits first
    if (valueProp && valueProp !== 'Not specified') {
      return valueProp.slice(0, 100); // Use the actual stated value proposition
    }
    
    // Extract from product info if clearly stated
    if (productInfo && productInfo !== 'Not specified') {
      const infoLower = productInfo.toLowerCase();
      if (infoLower.includes('help') || infoLower.includes('enable')) {
        return 'helps users';
      }
      if (infoLower.includes('solve') || infoLower.includes('fix')) {
        return 'solves problems';
      }
      if (infoLower.includes('improve') || infoLower.includes('enhance')) {
        return 'improves processes';
      }
      if (infoLower.includes('save') || infoLower.includes('time')) {
        return 'saves time';
      }
      if (infoLower.includes('automate') || infoLower.includes('automatic')) {
        return 'automates tasks';
      }
      if (infoLower.includes('connect') || infoLower.includes('network')) {
        return 'connects people';
      }
      if (infoLower.includes('create') || infoLower.includes('build')) {
        return 'creates solutions';
      }
      if (infoLower.includes('manage') || infoLower.includes('organize')) {
        return 'manages workflows';
      }
    }
    
    // Intelligent inference based on product type
    if (productInfo && productInfo !== 'Not specified') {
      const infoLower = productInfo.toLowerCase();
      
      // Infer benefits based on common patterns
      if (infoLower.includes('platform') || infoLower.includes('software')) {
        return 'provides powerful tools';
      }
      if (infoLower.includes('marketplace') || infoLower.includes('market')) {
        return 'connects buyers and sellers';
      }
      if (infoLower.includes('social') || infoLower.includes('community') || infoLower.includes('network')) {
        return 'builds communities';
      }
      if (infoLower.includes('e-commerce') || infoLower.includes('shop') || infoLower.includes('retail')) {
        return 'enables online shopping';
      }
      if (infoLower.includes('saas') || infoLower.includes('subscription')) {
        return 'delivers software solutions';
      }
    }
    
    return 'Not specified';
  };

  const extractStatedTargetUsers = (targetAudience, productInfo) => {
    // Use explicitly stated target users first
    if (targetAudience && targetAudience !== 'Not specified') {
      return targetAudience;
    }
    
    // Try to extract from product info if it mentions specific users
    if (productInfo) {
      const infoLower = productInfo.toLowerCase();
      if (infoLower.includes('business') || infoLower.includes('company')) {
        return 'businesses';
      }
      if (infoLower.includes('developer') || infoLower.includes('coder')) {
        return 'developers';
      }
      if (infoLower.includes('team') || infoLower.includes('collaboration')) {
        return 'teams';
      }
      if (infoLower.includes('individual') || infoLower.includes('personal')) {
        return 'individuals';
      }
      if (infoLower.includes('consumer') || infoLower.includes('customer')) {
        return 'consumers';
      }
      if (infoLower.includes('startup') || infoLower.includes('entrepreneur')) {
        return 'startups';
      }
      if (infoLower.includes('enterprise') || infoLower.includes('large')) {
        return 'enterprises';
      }
      if (infoLower.includes('freelancer') || infoLower.includes('remote')) {
        return 'freelancers';
      }
      if (infoLower.includes('student') || infoLower.includes('education')) {
        return 'students';
      }
      if (infoLower.includes('marketer') || infoLower.includes('marketing')) {
        return 'marketers';
      }
      if (infoLower.includes('designer') || infoLower.includes('creative')) {
        return 'designers';
      }
    }
    
    // Intelligent inference based on product type and industry
    if (productInfo && productInfo !== 'Not specified') {
      const infoLower = productInfo.toLowerCase();
      
      // Infer target users based on common patterns
      if (infoLower.includes('saas') || infoLower.includes('software') || infoLower.includes('platform')) {
        return 'businesses';
      }
      if (infoLower.includes('e-commerce') || infoLower.includes('shop') || infoLower.includes('retail')) {
        return 'consumers';
      }
      if (infoLower.includes('social') || infoLower.includes('community') || infoLower.includes('network')) {
        return 'individuals';
      }
      if (infoLower.includes('marketplace') || infoLower.includes('market')) {
        return 'buyers and sellers';
      }
      if (infoLower.includes('consulting') || infoLower.includes('service')) {
        return 'businesses';
      }
    }
    
    return 'users';
  };

  const generateConservativeUsernames = (companyName, productType, features) => {
    const suggestions = [];
    
    // Company-based usernames (most reliable)
    if (companyName && companyName !== 'Not specified') {
      const cleanCompanyName = companyName.toLowerCase().replace(/\s+/g, '');
      suggestions.push(cleanCompanyName);
      suggestions.push(`${cleanCompanyName}official`);
    }
    
    // Product type based (if we have it)
    if (productType && productType !== 'Not specified') {
      const cleanProductType = productType.toLowerCase().replace(/\s+/g, '');
      suggestions.push(`${cleanProductType}pro`);
    }
    
    // Feature-based (only if we have specific features)
    if (features.length > 0) {
      const mainFeature = features[0].replace(/\s+/g, '');
      suggestions.push(`${mainFeature}pro`);
    }
    
    // Generic but safe options
    if (companyName && companyName !== 'Not specified') {
      const cleanCompanyName = companyName.toLowerCase().replace(/\s+/g, '');
      suggestions.push(`${cleanCompanyName}tips`);
    }
    
    return suggestions.slice(0, 4);
  };

  const generateConservativeBios = (companyName, features, mainBenefit, targetUsers, productInfo) => {
    const suggestions = [];
    
    // Only create bios if we have actual information
    if (companyName && companyName !== 'Not specified') {
      // Use actual product info if available
      if (productInfo && productInfo !== 'Not specified') {
        const shortInfo = productInfo.slice(0, 50);
        suggestions.push(`🚀 ${companyName} - ${shortInfo}`);
      }
      
      // Use stated features if available
      if (features.length > 0) {
        const featureList = features.slice(0, 2).join(' + ');
        suggestions.push(`✨ ${companyName} - ${featureList}`);
      }
      
      // Use stated benefit if available
      if (mainBenefit && mainBenefit !== 'Not specified') {
        suggestions.push(`💡 ${companyName} - ${mainBenefit}`);
      }
      
      // Use target users if available
      if (targetUsers && targetUsers !== 'users') {
        suggestions.push(`🎯 ${companyName} - for ${targetUsers}`);
      }
      
      // Generic but safe options
      suggestions.push(`🚀 ${companyName} - official account`);
      suggestions.push(`💡 ${companyName} - helping ${targetUsers}`);
    }
    
    return suggestions.slice(0, 4);
  };

  const generateConservativeHashtags = (productType, features, targetUsers, companyName) => {
    const hashtags = [];
    
    // Company hashtag (most reliable)
    if (companyName && companyName !== 'Not specified') {
      const cleanCompanyName = companyName.toLowerCase().replace(/\s+/g, '');
      hashtags.push(`#${cleanCompanyName}`);
    }
    
    // Product type hashtag (if we have it)
    if (productType && productType !== 'Not specified') {
      const cleanProductType = productType.toLowerCase().replace(/\s+/g, '');
      hashtags.push(`#${cleanProductType}`);
    }
    
    // Feature hashtags (only if we have specific features)
    features.forEach(feature => {
      const cleanFeature = feature.replace(/\s+/g, '');
      hashtags.push(`#${cleanFeature}`);
    });
    
    // Target audience hashtag (if we have it)
    if (targetUsers && targetUsers !== 'users') {
      const cleanTargetUsers = targetUsers.replace(/\s+/g, '');
      hashtags.push(`#${cleanTargetUsers}`);
    }
    
    // Generic but relevant hashtags
    hashtags.push('#business', '#tech', '#innovation');
    
    return hashtags.slice(0, 6);
  };

  const handleTiktokComplete = () => {
    setCurrentStep(ONBOARDING_STEPS.CONTENT_GENERATION);
    generateContentVariations();
  };

  const generateContentVariations = () => {
    setIsGeneratingContent(true);
    
    // Generate 5 unique variations, each containing 4 slides
    const variations = [];
    
    const companyName = businessInfo.companyName || 'Your Company';
    const productInfo = businessInfo.productInfo || '';
    const targetAudience = businessInfo.targetAudience || 'users';
    const valueProp = businessInfo.valueProp || '';
    const industry = businessInfo.industry || '';
    const keyProducts = businessInfo.keyProducts || '';
    const headquarters = businessInfo.headquarters || '';
    const companySize = businessInfo.companySize || '';
    
    // Extract specific features and benefits
    const features = extractStatedFeatures(productInfo, keyProducts, valueProp);
    const mainBenefit = extractStatedBenefit(productInfo, valueProp);
    const targetUsers = extractStatedTargetUsers(targetAudience, productInfo);
    
    // Apply learning from previous iterations
    const improvedContent = applyLearningToContent({
      companyName,
      productInfo,
      targetAudience,
      valueProp,
      industry,
      keyProducts,
      headquarters,
      companySize,
      features,
      mainBenefit,
      targetUsers
    });
    
    setGeneratedSlides(improvedContent);
    setIsGeneratingContent(false);
  };

  const applyLearningToContent = (businessData) => {
    const variations = [];
    
    // Apply successful patterns from previous iterations
    const successfulPatterns = learningData.successfulPatterns || [];
    const failedPatterns = learningData.failedPatterns || [];
    const userPreferences = learningData.userPreferences || {};
    const industryInsights = learningData.industryInsights || {};
    
    // Generate variations with learning applied
    variations.push(generateVariationWithLearning('Problem-Solution Journey', businessData, successfulPatterns, failedPatterns, 1));
    variations.push(generateVariationWithLearning('Feature Showcase', businessData, successfulPatterns, failedPatterns, 2));
    variations.push(generateVariationWithLearning('Before & After Story', businessData, successfulPatterns, failedPatterns, 3));
    variations.push(generateVariationWithLearning('Industry Disruption', businessData, successfulPatterns, failedPatterns, 4));
    variations.push(generateVariationWithLearning('Success Metrics', businessData, successfulPatterns, failedPatterns, 5));
    
    return variations;
  };

  const generateVariationWithLearning = (variationType, businessData, successfulPatterns, failedPatterns, variationIndex) => {
    const { companyName, features, mainBenefit, targetUsers, industry } = businessData;
    
    // Apply successful hooks and avoid generic language
    const hooks = successfulPatterns.filter(p => p.element === 'hook').map(p => p.content);
    const avoidGeneric = failedPatterns.filter(p => p.element === 'generic_language').map(p => p.content);
    
    let slides = [];
    
         switch(variationType) {
       case 'Problem-Solution Journey':
         slides = generateProblemSolutionWithLearning(businessData, successfulPatterns, failedPatterns);
         break;
       case 'Feature Showcase':
         slides = generateFeatureShowcaseWithLearning(businessData, successfulPatterns, failedPatterns);
         break;
       case 'Before & After Story':
         slides = generateBeforeAfterWithLearning(businessData, successfulPatterns, failedPatterns);
         break;
       case 'Industry Disruption':
         slides = generateIndustryDisruptionWithLearning(businessData, successfulPatterns, failedPatterns);
         break;
       case 'Success Metrics':
         slides = generateSuccessMetricsWithLearning(businessData, successfulPatterns, failedPatterns);
         break;
     }
    
         return {
       name: variationType,
       slides,
       iteration: currentIteration,
       variationIndex,
       learningApplied: successfulPatterns.length > 0 || failedPatterns.length > 0
     };
  };

  const generateProblemSolutionWithLearning = (businessData, successfulPatterns, failedPatterns) => {
    const { companyName, features, mainBenefit, targetUsers, industry } = businessData;
    
    // Apply successful hooks and avoid generic language
    const hooks = successfulPatterns.filter(p => p.element === 'hook').map(p => p.content);
    const avoidGeneric = failedPatterns.filter(p => p.element === 'generic_language').map(p => p.content);
    
    return [
      `🎯 ${hooks.length > 0 ? hooks[0] : `The Problem: ${targetUsers} struggle with ${features.length > 0 ? features[0] : 'inefficiency'} every day`}`,
      `💡 ${hooks.length > 1 ? hooks[1] : `The Solution: ${companyName} brings ${features.length > 1 ? features[1] : 'innovation'} to the table`}`,
      `🚀 ${hooks.length > 2 ? hooks[2] : `The Result: ${mainBenefit || 'transform your workflow'} with our platform`}`,
      `✨ ${hooks.length > 3 ? hooks[3] : `The Future: Join thousands of ${targetUsers} who've already transformed their ${industry || 'business'}`}`
    ];
  };

  const generateFeatureShowcaseWithLearning = (businessData, successfulPatterns, failedPatterns) => {
    const { companyName, features, targetUsers } = businessData;
    
    // Apply successful feature presentation patterns
    const featurePatterns = successfulPatterns.filter(p => p.element === 'feature_presentation');
    
    return [
      `⚡ ${features.length > 0 ? features[0].toUpperCase() : 'POWERFUL'} - The core that drives ${companyName}`,
      `🎯 ${features.length > 1 ? features[1].toUpperCase() : 'PRECISION'} - Built specifically for ${targetUsers}`,
      `🔥 ${features.length > 2 ? features[2].toUpperCase() : 'INNOVATION'} - What sets us apart from the rest`,
      `💎 ${features.length > 3 ? features[3].toUpperCase() : 'EXCELLENCE'} - The ${companyName} difference you've been waiting for`
    ];
  };

  const generateBeforeAfterWithLearning = (businessData, successfulPatterns, failedPatterns) => {
    const { companyName, features, targetUsers } = businessData;
    
    // Apply successful emotional triggers
    const emotionalTriggers = successfulPatterns.filter(p => p.element === 'emotional_trigger');
    
    return [
      `😤 BEFORE: ${targetUsers} wasting hours on ${features.length > 0 ? features[0] : 'manual processes'}`,
      `😰 BEFORE: Frustration with ${features.length > 1 ? features[1] : 'outdated solutions'}`,
      `😎 AFTER: ${companyName} automates everything in minutes`,
      `🎉 AFTER: ${targetUsers} finally have time to focus on what matters most`
    ];
  };

  const generateIndustryDisruptionWithLearning = (businessData, successfulPatterns, failedPatterns) => {
    const { companyName, targetUsers, industry } = businessData;
    
    // Apply successful disruption language
    const disruptionLanguage = successfulPatterns.filter(p => p.element === 'disruption_language');
    
    return [
      `🏭 The ${industry || 'industry'} is broken. ${targetUsers} deserve better.`,
      `💥 ${companyName} is here to disrupt the status quo`,
      `🚀 We're not just another ${industry || 'company'} - we're the future`,
      `✨ Join the revolution. ${companyName} is changing everything.`
    ];
  };

  const generateSuccessMetricsWithLearning = (businessData, successfulPatterns, failedPatterns) => {
    const { companyName, targetUsers, mainBenefit, industry, companySize, headquarters } = businessData;
    
    // Apply successful social proof patterns
    const socialProofPatterns = successfulPatterns.filter(p => p.element === 'social_proof');
    
    return [
      `📈 ${companySize ? companySize + ' companies' : 'Thousands'} trust ${companyName}`,
      `🎯 ${targetUsers} see ${mainBenefit || 'results'} in their first week`,
      `💪 ${headquarters ? 'From ' + headquarters : 'Globally'}, we're helping ${targetUsers} succeed`,
      `🏆 ${companyName} - Where ${industry || 'excellence'} meets ${mainBenefit || 'innovation'}`
    ];
  };

  const collectFeedback = (variationIndex, performance, feedback) => {
    const variation = generatedSlides[variationIndex];
    
    // Store performance data
    setContentPerformance(prev => ({
      ...prev,
      [variationIndex]: {
        performance,
        feedback,
        timestamp: new Date().toISOString(),
        variation: variation
      }
    }));
    
    // Update learning data
    updateLearningData(variation, performance, feedback);
    
    // If performance is low, trigger improvement
    if (performance < 0.5) {
      triggerContentImprovement(variationIndex);
    }
  };

  const updateLearningData = (variation, performance, feedback) => {
    setLearningData(prev => {
      const newLearningData = { ...prev };
      
      if (performance > 0.7) {
        // Successful pattern
        newLearningData.successfulPatterns.push({
          variationType: variation.name,
          performance,
          feedback,
          timestamp: new Date().toISOString(),
          patterns: extractPatternsFromVariation(variation)
        });
      } else if (performance < 0.3) {
        // Failed pattern
        newLearningData.failedPatterns.push({
          variationType: variation.name,
          performance,
          feedback,
          timestamp: new Date().toISOString(),
          patterns: extractPatternsFromVariation(variation)
        });
      }
      
      return newLearningData;
    });
  };

  const extractPatternsFromVariation = (variation) => {
    const patterns = [];
    
    variation.slides.forEach((slide, index) => {
      // Extract hooks, emotional triggers, call-to-actions
      if (slide.includes('🎯') || slide.includes('💡')) {
        patterns.push({ element: 'hook', content: slide, slideIndex: index });
      }
      if (slide.includes('😤') || slide.includes('😰') || slide.includes('😎')) {
        patterns.push({ element: 'emotional_trigger', content: slide, slideIndex: index });
      }
      if (slide.includes('Join') || slide.includes('Revolution')) {
        patterns.push({ element: 'call_to_action', content: slide, slideIndex: index });
      }
    });
    
    return patterns;
  };

  const triggerContentImprovement = (variationIndex) => {
    setCurrentIteration(prev => prev + 1);
    
    // Regenerate content with improved learning
    setTimeout(() => {
      generateContentVariations();
    }, 1000);
  };

  const handleVariationFeedback = (variationIndex) => {
    setSelectedVariation(generatedSlides[variationIndex]);
    setShowFeedbackModal(true);
  };

  const handleComplete = async () => {
    try {
      const onboardingData = {
        websiteUrl,
        extractedData,
        businessInfo,
        tiktokSuggestions,
        generatedSlides,
        completedAt: new Date().toISOString()
      };

      if (session?.user?.email) {
        await saveUserWork(session.user.email, 'onboarding', onboardingData);
      }

      setShow(false);
      if (onComplete) onComplete(onboardingData);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setShow(false);
      if (onComplete) onComplete({ websiteUrl, extractedData, businessInfo, tiktokSuggestions, generatedSlides });
    }
  };

  const handleClose = () => {
    if (!isMandatory) {
      setShow(false);
      if (onClose) onClose();
    }
  };



  const handleRemoveCustomHashtag = (hashtagToRemove) => {
    setCustomHashtags(prev => prev.filter(hashtag => hashtag !== hashtagToRemove));
  };

  const handleRemoveSuggestedHashtag = (hashtagToRemove) => {
    setTiktokSuggestions(prev => ({
      ...prev,
      hashtags: prev.hashtags?.filter(hashtag => hashtag !== hashtagToRemove) || []
    }));
  };



  const generateRandomProfilePicture = () => {
    // Generate a random profile picture using DiceBear API
    const seed = Math.random().toString(36).substring(7);
    const profilePic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    setProfilePicture(profilePic);
  };

  const handleAddCustomProfilePicture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };







  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto relative max-h-[90vh] flex flex-col" style={{overflowY: 'auto'}}>
        {/* Header */}
        <div className="px-8 py-6 relative">
          {!isMandatory && (
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
          {/* Website Choice Step */}
          {currentStep === ONBOARDING_STEPS.WEBSITE_CHOICE && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Let's get started</h3>
                <p className="text-gray-600">How would you like to set up your account?</p>
              </div>
              <div className="grid gap-4">
                <button
                  onClick={() => setCurrentStep(ONBOARDING_STEPS.URL_INPUT)}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Scan my website</h4>
                      <p className="text-gray-600 text-sm">Automatically extract business information from your website</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
                <button
                  onClick={handleSkipWebsiteScan}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Enter manually</h4>
                      <p className="text-gray-600 text-sm">Fill in your business information manually</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* URL Input Step */}
          {currentStep === ONBOARDING_STEPS.URL_INPUT && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter your website URL</h3>
                <p className="text-gray-600">We'll automatically extract your business information</p>
              </div>
              <div>
                <input
                  type="url"
                  className={`w-full border-2 rounded-xl px-5 py-4 focus:outline-none focus:ring-4 transition-all duration-200 text-gray-900 placeholder-gray-400 text-base ${
                    errors.url || errors.scan
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-50' 
                      : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                  }`}
                  placeholder="Enter your website address (e.g., somerbysit.co.uk)"
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
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Scanning your website</h3>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-gray-600 mb-6">
                  {scanProgress < 15 && 'Initializing scan...'}
                  {scanProgress >= 15 && scanProgress < 30 && 'Connecting to website...'}
                  {scanProgress >= 30 && scanProgress < 50 && 'Fetching product information...'}
                  {scanProgress >= 50 && scanProgress < 70 && 'Extracting key details...'}
                  {scanProgress >= 70 && scanProgress < 85 && 'Analyzing content...'}
                  {scanProgress >= 85 && scanProgress < 100 && 'Finalizing scan...'}
                  {scanProgress >= 100 && 'Scan complete!'}
                </p>
              </div>
              
              <div className="bg-gray-900 rounded-xl p-4 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-400 text-sm font-mono">Scan Console</span>
                </div>
                <div className="space-y-1">
                  {scanLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm font-mono">
                      <span className="text-gray-500 min-w-[60px]">{log.timestamp}</span>
                      <span className={`${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'data' ? 'text-blue-400' :
                        'text-gray-300'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {scanLogs.length === 0 && (
                    <div className="text-gray-500 text-sm font-mono">
                      Waiting for scan to begin...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Business Info Step */}
          {currentStep === ONBOARDING_STEPS.BUSINESS_INFO && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Building className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Information</h3>
                <p className="text-gray-600">Review and edit your business details</p>
              </div>
              <div className="space-y-4">
                {BUSINESS_INFO_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                  <textarea
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-50 text-gray-900 placeholder-gray-400"
                    rows="3"
                        value={businessInfo[field.key] || ''}
                        onChange={(e) => handleBusinessInfoChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                    ) : (
                  <input
                    type="text"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:border-blue-400 focus:ring-blue-50 text-gray-900 placeholder-gray-400"
                        value={businessInfo[field.key] || ''}
                        onChange={(e) => handleBusinessInfoChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                </div>
                ))}
                {errors.business && (
                  <p className="text-red-500 text-sm mt-2">{errors.business}</p>
                )}
              </div>
            </div>
          )}

          {/* Campaign Choice Step */}
          {currentStep === ONBOARDING_STEPS.CAMPAIGN_CHOICE && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-orange-600 mx-auto mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to create content?</h3>
                <p className="text-gray-600">Would you like to generate your TikTok profile and start creating content now?</p>
                </div>
              <div className="grid gap-4">
                <button
                  onClick={() => handleCampaignChoice('setup')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Setup new account</h4>
                      <p className="text-gray-600 text-sm">Create and warm up a new TikTok account</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
                
                <button
                  onClick={() => handleCampaignChoice('login')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Login</h4>
                      <p className="text-gray-600 text-sm">Connect your existing TikTok account</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </button>
                
                <button
                  onClick={() => handleCampaignChoice('skip')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <SkipForward className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Skip for now</h4>
                      <p className="text-gray-600 text-sm">Go to dashboard and set up later</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TikTok Setup Step */}
          {currentStep === ONBOARDING_STEPS.TIKTOK_SETUP && (
            <div className="space-y-6">
              {(() => {
                // Generate TikTok suggestions when this step loads
                if (Object.keys(tiktokSuggestions).length === 0) {
                  generateTiktokSuggestions();
                }
                // Auto-generate profile picture if not already set
                if (!profilePicture) {
                  generateRandomProfilePicture();
                }
                return null;
              })()}
                              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <AtSign className="w-8 h-8" />
                                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate Profile</h3>
                <p className="text-gray-600">Set up your TikTok profile with suggested usernames, bio, and keywords</p>
                              </div>
              
                  <div className="space-y-6">
                {/* Profile Picture */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Profile Picture</h4>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profilePicture ? (
                        <div className="relative">
                          <img
                            src={profilePicture}
                            alt="Profile preview"
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor="custom-profile-picture" className="cursor-pointer">
                          <div className="px-3 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors inline-flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            Add
                          </div>
                        </label>
                        <input
                          id="custom-profile-picture"
                          type="file"
                          accept="image/*"
                          onChange={handleAddCustomProfilePicture}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        AI-generated avatar with option to add your own
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username Suggestions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Username Suggestions</h4>
                  <div className="grid gap-2">
                    {tiktokSuggestions.usernames?.map((username, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="font-mono text-gray-700">@{username}</span>
                    </div>
                    ))}
                        </div>
                    </div>

                {/* Bio Suggestions */}
                        <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Bio Suggestions</h4>
                  <div className="grid gap-2">
                    {tiktokSuggestions.bios?.map((bio, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-700">{bio}</span>
                        </div>
                    ))}
            </div>
                </div>

                {/* Hashtag Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Target Keywords</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tiktokSuggestions.hashtags?.map((hashtag, index) => (
                      <span key={`suggested-${index}`} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                        {hashtag}
                        <button
                          onClick={() => handleRemoveSuggestedHashtag(hashtag)}
                          className="ml-1 hover:text-blue-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {customHashtags.map((hashtag, index) => (
                      <span key={`custom-${index}`} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                        {hashtag}
                        <button
                          onClick={() => handleRemoveCustomHashtag(hashtag)}
                          className="ml-1 hover:text-green-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    
                    {/* Simple Add Keyword Input */}
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newKeyword.trim()) {
                          const keyword = newKeyword.trim().startsWith('#') ? newKeyword.trim() : `#${newKeyword.trim()}`;
                          if (!customHashtags.includes(keyword) && !tiktokSuggestions.hashtags?.includes(keyword)) {
                            setCustomHashtags(prev => [...prev, keyword]);
                          }
                          setNewKeyword('');
                        }
                      }}
                      placeholder="Add keyword..."
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-200 transition-colors w-32"
                    />
                  </div>
                </div>
              </div>
                        </div>
                      )}



          {/* TikTok Signup Step */}
          {currentStep === ONBOARDING_STEPS.TIKTOK_SIGNUP && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <AtSign className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">TikTok Account Setup Guide</h3>
                <p className="text-gray-600">Follow these steps to create your TikTok account</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Download TikTok App</h4>
                      <p className="text-gray-700 text-sm">Download the TikTok app from the App Store for iPhone or Google Play Store for Android devices.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Sign Up for TikTok</h4>
                      <p className="text-gray-700 text-sm">Open TikTok and tap Sign Up. Choose Sign up with Google for the fastest process or use your email or phone number.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Verify Your Email Address</h4>
                      <p className="text-gray-700 text-sm">Check your email and click the verification link to activate your TikTok account. Check your spam folder if you don't see the email immediately.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Create Your Profile</h4>
                      <p className="text-gray-700 text-sm">Set up your basic profile information including username, profile photo, and a short bio describing your business.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Switch to Business Account</h4>
                      <p className="text-gray-700 text-sm">Go to Profile, then Menu, then Settings & Privacy, tap Manage Account, and select Switch to Business Account. Choose your business category.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      6
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Connect to Our Platform</h4>
                      <p className="text-gray-700 text-sm">Return to our platform dashboard, click Connect TikTok, log in and authorize our platform to start creating and auto-posting content.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentStep(ONBOARDING_STEPS.TIKTOK_CONNECT)}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mx-auto"
                >
                  <Check className="w-5 h-5" />
                  I've Created My TikTok Account
                </button>
              </div>
            </div>
          )}

          {/* TikTok Connect Step */}
          {currentStep === ONBOARDING_STEPS.TIKTOK_CONNECT && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your TikTok Account</h3>
                <p className="text-gray-600">Connect your TikTok account to start creating and auto-posting content</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="text-center space-y-4">
                  <h4 className="font-semibold text-gray-900 text-lg">Ready to Connect?</h4>
                  <p className="text-gray-700 text-sm">Click the button below to connect your TikTok account to our platform. You'll be redirected to TikTok to authorize the connection.</p>
                  
                  <div className="pt-4">
                    <button
                      onClick={() => handleComplete()}
                      className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mx-auto"
                    >
                      <Users className="w-5 h-5" />
                      Connect TikTok Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



            {/* Feedback Modal */}
            {showFeedbackModal && selectedVariation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Content Performance</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How well would this content perform on TikTok?
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => {
                              const performance = rating / 5;
                              collectFeedback(selectedVariation.variationIndex, performance, '');
                              setShowFeedbackModal(false);
                              setSelectedVariation(null);
                            }}
                            className="flex-1 py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            {rating}
                </button>
                        ))}
              </div>
            </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What would you change? (Optional)
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                        rows="3"
                        placeholder="Share your feedback to help improve future content..."
                      />
                </div>
              </div>
                  
                  <div className="flex gap-3 mt-6">
                  <button
                      onClick={() => {
                        setShowFeedbackModal(false);
                        setSelectedVariation(null);
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowFeedbackModal(false);
                        setSelectedVariation(null);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Submit Feedback
                    </button>
                      </div>
                      </div>
                    </div>
            )}

          {/* Complete Step */}
          {currentStep === ONBOARDING_STEPS.COMPLETE && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h3>
                <p className="text-gray-600">You're all set to start creating amazing content</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-8 py-6 bg-white sticky bottom-0 left-0 right-0 z-10">
          {currentStep === ONBOARDING_STEPS.URL_INPUT && (
            <div className="flex justify-center">
              <button
                className={`flex items-center justify-center gap-3 px-12 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${!websiteUrl.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={handleUrlSubmit}
                disabled={!websiteUrl.trim()}
              >
                <ChevronRight className="w-5 h-5" />
                Start Scanning
              </button>
            </div>
          )}

          {currentStep === ONBOARDING_STEPS.BUSINESS_INFO && (
            <button
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={handleBusinessInfoComplete}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {currentStep === ONBOARDING_STEPS.CAMPAIGN_CHOICE && (
              <button
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => handleCampaignChoice('setup')}
            >
                    Continue
                    <ChevronRight className="w-5 h-5" />
              </button>
          )}

          {currentStep === ONBOARDING_STEPS.TIKTOK_SETUP && (
              <button
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={handleTiktokComplete}
              >
              Generate Profile
              <Check className="w-5 h-5" />
              </button>
          )}

          {currentStep === ONBOARDING_STEPS.COMPLETE && (
              <button
              className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={handleComplete}
              >
              Go to Dashboard
              <ChevronRight className="w-5 h-5" />
              </button>
          )}
        </div>
      </div>


    </div>
  );
} 