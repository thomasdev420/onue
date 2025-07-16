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
      systemPrompt += `\n\nYou are a professional content creator specializing in engaging social media slides. Create EXACTLY ${slideCount} high-quality slides with valuable, informative content.

CRITICAL CONTENT REQUIREMENTS:
1. Each slide MUST contain 70-175 characters of valuable, educational content
2. Include specific facts, statistics, actionable tips, or insightful observations
3. Make each slide self-contained with enough information to be valuable
4. Use clear, engaging language that educates and informs
5. Focus on providing real value, not generic statements
6. Each slide should teach something specific or provide actionable insights

CONTENT EXAMPLES:
✅ GOOD: "The average person spends 2.5 hours daily on social media, equivalent to 38 days per year"
✅ GOOD: "Compound interest can turn $10,000 into $100,000 in 25 years at 9% return"
✅ GOOD: "Reading 20 pages daily equals 30 books per year, putting you in the top 1% of readers"
❌ BAD: "Social media is important for business"
❌ BAD: "Investing is good for your future"
❌ BAD: "Reading books helps you grow"

IMAGE SELECTION:
1. Select only the most appropriate unified categories based on the user prompt, only select one category. So users do not get a mix of diffrent image categories.
Available image categories: ${Object.keys(UNIFIED_CATEGORIES).join(', ')}

SLIDE STRUCTURE:
1. Each slide should focus on ONE specific point or insight
2. No '#', ':' or '-' in the content EVER
3. The first slide should introduce the topic (e.g., "5 hidden strengths INTJ didn't realize they had")

ABSOLUTE RULES:
1. CRITICAL: You MUST return EXACTLY ${slideCount} slides. No more, no less.
2. NEVER use the same image twice in the same slide generation.
2. YOU MUST RETURN VALID JSON ONLY. No explanations, no markdown, just the JSON array.
3. Each slide object must have: texts array, imageCategory, and ratio field.
4. Texts array must contain objects with id, content and position fields.
5. Each text object MUST have a unique id field (e.g., "text-1-1", "text-2-1", etc.).
6. Ratio must be "9:16" for all slides.

EXAMPLE FORMAT:
You should return the following format:
user prompt: "make 6 slides about things people learn too late in life"

[{
  "texts": [{
    "id": "text-1-1",
    "content": "11 things people learn too late in life",
    "position": {"x": 50, "y": 40}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}, {
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
}, {
  "texts": [{   
    "id": "text-3-1",
    "content": "2. discipline beats motivation",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-3-2",
    "content": "motivation is temporary but showing up even when you don't feel like it is what makes real progress",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-4-1",
    "content": "3. comparison steals progress",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-4-2",
    "content": "the only person you should be competing against is the person you were yesterday",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-5-1",
    "content": "4. consistency over intensity",
    "position": {"x": 50, "y": 35}
  }, {
    "id": "text-5-2",
    "content": "making small progress consistently is better than the occasional all out effort",
    "position": {"x": 50, "y": 50}
  }],
  "imageCategory": "lifestyle",
  "ratio": "9:16"
}, {
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

      // Validate and enhance slides with proper unique IDs
      slides = slides.map((slide, idx) => {
        const slideId = slide.id || `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${idx}`;
        return {
          id: slideId,
          texts: (slide.texts || []).map((text, textIdx) => ({
            ...text,
            id: text.id || `text-${slideId}-${textIdx}`
          })),
          imageCategory: slide.imageCategory || 'business',
          ratio: slide.ratio || '9:16'
        };
      });

      // Ensure we have the exact number of slides requested
      apiLogger.debug(`AI generated ${slides.length} slides, requested ${slideCount}`);
      if (slides.length !== slideCount) {
        apiLogger.warn(`Generated ${slides.length} slides, expected ${slideCount}. Adjusting...`);
        if (slides.length < slideCount) {
          // Instead of generating placeholder slides, just use what we have
          // This prevents the creation of generic "Additional content" slides
          apiLogger.debug(`Using ${slides.length} slides instead of requested ${slideCount} to avoid placeholder content`);
        } else {
          // Trim to requested number
          slides = slides.slice(0, slideCount);
          apiLogger.debug(`Trimmed to ${slideCount} slides`);
        }
      }

      // Apply smart text positioning and add images - process sequentially to prevent race conditions
      const completeSlides = [];
      for (let i = 0; i < slides.length; i++) {
        const enhancedSlide = await this.enhanceSlideWithImage(slides[i], i, prompt, allowedCategories);
        completeSlides.push(enhancedSlide);
      }

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
      
      // Get images for the category
      const keywords = getCategoryKeywords(imageCategory) || getCategoryKeywords('business');
      const images = await this.queryImagesByKeywords(keywords);
      
      if (!images || images.length === 0) {
        apiLogger.warn(`No images found for category: ${imageCategory}`);
        return null;
      }

      // Filter out already used images FIRST - this is critical to prevent duplicates
      const availableImages = images.filter(img => !this.usedImages.has(img.id));
      
      if (availableImages.length === 0) {
        // Only reset if we've used more than 80% of available images to prevent premature resets
        const usedPercentage = this.usedImages.size / images.length;
        if (usedPercentage > 0.8) {
          apiLogger.warn(`Used ${usedPercentage * 100}% of images in category "${imageCategory}". Resetting selection.`);
          this.usedImages.clear();
          
          // Get fresh available images after reset
          const freshAvailableImages = images.filter(img => !this.usedImages.has(img.id));
          if (freshAvailableImages.length > 0) {
            const selectedImage = freshAvailableImages[Math.floor(Math.random() * freshAvailableImages.length)];
            this.usedImages.add(selectedImage.id);
            apiLogger.debug(`Selected image ${selectedImage.id} for slide ${slideIndex} in category ${imageCategory} (after reset)`);
            return selectedImage;
          }
        }
        
        // If we can't reset or still no available images, pick a random image from all images
        // But still avoid duplicates by checking if it's already used
        const unusedImages = images.filter(img => !this.usedImages.has(img.id));
        if (unusedImages.length > 0) {
          const randomImage = unusedImages[Math.floor(Math.random() * unusedImages.length)];
          this.usedImages.add(randomImage.id);
          apiLogger.debug(`Selected image ${randomImage.id} for slide ${slideIndex} in category ${imageCategory} (fallback)`);
          return randomImage;
        } else {
          // If all images are used, we have no choice but to reuse one
          const randomImage = images[Math.floor(Math.random() * images.length)];
          apiLogger.warn(`All images in category "${imageCategory}" have been used. Reusing image ${randomImage.id} for slide ${slideIndex}`);
          return randomImage;
        }
      }

      // Select a random image from available options
      const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
      this.usedImages.add(selectedImage.id);
      
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
      return splitSlides.slice(0, slideCount).map((text, index) => {
        const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`;
        return {
          id: slideId,
          texts: [{ 
            id: `text-${slideId}-0`,
            content: text, 
            position: { x: 50, y: 60 } 
          }],
          imageCategory: defaultCategory
        };
      });
    } else {
      // If we can't split, create the requested number of slides from the content
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      if (sentences.length >= slideCount) {
        // Use sentences if we have enough
        return sentences.slice(0, slideCount).map((sentence, index) => {
          const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`;
          return {
            id: slideId,
            texts: [{ 
              id: `text-${slideId}-0`,
              content: sentence.trim(), 
              position: { x: 50, y: 60 } 
            }],
            imageCategory: defaultCategory
          };
        });
      } else {
        // Fallback to word splitting
        const words = content.split(' ');
        const wordsPerSlide = Math.ceil(words.length / slideCount);
        
        const slides = [];
        for (let i = 0; i < slideCount; i++) {
          const start = i * wordsPerSlide;
          const end = Math.min(start + wordsPerSlide, words.length);
          const slideText = words.slice(start, end).join(' ');
          const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${i}`;
          
          slides.push({
            id: slideId,
            texts: [{ 
              id: `text-${slideId}-0`,
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