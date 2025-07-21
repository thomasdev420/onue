import OpenAI from 'openai';
import { apiLogger } from '../utils/logger.js';
import { getModelConfig } from '../utils/modelSelection.js';

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
 * Visual Analysis Service
 * Uses OpenAI's GPT-4 Vision to analyze image content and provide detailed descriptions
 */
export class VisualAnalysisService {
  constructor() {
    this.cache = new Map();
    this.analysisCache = new Map();
  }

  /**
   * Analyze image content using GPT-4 Vision
   * @param {string} imageUrl - URL of the image to analyze
   * @param {string} prompt - User's original prompt for context
   * @param {string} intelligenceMode - Intelligence mode ('normal' or 'max')
   * @returns {Promise<Object>} Analysis result with content description and relevance score
   */
  async analyzeImageContent(imageUrl, prompt = '', intelligenceMode = 'normal') {
    const cacheKey = `${imageUrl}-${prompt}-${intelligenceMode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const openaiClient = getOpenAI();
      
      // Get model configuration based on intelligence mode
      const modelConfig = getModelConfig(intelligenceMode, prompt, {}, 'visual');
      apiLogger.debug(`Using model config for visual analysis (${intelligenceMode} mode):`, {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      });
      
      const systemPrompt = `You are an expert at analyzing images for content creation. Your task is to:

1. Describe the visual content of the image in detail
2. Identify key visual elements, objects, people, scenes, and themes
3. Assess relevance to the user's content request
4. Provide a relevance score (0-100) based on how well the image matches the request

ANALYSIS GUIDELINES:
- Be specific about visual elements (e.g., "knight in armor" not just "person")
- Identify objects, people, settings, colors, and mood
- Consider the overall theme and atmosphere
- Rate relevance based on visual content, not just title/keywords

RESPONSE FORMAT: Return ONLY a JSON object with:
{
  "description": "Detailed visual description",
  "visualElements": ["element1", "element2", "element3"],
  "theme": "Overall theme or mood",
  "relevanceScore": 85,
  "relevanceReason": "Why this score was given"
}

EXAMPLE:
User request: "Create slides about knights"
Image analysis: {
  "description": "A painting showing a young man in ornate dark metal armor with curly blonde hair, looking slightly upward. He appears to be a knight in classical armor with a warm glowing light source in the background.",
  "visualElements": ["knight", "armor", "classical painting", "blonde hair", "warm lighting"],
  "theme": "Medieval knight, classical art",
  "relevanceScore": 95,
  "relevanceReason": "Directly shows a knight in armor, perfect match for knight-themed content"
}`;

      const userPrompt = `Analyze this image for content creation.

User's request: "${prompt}"

Please provide a detailed analysis of the visual content and relevance to the user's request.`;

      // Add rate limit handling with retry logic
      let completion;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          completion = await openaiClient.chat.completions.create({
            model: modelConfig.model,
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
            max_tokens: modelConfig.max_tokens,
            temperature: modelConfig.temperature,
            top_p: modelConfig.top_p,
            frequency_penalty: modelConfig.frequency_penalty,
            presence_penalty: modelConfig.presence_penalty,
            response_format: { type: 'json_object' }
          });
          break; // Success, exit retry loop
        } catch (error) {
          if (error.code === 'rate_limit_exceeded' && retries < maxRetries - 1) {
            const retryAfter = parseInt(error.headers?.['retry-after-ms']) || 1000;
            apiLogger.warn(`⚠️ Rate limit hit in visual analysis, retrying in ${retryAfter}ms (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            retries++;
          } else {
            throw error; // Re-throw if not rate limit or max retries reached
          }
        }
      }

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from visual analysis');
      }

      let analysis;
      try {
        analysis = JSON.parse(response);
      } catch (parseError) {
        apiLogger.error('Failed to parse visual analysis response:', parseError);
        return this.getFallbackAnalysis();
      }

      // Validate analysis structure
      if (!analysis.description || typeof analysis.relevanceScore !== 'number') {
        apiLogger.warn('Invalid analysis structure, using fallback');
        return this.getFallbackAnalysis();
      }

      this.cache.set(cacheKey, analysis);
      apiLogger.debug(`Visual analysis completed for ${imageUrl} (${intelligenceMode} mode): ${analysis.relevanceScore}/100`);
      
      return analysis;

    } catch (error) {
      if (error.code === 'rate_limit_exceeded') {
        apiLogger.warn('⚠️ Rate limit exceeded in visual analysis, using fallback');
        return this.getFallbackAnalysis();
      }
      apiLogger.error('Error in visual analysis:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Batch analyze multiple images for comparison
   * @param {Array} imageUrls - Array of image URLs to analyze
   * @param {string} prompt - User's original prompt
   * @param {string} intelligenceMode - Intelligence mode ('normal' or 'max')
   * @returns {Promise<Array>} Array of analysis results sorted by relevance
   */
  async analyzeImageBatch(imageUrls, prompt, intelligenceMode = 'normal') {
    try {
      const analyses = await Promise.all(
        imageUrls.map(async (imageUrl) => {
          const analysis = await this.analyzeImageContent(imageUrl, prompt, intelligenceMode);
          return {
            imageUrl,
            ...analysis
          };
        })
      );

      // Sort by relevance score (highest first)
      analyses.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      apiLogger.info(`Batch analysis completed for ${imageUrls.length} images (${intelligenceMode} mode)`);
      return analyses;

    } catch (error) {
      if (error.code === 'rate_limit_exceeded') {
        apiLogger.warn('⚠️ Rate limit exceeded in batch analysis, returning empty results');
        return [];
      }
      apiLogger.error('Error in batch analysis:', error);
      return [];
    }
  }

  /**
   * Check if image is relevant to the prompt using visual analysis
   * @param {string} imageUrl - Image URL to check
   * @param {string} prompt - User's prompt
   * @param {number} threshold - Minimum relevance score (default: 70)
   * @param {string} intelligenceMode - Intelligence mode ('normal' or 'max')
   * @returns {Promise<boolean>} Whether image is relevant
   */
  async isImageRelevant(imageUrl, prompt, threshold = 70, intelligenceMode = 'normal') {
    try {
      const analysis = await this.analyzeImageContent(imageUrl, prompt, intelligenceMode);
      return analysis.relevanceScore >= threshold;
    } catch (error) {
      apiLogger.error('Error checking image relevance:', error);
      return false; // Default to false if analysis fails
    }
  }

  /**
   * Get detailed visual elements from image
   * @param {string} imageUrl - Image URL
   * @param {string} intelligenceMode - Intelligence mode ('normal' or 'max')
   * @returns {Promise<Array>} Array of visual elements
   */
  async getVisualElements(imageUrl, intelligenceMode = 'normal') {
    try {
      const analysis = await this.analyzeImageContent(imageUrl, '', intelligenceMode);
      return analysis.visualElements || [];
    } catch (error) {
      apiLogger.error('Error getting visual elements:', error);
      return [];
    }
  }

  /**
   * Fallback analysis when AI analysis fails
   * @returns {Object} Fallback analysis result
   */
  getFallbackAnalysis() {
    return {
      description: "Image content could not be analyzed",
      visualElements: [],
      theme: "unknown",
      relevanceScore: 50,
      relevanceReason: "Analysis failed, using neutral score"
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.cache.clear();
    this.analysisCache.clear();
    apiLogger.debug('Visual analysis cache cleared');
  }
}

// Export singleton instance
export const visualAnalysisService = new VisualAnalysisService(); 