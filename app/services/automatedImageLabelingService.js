import OpenAI from 'openai';
import { visualAnalysisService } from './visualAnalysisService.js';
import { UNIFIED_CATEGORIES } from '../shared/constants/imageCategories.js';
import { apiLogger } from '../utils/logger.js';

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

/**
 * Automated Image Labeling Service
 * Uses OpenAI Vision to automatically analyze and label images for the database
 */
export class AutomatedImageLabelingService {
  constructor() {
    this.cache = new Map();
    this.batchSize = 10; // Process images in batches to avoid rate limits
  }

  /**
   * Generate comprehensive labels for a single image
   * @param {string} imageUrl - URL of the image to analyze
   * @param {string} originalTitle - Optional original title/filename
   * @returns {Promise<Object>} Complete image labeling data
   */
  async generateImageLabels(imageUrl, originalTitle = '') {
    const cacheKey = `labels-${imageUrl}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const openaiClient = getOpenAI();
      
      const systemPrompt = `You are an expert at analyzing images for content creation and marketing. Your task is to provide comprehensive labeling for images that will be used in a content creation platform.

CRITICAL CATEGORIZATION RULES:
- Choose the MOST SPECIFIC category that matches the image content
- If an image could fit multiple categories, choose the one that is MOST PROMINENT in the image
- Use "pool" as default fallback for images that don't clearly fit other categories

ANALYSIS REQUIREMENTS:
1. Create a descriptive, SEO-friendly title (max 100 characters)
2. Write a detailed description (max 200 characters)
3. Assign the most appropriate category from the provided list
4. Generate 10-15 relevant keywords for search and matching
5. Identify visual style, color palette, mood, and content type
6. Determine industry relevance and use cases

AVAILABLE CATEGORIES:
${Object.entries(UNIFIED_CATEGORIES).map(([key, cat]) => `- ${key}: ${cat.name} (${cat.keywords.join(', ')})`).join('\n')}

CATEGORIZATION EXAMPLES:
- Swimming pool, beach, ocean scenes → "pool"
- Sunset, sunrise, golden hour, sky scenes → "sunset_sunrise"
- Artwork, paintings, sculptures, galleries → "art"
- Street scenes, neighborhood walks, urban life → "neighbourhood_walk"
- Luxury items, premium products, high-end scenes → "luxury"
- Default fallback for unclear images → "pool"

RESPONSE FORMAT: Return ONLY a JSON object with:
{
  "title": "Descriptive title",
  "description": "Detailed description",
  "category": "category_key",
  "subcategory": "specific_subcategory",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "visualStyle": ["style1", "style2"],
  "colorPalette": ["color1", "color2"],
  "mood": ["mood1", "mood2"],
  "industryTags": ["industry1", "industry2"],
  "contentType": ["type1", "type2"],
  "aspectRatio": "16:9",
  "qualityScore": 85,
  "useCases": ["use_case1", "use_case2"],
  "aiGenerated": true
}

GUIDELINES:
- Be specific and descriptive in titles and descriptions
- Choose the most relevant category from the provided list
- Include both broad and specific keywords
- Consider marketing and content creation use cases
- Quality score should reflect image quality and usefulness (1-100)
- Use cases should describe when this image would be most effective
- AVOID over-categorizing as "business" - only use for actual business/professional content

EXAMPLES:
For a professional office meeting image:
{
  "title": "Professional team collaboration in modern office",
  "description": "Diverse team members engaged in productive meeting around conference table in contemporary office setting",
  "category": "business",
  "subcategory": "meetings",
  "keywords": ["business", "office", "meeting", "team", "collaboration", "professional", "workplace", "conference", "corporate", "diverse", "modern"],
  "visualStyle": ["professional", "modern", "clean"],
  "colorPalette": ["blue", "white", "gray"],
  "mood": ["professional", "focused", "collaborative"],
  "industryTags": ["corporate", "consulting", "finance"],
  "contentType": ["photograph", "background"],
  "aspectRatio": "16:9",
  "qualityScore": 90,
  "useCases": ["business presentations", "team collaboration content", "corporate communications"],
  "aiGenerated": true
}

For a person running in nature:
{
  "title": "Athlete running through scenic mountain trail",
  "description": "Focused runner in athletic gear jogging along a beautiful mountain path with stunning natural backdrop",
  "category": "sports",
  "subcategory": "running",
  "keywords": ["running", "athlete", "fitness", "outdoor", "nature", "trail", "mountain", "exercise", "health", "active", "scenic"],
  "visualStyle": ["natural", "dynamic", "outdoor"],
  "colorPalette": ["green", "brown", "blue"],
  "mood": ["energetic", "focused", "inspiring"],
  "industryTags": ["fitness", "outdoor sports"],
  "contentType": ["photograph", "action"],
  "aspectRatio": "16:9",
  "qualityScore": 88,
  "useCases": ["fitness content", "outdoor sports marketing", "health and wellness"],
  "aiGenerated": true
}`;

      const userPrompt = `Analyze this image and provide comprehensive labeling for content creation.

${originalTitle ? `Original title: ${originalTitle}` : ''}

Please provide detailed analysis and labeling that will help users find this image for their content creation needs.`;

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from image labeling');
      }

      let labels;
      try {
        labels = JSON.parse(response);
      } catch (parseError) {
        apiLogger.error('Failed to parse image labeling response:', parseError);
        return this.getFallbackLabels(imageUrl, originalTitle);
      }

      // Validate and enhance labels
      const validatedLabels = this.validateAndEnhanceLabels(labels, imageUrl);
      
      // Post-process to prevent over-categorization as business
      const correctedLabels = this.correctBusinessOvercategorization(validatedLabels, imageUrl);
      
      this.cache.set(cacheKey, correctedLabels);
      apiLogger.info(`Generated labels for image: ${correctedLabels.title} (category: ${correctedLabels.category})`);
      
      return correctedLabels;

    } catch (error) {
      apiLogger.error('Error in automated image labeling:', error);
      return this.getFallbackLabels(imageUrl, originalTitle);
    }
  }

  /**
   * Batch process multiple images for labeling
   * @param {Array} images - Array of image objects with url and optional title
   * @returns {Promise<Array>} Array of labeled images
   */
  async batchLabelImages(images) {
    const results = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < images.length; i += this.batchSize) {
      const batch = images.slice(i, i + this.batchSize);
      
      apiLogger.info(`Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(images.length / this.batchSize)}`);
      
      const batchResults = await Promise.all(
        batch.map(async (image) => {
          try {
            const labels = await this.generateImageLabels(image.url, image.title);
            return {
              ...image,
              ...labels
            };
          } catch (error) {
            apiLogger.error(`Failed to label image ${image.url}:`, error);
            return {
              ...image,
              ...this.getFallbackLabels(image.url, image.title)
            };
          }
        })
      );
      
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + this.batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    apiLogger.info(`Completed batch labeling for ${images.length} images`);
    return results;
  }

  /**
   * Validate and enhance generated labels
   * @param {Object} labels - Raw labels from AI
   * @param {string} imageUrl - Image URL for reference
   * @returns {Object} Validated and enhanced labels
   */
  validateAndEnhanceLabels(labels, imageUrl) {
    // Ensure required fields exist
    const validated = {
      title: labels.title || 'Untitled image',
      description: labels.description || 'Image content',
      category: this.validateCategory(labels.category),
      subcategory: labels.subcategory || '',
      keywords: Array.isArray(labels.keywords) ? labels.keywords.slice(0, 15) : [],
      visualStyle: Array.isArray(labels.visualStyle) ? labels.visualStyle : [],
      colorPalette: Array.isArray(labels.colorPalette) ? labels.colorPalette : [],
      mood: Array.isArray(labels.mood) ? labels.mood : [],
      industryTags: Array.isArray(labels.industryTags) ? labels.industryTags : [],
      contentType: Array.isArray(labels.contentType) ? labels.contentType : [],
      aspectRatio: labels.aspectRatio || '16:9',
      qualityScore: Math.min(Math.max(labels.qualityScore || 70, 1), 100),
      useCases: Array.isArray(labels.useCases) ? labels.useCases : [],
      aiGenerated: true,
      imageUrl: imageUrl,
      createdAt: new Date().toISOString()
    };

    // Enhance keywords with category-specific terms
    validated.keywords = this.enhanceKeywords(validated.keywords, validated.category);
    
    // Ensure title and description are within limits
    validated.title = validated.title.substring(0, 100);
    validated.description = validated.description.substring(0, 200);

    return validated;
  }

  /**
   * Validate category against available categories
   * @param {string} category - Category to validate
   * @returns {string} Valid category
   */
  validateCategory(category) {
    const validCategories = Object.keys(UNIFIED_CATEGORIES);
    if (validCategories.includes(category)) {
      return category;
    }
    
    // Try to find a similar category
    const categoryLower = category.toLowerCase();
    for (const validCat of validCategories) {
      if (validCat.includes(categoryLower) || categoryLower.includes(validCat)) {
        return validCat;
      }
    }
    
    // Default to pool for unknown categories
    return 'pool';
  }

  /**
   * Enhance keywords with category-specific terms
   * @param {Array} keywords - Original keywords
   * @param {string} category - Image category
   * @returns {Array} Enhanced keywords
   */
  enhanceKeywords(keywords, category) {
    const categoryData = UNIFIED_CATEGORIES[category];
    if (!categoryData) return keywords;

    // Add category-specific keywords if not already present
    const enhanced = [...keywords];
    categoryData.keywords.forEach(keyword => {
      if (!enhanced.includes(keyword)) {
        enhanced.push(keyword);
      }
    });

    // Limit to 15 keywords total
    return enhanced.slice(0, 15);
  }

  /**
   * Get fallback labels when AI analysis fails
   * @param {string} imageUrl - Image URL
   * @param {string} originalTitle - Original title
   * @returns {Object} Fallback labels
   */
  getFallbackLabels(imageUrl, originalTitle = '') {
    return {
      title: originalTitle || 'Image',
      description: 'Image content',
      category: 'pool',
      subcategory: '',
      keywords: ['image', 'content'],
      visualStyle: ['unknown'],
      colorPalette: [],
      mood: ['neutral'],
      industryTags: [],
      contentType: ['image'],
      aspectRatio: '16:9',
      qualityScore: 50,
      useCases: ['general content'],
      aiGenerated: true,
      imageUrl: imageUrl,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Post-process labels to prevent over-categorization as business
   * @param {Object} labels - Validated labels
   * @param {string} imageUrl - Image URL for reference
   * @returns {Object} Corrected labels
   */
  correctBusinessOvercategorization(labels, imageUrl) {
    // If categorized as luxury, check if it should be something else
    if (labels.category === 'luxury') {
      const title = labels.title.toLowerCase();
      const description = (labels.description || '').toLowerCase();
      const keywords = labels.keywords.map(k => k.toLowerCase());
      
      // Check for indicators that suggest other categories
      const categoryIndicators = {
        pool: ['swimming', 'pool', 'beach', 'ocean', 'water', 'aquatic', 'swimming pool', 'poolside'],
        sunset_sunrise: ['sunset', 'sunrise', 'golden hour', 'dusk', 'dawn', 'twilight', 'morning', 'evening', 'sky', 'horizon'],
        art: ['art', 'artistic', 'creative', 'painting', 'sculpture', 'gallery', 'museum', 'design', 'aesthetic', 'creative'],
        neighbourhood_walk: ['neighbourhood', 'walk', 'street', 'local', 'community', 'residential', 'sidewalk', 'walking', 'urban', 'city']
      };
      
      // Check if any other category indicators are more prominent
      for (const [category, indicators] of Object.entries(categoryIndicators)) {
        const matches = indicators.filter(indicator => 
          title.includes(indicator) || 
          description.includes(indicator) || 
          keywords.some(k => k.includes(indicator))
        );
        
        // If we find strong indicators for another category, switch to it
        if (matches.length >= 2) {
          apiLogger.info(`Correcting business category to ${category} for image: ${labels.title}`);
          labels.category = category;
          break;
        }
      }
    }
    
    return labels;
  }

  /**
   * Clear labeling cache
   */
  clearCache() {
    this.cache.clear();
    apiLogger.debug('Automated image labeling cache cleared');
  }
}

// Export singleton instance
export const automatedImageLabelingService = new AutomatedImageLabelingService(); 