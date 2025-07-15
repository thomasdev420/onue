import { getSupabase } from '../../supabaseClient';
import { apiLogger } from '../utils/logger';
import OpenAI from 'openai';
import { buildContextAwarePrompt } from '../utils/contextPriority.js';
import { retrieveUserMemory, buildMemoryContext, extractMemoryInsights, storeMemoryInsights } from './aiMemoryService.js';
import { UNIFIED_CATEGORIES, getCategoryKeywords } from '../shared/constants/imageCategories.js';

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
const STOCK_PHOTO_CATEGORIES = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => [key, value.keywords])
);

/**
 * Unified Content Engine - Single service for generating complete slide content
 * Combines text generation and image selection into one streamlined process
 */
export class UnifiedContentEngine {
  constructor() {
    this.cache = new Map();
    this.categoryCache = new Map();
    this.usedImages = new Set();
  }

  /**
   * Detect categories mentioned in user prompt
   * @param {string} prompt - User prompt
   * @returns {Array} Array of detected categories
   */
  detectCategoriesFromPrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const detectedCategories = [];
    
    for (const [category, categoryData] of Object.entries(UNIFIED_CATEGORIES)) {
      for (const keyword of categoryData.keywords) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          detectedCategories.push(category);
          break; // Found one keyword for this category, move to next
        }
      }
    }
    
    apiLogger.debug(`Detected categories from prompt: ${detectedCategories.join(', ')}`);
    return detectedCategories;
  }

  /**
   * Generate complete slides with text and images in one unified process
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - User prompt
   * @param {number} params.slideCount - Number of slides to generate
   * @param {Object} params.businessContext - Business context
   * @param {Object} params.userInfo - User information
   * @param {Array} params.existingSlides - Existing slides for context
   * @returns {Promise<Array>} Complete slides with text and images
   */
  async generateCompleteSlides({ prompt, slideCount = 5, businessContext, userInfo, existingSlides = [] }) {
    try {
      apiLogger.debug(`Generating ${slideCount} complete slides for prompt: "${prompt}"`);
      
      // Clear used images tracking and cache for new generation
      this.usedImages.clear();
      this.cache.clear();
      this.categoryCache.clear(); // Also clear category cache to get fresh images
      
      // Detect categories from user prompt
      const detectedCategories = this.detectCategoriesFromPrompt(prompt);
      const allowedCategories = detectedCategories.length > 0 ? detectedCategories : ['business'];
      
      apiLogger.debug(`Using categories: ${allowedCategories.join(', ')}`);
      
      // Build context-aware prompt
      const context = { businessContext, userInfo };
      let systemPrompt = buildContextAwarePrompt(context, prompt);
      
      // Add existing slides context if available
      if (existingSlides && existingSlides.length > 0) {
        const existingSlidesContext = existingSlides.map((slide, index) => {
          const slideTexts = slide.texts?.map(text => text.content).join(' | ') || 'No text';
          return `Slide ${index + 1}: ${slideTexts}`;
        }).join('\n');
        
        systemPrompt += `\n\nEXISTING SLIDES CONTEXT:\n${existingSlidesContext}\n\nIMPORTANT: The user already has slides with the content above. Please create new slides that are related to and build upon this existing content. Maintain the same theme, style, and flow.`;
      }
      
      // Add memory context if available
      if (userInfo?.email) {
        const userMemory = await retrieveUserMemory(userInfo.email);
        if (userMemory.length > 0) {
          const memoryContext = buildMemoryContext(userMemory, prompt);
          systemPrompt += memoryContext;
        }
      }
      
      // Enhanced system prompt for unified generation
      systemPrompt += `\n\nYou are a friendly marketing assistant. Create EXACTLY ${slideCount} engaging slides with complete content and image selection.


IMAGE SELECTION SECTION:

You must select the most appropriate UNIFIED_CATEGORIES for each slide session based on the user's prompt.

Available image categories: ${Object.keys(UNIFIED_CATEGORIES).join(', ')}

Image Selection Rules:
1. Choose ONE UNIFIED_CATEGORIES that closest matches the user's prompt.
2. select as many images from the UNIFIED_CATEGORIES as user requests eg make 5 slides, select 5 images.
3. NEVER use the same image twice for the same generation.

CRITICAL TEXT REQUIREMENTS:
1. Each slide MUST contain 70-175 characters of detailed, informative text
2. Include specific details, facts, statistics, examples, or actionable insights
3. Make each slide self-contained with enough information to be valuable
4. Use engaging, descriptive language that educates and informs

Basic Slide Instructions:
1. Each slide should have only one main idea or topic
2. Never combine multiple points or topics on a single slide
3. Each slide must be a separate object in the JSON array
4. No '#', ':' or '-' in the content EVER

SLIDE NUMBERING REQUIREMENTS:
- The first slide should explain what the content will be for the rest of the slides (e.g., "11 Things people learn too late in life")

ABSOLUTE RULES SECTION:
CRITICAL: You MUST return EXACTLY ${slideCount} slides. No more, no less. Count carefully.
YOU MUST RETURN VALID JSON ONLY. No explanations, no markdown, just the JSON array.
Each slide object must have: texts array, imageCategory, and ratio field.
Texts array must contain objects with id, content and position fields.
Each text object MUST have a unique id field (e.g., "text-1-1", "text-2-1", etc.).
Ratio must be "9:16" for all slides.

LOOK AT THE EXAMPLE FORMAT BELOW CAREFULLY, EXAMPLE FORMAT:

user prompt: "make 6 slides about things people learn too late in life"

slide 1:
[{
  "texts": [{
    "id": "text-1-1",
    "content": "1. your body is not invisible",
    "position": {"x": 50, "y": 40}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}]

slide 2:
[{
  "texts": [{
    "id": "text-2-1",
    "content": "1. your body is not invisible",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-2-2",
    "content": "the choices you make in your 20s and 30s will affect the quality of life in your 50s and beyond",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}]

slide 3:
[{
  "texts": [{   
    "id": "text-3-1",
    "content": "2. displine beats motivation",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-3-2",
    "content": "motivation is temporary but showing up even when you don't feel like it is what makes real progress",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}]

slide 4:
[{
  "texts": [{
    "id": "text-4-1",
    "content": "3. comparison steals peogress",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-4-2",
    "content": "the only person you should be competing against is the person you were yesterday",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}]

slide 5:
[{
  "texts": [{
    "id": "text-5-1",
    "content": "4. conssitnacy > intensity",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-5-2",
    "content": "making small progress consistently is better than the occasional all our effort",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}]

slide 6:
[{
  "texts": [{
    "id": "text-6-1",
    "content": "5. your habits shape your future",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-6-2",
    "content": "small daily habits compound both negatively and positively",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}]`;

      // Generate content using OpenAI
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      let slides = [];
      try {
        slides = JSON.parse(completion.choices[0].message.content);
        if (!Array.isArray(slides)) throw new Error('Not an array');
      } catch (e) {
        apiLogger.error('Failed to parse AI response:', e);
        // Fallback parsing logic
        slides = this.parseFallbackResponse(completion.choices[0].message.content, slideCount, allowedCategories);
      }

      // Validate and enhance slides
      slides = slides.map((slide, idx) => ({
        id: slide.id || `slide-${Date.now()}-${idx}`,
        texts: (slide.texts || []).map((text, textIdx) => ({
          ...text,
          id: text.id || `text-${Date.now()}-${idx}-${textIdx}`
        })),
        imageCategory: slide.imageCategory || 'business',
        ratio: slide.ratio || '9:16'
      }));

      // Ensure we have the exact number of slides requested
      apiLogger.debug(`AI generated ${slides.length} slides, requested ${slideCount}`);
      if (slides.length !== slideCount) {
        apiLogger.warn(`Generated ${slides.length} slides, expected ${slideCount}. Adjusting...`);
        if (slides.length < slideCount) {
          // Add more slides
          const additionalSlides = this.generateAdditionalSlides(slides, slideCount - slides.length, prompt, allowedCategories);
          slides = [...slides, ...additionalSlides];
          apiLogger.debug(`Added ${additionalSlides.length} additional slides`);
        } else {
          // Trim to requested number
          slides = slides.slice(0, slideCount);
          apiLogger.debug(`Trimmed to ${slideCount} slides`);
        }
      }

      // Apply smart text positioning and add images
      const completeSlides = await Promise.all(
        slides.map((slide, index) => this.enhanceSlideWithImage(slide, index, prompt, allowedCategories))
      );

      // Store memory insights
      if (userInfo?.email && prompt) {
        const insights = extractMemoryInsights(prompt, { businessContext, userInfo });
        if (insights.length > 0) {
          await storeMemoryInsights(userInfo.email, insights);
          apiLogger.debug(`Extracted ${insights.length} memory insights`);
        }
      }

      apiLogger.debug(`Successfully generated ${completeSlides.length} complete slides`);
      return completeSlides;

    } catch (error) {
      apiLogger.error('Error in unified content generation:', error);
      throw error;
    }
  }

  /**
   * Enhance a slide with the appropriate image
   * @param {Object} slide - Slide object
   * @param {number} slideIndex - Slide index
   * @param {string} prompt - Original prompt
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @returns {Promise<Object>} Enhanced slide with image
   */
  async enhanceSlideWithImage(slide, slideIndex, prompt, allowedCategories = ['business']) {
    try {
      // Enforce category restrictions
      let imageCategory = slide.imageCategory || 'business';
      if (!allowedCategories.includes(imageCategory)) {
        apiLogger.warn(`Category "${imageCategory}" not in allowed categories: ${allowedCategories.join(', ')}. Using first allowed category.`);
        imageCategory = allowedCategories[0];
      }
      
      // Select appropriate image based on content and category
      const selectedImage = await this.selectImageForSlide(
        imageCategory,
        slideIndex,
        prompt,
        allowedCategories
      );

      return {
        ...slide,
        image: selectedImage,
        imageCategory: imageCategory,
        texts: slide.texts.map(text => ({
          ...text,
          style: {
            fontSize: '16px',
            color: 'white',
            fontWeight: 'normal',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }
        }))
      };
    } catch (error) {
      apiLogger.error(`Error enhancing slide ${slideIndex}:`, error);
      return slide; // Return slide without image if selection fails
    }
  }

  /**
   * Select image for a specific slide
   * @param {string} imageCategory - Image category
   * @param {number} slideIndex - Slide index
   * @param {string} prompt - Original prompt
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @returns {Promise<Object|null>} Selected image
   */
  async selectImageForSlide(imageCategory, slideIndex, prompt, allowedCategories = ['business']) {
    try {
      // Enforce category restrictions
      if (!allowedCategories.includes(imageCategory)) {
        apiLogger.warn(`Category "${imageCategory}" not in allowed categories: ${allowedCategories.join(', ')}. Using first allowed category.`);
        imageCategory = allowedCategories[0];
      }
      
      const cacheKey = `${imageCategory}-${slideIndex}`;
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Get images for the category
      const keywords = getCategoryKeywords(imageCategory) || getCategoryKeywords('business');
      const images = await this.queryImagesByKeywords(keywords);
      
      if (!images || images.length === 0) {
        apiLogger.warn(`No images found for category: ${imageCategory}`);
        return null;
      }

      // Filter out already used images
      const availableImages = images.filter(img => !this.usedImages.has(img.id));
      
      if (availableImages.length === 0) {
        // If all images are used, reset the used images set and start fresh
        apiLogger.warn(`All images in category "${imageCategory}" have been used. Resetting selection.`);
        this.usedImages.clear();
        
        // Get fresh available images after reset
        const freshAvailableImages = images.filter(img => !this.usedImages.has(img.id));
        if (freshAvailableImages.length > 0) {
          const selectedImage = freshAvailableImages[Math.floor(Math.random() * freshAvailableImages.length)];
          this.usedImages.add(selectedImage.id);
          this.cache.set(cacheKey, selectedImage);
          return selectedImage;
        }
        
        // If still no available images, return the first image
        return images[0];
      }

      // Select a random image from available options
      const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
      this.usedImages.add(selectedImage.id);
      this.cache.set(cacheKey, selectedImage);
      
      apiLogger.debug(`Selected image ${selectedImage.id} for slide ${slideIndex} in category ${imageCategory}`);
      return selectedImage;

    } catch (error) {
      apiLogger.error('Error selecting image for slide:', error);
      return null;
    }
  }

  /**
   * Query images by keywords with caching
   * @param {Array<string>} keywords - Search keywords
   * @returns {Promise<Array>} Matching images
   */
  async queryImagesByKeywords(keywords) {
    const cacheKey = keywords.join(',');
    
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey);
    }

    try {
      const supabase = getSupabase();
      const { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url')
        .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
        .limit(50);

      if (error) {
        apiLogger.error('Supabase error:', error);
        return [];
      }

      this.categoryCache.set(cacheKey, images || []);
      return images || [];
    } catch (error) {
      apiLogger.error('Error querying images:', error);
      return [];
    }
  }

  /**
   * Parse fallback response when JSON parsing fails
   * @param {string} content - AI response content
   * @param {number} slideCount - Expected slide count
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @returns {Array} Parsed slides
   */
  parseFallbackResponse(content, slideCount, allowedCategories = ['business']) {
    let splitSlides = [];
    
    // Try multiple patterns to split slides
    if (content.includes('---')) {
      splitSlides = content.split(/---+/).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\*\*Slide \d+/)) {
      splitSlides = content.split(/\*\*Slide \d+:/).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/Slide \d+:/)) {
      splitSlides = content.split(/Slide \d+:/).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\d+\./)) {
      splitSlides = content.split(/\d+\./).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\d+ /)) {
      splitSlides = content.split(/\d+ /).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\[\{/)) {
      // Try to extract JSON-like content
      const jsonMatches = content.match(/\[\{[^}]*\}[^\]]*\]/g);
      if (jsonMatches) {
        splitSlides = jsonMatches.map(match => match.trim());
      }
    }
    
    const defaultCategory = allowedCategories[0] || 'business';
    
    if (splitSlides.length > 1) {
      return splitSlides.slice(0, slideCount).map((text, index) => ({
        texts: [{ 
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`,
          content: text, 
          position: { x: 50, y: 60 } 
        }],
        imageCategory: defaultCategory
      }));
    } else {
      // If we can't split, create the requested number of slides from the content
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      if (sentences.length >= slideCount) {
        // Use sentences if we have enough
        return sentences.slice(0, slideCount).map((sentence, index) => ({
          texts: [{ 
            id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`,
            content: sentence.trim(), 
            position: { x: 50, y: 60 } 
          }],
          imageCategory: defaultCategory
        }));
      } else {
        // Fallback to word splitting
        const words = content.split(' ');
        const wordsPerSlide = Math.ceil(words.length / slideCount);
        
        const slides = [];
        for (let i = 0; i < slideCount; i++) {
          const start = i * wordsPerSlide;
          const end = Math.min(start + wordsPerSlide, words.length);
          const slideText = words.slice(start, end).join(' ');
          
          slides.push({
            texts: [{ 
              id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${i}`,
              content: slideText, 
              position: { x: 50, y: 60 } 
            }],
            imageCategory: defaultCategory
          });
        }
        return slides;
      }
    }
  }

  /**
   * Generate additional slides if needed
   * @param {Array} existingSlides - Existing slides
   * @param {number} additionalCount - Number of additional slides needed
   * @param {string} prompt - Original prompt
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @returns {Array} Additional slides
   */
  generateAdditionalSlides(existingSlides, additionalCount, prompt, allowedCategories = ['business']) {
    const defaultCategory = allowedCategories[0] || 'business';
    const additionalSlides = [];
    for (let i = 0; i < additionalCount; i++) {
      const slideNumber = existingSlides.length + i + 1;
      additionalSlides.push({
        texts: [{ 
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${i}`,
          content: `${slideNumber} Additional content based on "${prompt}" - This slide provides more insights and information related to the main topic`, 
          position: { x: 50, y: 60 } 
        }],
        imageCategory: defaultCategory
      });
    }
    return additionalSlides;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
    this.categoryCache.clear();
    this.usedImages.clear();
  }
}

// Export singleton instance
export const unifiedContentEngine = new UnifiedContentEngine(); 