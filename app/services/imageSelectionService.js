import { getSupabase } from '../../supabaseClient';
import { apiLogger } from '../utils/logger';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openai = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Stock photo categories with keywords
const STOCK_PHOTO_CATEGORIES = {
  business: ['business', 'office', 'meeting', 'corporate', 'professional', 'work'],
  technology: ['technology', 'computer', 'digital', 'tech', 'innovation', 'software'],
  success: ['success', 'achievement', 'goal', 'target', 'winning', 'victory'],
  motivation: ['motivation', 'inspiration', 'determination', 'strength', 'power'],
  growth: ['growth', 'development', 'progress', 'improvement', 'advancement'],
  creativity: ['creativity', 'art', 'design', 'creative', 'imagination', 'innovation'],
  social_media: ['social', 'media', 'network', 'connection', 'communication'],
  entrepreneurship: ['entrepreneur', 'startup', 'business', 'leadership', 'founder'],
  marketing: ['marketing', 'advertising', 'promotion', 'brand', 'campaign'],
  lifestyle: ['lifestyle', 'life', 'daily', 'routine', 'living', 'personal']
};

/**
 * Enhanced AI-powered image selection service
 */
export class ImageSelectionService {
  constructor() {
    this.cache = new Map();
    this.categoryCache = new Map();
    this.usedImages = new Set(); // Track used images to ensure variety
  }

  /**
   * Select relevant image for a slide with AI-powered selection
   * @param {string} prompt - Slide prompt
   * @param {number} slideIndex - Slide index
   * @param {string} slideContent - Content of the specific slide (optional)
   * @returns {Promise<Object|null>} Selected image
   */
  async selectRelevantImage(prompt, slideIndex, slideContent = null) {
    const cacheKey = `${prompt}-${slideIndex}-${slideContent || 'no-content'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      apiLogger.debug('Image selection cache hit:', cacheKey);
      return this.cache.get(cacheKey);
    }

    // Clear used images tracking for new prompt
    if (slideIndex === 0) {
      this.usedImages.clear();
      apiLogger.debug('Cleared used images tracking for new prompt');
    }

    try {
      apiLogger.debug(`Selecting image for slide ${slideIndex + 1}, prompt: "${prompt}"`);
      
      // First, get a broad set of relevant images
      const category = this.determineCategory(prompt);
      const keywords = STOCK_PHOTO_CATEGORIES[category] || STOCK_PHOTO_CATEGORIES['business'];
      const images = await this.queryImagesByKeywords(keywords);
      
      if (images && images.length > 0) {
        // Use AI to select the best image from the available options
        const selectedImage = await this.selectBestImageWithAI(images, prompt, slideIndex, slideContent);
        
        if (selectedImage) {
          // Track this image as used
          this.usedImages.add(selectedImage.id);
          apiLogger.debug(`AI selected image: ${selectedImage.title} (ID: ${selectedImage.id})`);
          this.cache.set(cacheKey, selectedImage);
          return selectedImage;
        }
      }
      
      // Fallback to traditional selection if AI fails
      apiLogger.debug('AI selection failed, using fallback');
      const fallbackImages = await this.queryImagesByKeywords(['business', 'office']);
      
      if (fallbackImages && fallbackImages.length > 0) {
        const selectedImage = this.selectBestImageFallback(fallbackImages, prompt, slideIndex);
        apiLogger.debug(`Fallback selected image: ${selectedImage.title}`);
        this.cache.set(cacheKey, selectedImage);
        return selectedImage;
      }
      
      return null;
    } catch (error) {
      apiLogger.error('Error selecting image:', error);
      // Try fallback on error
      try {
        const fallbackImages = await this.queryImagesByKeywords(['business', 'office']);
        if (fallbackImages && fallbackImages.length > 0) {
          return this.selectBestImageFallback(fallbackImages, prompt, slideIndex);
        }
      } catch (fallbackError) {
        apiLogger.error('Fallback image selection also failed:', fallbackError);
      }
      return null;
    }
  }

  /**
   * Use AI to select the best image from available options
   * @param {Array} images - Available images
   * @param {string} prompt - Slide prompt
   * @param {number} slideIndex - Slide index
   * @param {string} slideContent - Content of the specific slide
   * @returns {Promise<Object|null>} Best image selected by AI
   */
  async selectBestImageWithAI(images, prompt, slideIndex, slideContent) {
    try {
      // Log available images for debugging
      apiLogger.debug(`Available images for slide ${slideIndex + 1}:`, images.map((img, idx) => `${idx + 1}. ${img.title}`));
      
      // Create a context string for the AI
      const context = slideContent 
        ? `Slide ${slideIndex + 1} content: "${slideContent}"`
        : `Slide ${slideIndex + 1} from prompt: "${prompt}"`;
      
      // Filter out already used images
      const availableImages = images.filter(img => !this.usedImages.has(img.id));
      const imageOptions = availableImages.map((img, idx) => `${idx + 1}. ${img.title}`).join('\n');
      
      if (availableImages.length === 0) {
        apiLogger.warn('All images have been used, resetting used images tracking');
        this.usedImages.clear();
        return images[0]; // Return first image as fallback
      }
      
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at selecting the most relevant stock photos for social media content. 
            
            Given a slide's content and context, you need to select the most appropriate image from a list of available stock photos.
            
            Consider:
            - Visual relevance to the content
            - Emotional tone and mood
            - Professional quality and appeal
            - Suitability for social media engagement
            
            IMPORTANT: You must select a DIFFERENT image for each slide to ensure variety. 
            If this is slide ${slideIndex + 1}, avoid selecting the same image as previous slides.
            
            Return ONLY the number (1, 2, 3, etc.) of the best image, nothing else.`
          },
          {
            role: "user",
            content: `Context: ${context}

Available images (${availableImages.length} total):
${imageOptions}

Which image number (1-${availableImages.length}) would be most relevant for this slide? Consider the content, tone, and visual appeal.`
          }
        ],
        max_tokens: 10,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content.trim();
      apiLogger.debug(`AI response for slide ${slideIndex + 1}: "${response}"`);
      
      const selectedIndex = parseInt(response) - 1; // Convert to 0-based index
      
      if (selectedIndex >= 0 && selectedIndex < availableImages.length) {
        const selectedImage = availableImages[selectedIndex];
        apiLogger.debug(`AI selected image ${selectedIndex + 1}: "${selectedImage.title}"`);
        return selectedImage;
      }
      
      // If AI response is invalid, fall back to first available image
      apiLogger.warn('Invalid AI response for image selection, using first available image');
      return availableImages[0];
      
    } catch (error) {
      apiLogger.error('AI image selection failed:', error);
      return null;
    }
  }

  /**
   * Fallback image selection method (original logic)
   * @param {Array} images - Available images
   * @param {string} prompt - Slide prompt
   * @param {number} slideIndex - Slide index
   * @returns {Object} Selected image
   */
  selectBestImageFallback(images, prompt, slideIndex) {
    // Use slide index to select different images for variety
    const imageIndex = slideIndex % images.length;
    return images[imageIndex];
  }

  /**
   * Determine category from prompt using simple keyword matching
   * @param {string} prompt - Slide prompt
   * @returns {string} Category name
   */
  determineCategory(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    for (const [category, keywords] of Object.entries(STOCK_PHOTO_CATEGORIES)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'business'; // Default fallback
  }

  /**
   * Query images by keywords with caching
   * @param {Array<string>} keywords - Search keywords
   * @returns {Promise<Array>} Matching images
   */
  async queryImagesByKeywords(keywords) {
    const cacheKey = keywords.join(',');
    
    if (this.categoryCache.has(cacheKey)) {
      apiLogger.debug('Using cached images for keywords:', keywords);
      return this.categoryCache.get(cacheKey);
    }

    try {
      apiLogger.debug('Querying images with keywords:', keywords);
      
      const supabase = getSupabase();
      const { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url')
        .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
        .limit(20);

      if (error) {
        apiLogger.error('Supabase error:', error);
        return [];
      }

      apiLogger.debug(`Found ${images?.length || 0} images for keywords:`, keywords);
      if (images && images.length > 0) {
        apiLogger.debug('Image titles found:', images.map(img => img.title));
      }

      // Cache the result
      this.categoryCache.set(cacheKey, images || []);
      return images || [];
    } catch (error) {
      apiLogger.error('Error querying images:', error);
      return [];
    }
  }

  /**
   * Select the best image from a list based on relevance (legacy method)
   * @param {Array} images - Available images
   * @param {string} prompt - Slide prompt
   * @param {number} slideIndex - Slide index to ensure variety
   * @returns {Object} Best image
   */
  selectBestImage(images, prompt, slideIndex) {
    // Use slide index to select different images for variety
    const imageIndex = slideIndex % images.length;
    return images[imageIndex];
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
    this.categoryCache.clear();
  }
}

// Export singleton instance
export const imageSelectionService = new ImageSelectionService(); 