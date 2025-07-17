import OpenAI from 'openai';
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
   * @returns {Promise<Object>} Analysis result with content description and relevance score
   */
  async analyzeImageContent(imageUrl, prompt = '') {
    const cacheKey = `${imageUrl}-${prompt}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const openaiClient = getOpenAI();
      
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

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o',
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
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

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
      apiLogger.debug(`Visual analysis completed for ${imageUrl}: ${analysis.relevanceScore}/100`);
      
      return analysis;

    } catch (error) {
      apiLogger.error('Error in visual analysis:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Batch analyze multiple images for comparison
   * @param {Array} imageUrls - Array of image URLs to analyze
   * @param {string} prompt - User's original prompt
   * @returns {Promise<Array>} Array of analysis results sorted by relevance
   */
  async analyzeImageBatch(imageUrls, prompt) {
    try {
      const analyses = await Promise.all(
        imageUrls.map(async (imageUrl) => {
          const analysis = await this.analyzeImageContent(imageUrl, prompt);
          return {
            imageUrl,
            ...analysis
          };
        })
      );

      // Sort by relevance score (highest first)
      analyses.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      apiLogger.info(`Batch analysis completed for ${imageUrls.length} images`);
      return analyses;

    } catch (error) {
      apiLogger.error('Error in batch analysis:', error);
      return [];
    }
  }

  /**
   * Check if image is relevant to the prompt using visual analysis
   * @param {string} imageUrl - Image URL to check
   * @param {string} prompt - User's prompt
   * @param {number} threshold - Minimum relevance score (default: 70)
   * @returns {Promise<boolean>} Whether image is relevant
   */
  async isImageRelevant(imageUrl, prompt, threshold = 70) {
    try {
      const analysis = await this.analyzeImageContent(imageUrl, prompt);
      return analysis.relevanceScore >= threshold;
    } catch (error) {
      apiLogger.error('Error checking image relevance:', error);
      return false; // Default to false if analysis fails
    }
  }

  /**
   * Get detailed visual elements from image
   * @param {string} imageUrl - Image URL
   * @returns {Promise<Array>} Array of visual elements
   */
  async getVisualElements(imageUrl) {
    try {
      const analysis = await this.analyzeImageContent(imageUrl);
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