import { getSupabase } from '../../supabaseClient';
import { apiLogger } from '../utils/logger.js';

/**
 * Image Feedback Service
 * Collects and processes user feedback on image selections to improve future selections
 */
export class ImageFeedbackService {
  constructor() {
    this.feedbackCache = new Map();
  }

  /**
   * Store user feedback about an image selection
   * @param {Object} feedback - Feedback data
   * @param {string} feedback.imageId - Image ID
   * @param {string} feedback.imageUrl - Image URL
   * @param {string} feedback.prompt - Original user prompt
   * @param {string} feedback.feedback - User feedback ('relevant', 'irrelevant', 'perfect')
   * @param {string} feedback.userEmail - User email
   * @param {string} feedback.reason - Optional reason for feedback
   * @returns {Promise<boolean>} Success status
   */
  async storeImageFeedback(feedback) {
    try {
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('image_feedback')
        .insert({
          image_id: feedback.imageId,
          image_url: feedback.imageUrl,
          prompt: feedback.prompt,
          feedback_type: feedback.feedback,
          user_email: feedback.userEmail,
          reason: feedback.reason || null,
          created_at: new Date().toISOString()
        });

      if (error) {
        apiLogger.error('Error storing image feedback:', error);
        return false;
      }

      apiLogger.info(`✅ Image feedback stored: ${feedback.feedback} for image ${feedback.imageId}`);
      return true;

    } catch (error) {
      apiLogger.error('Error in storeImageFeedback:', error);
      return false;
    }
  }

  /**
   * Get feedback statistics for an image
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} Feedback statistics
   */
  async getImageFeedbackStats(imageId) {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('image_feedback')
        .select('feedback_type')
        .eq('image_id', imageId);

      if (error) {
        apiLogger.error('Error getting image feedback stats:', error);
        return { relevant: 0, irrelevant: 0, perfect: 0, total: 0 };
      }

      const stats = {
        relevant: 0,
        irrelevant: 0,
        perfect: 0,
        total: data.length
      };

      data.forEach(feedback => {
        stats[feedback.feedback_type]++;
      });

      return stats;

    } catch (error) {
      apiLogger.error('Error in getImageFeedbackStats:', error);
      return { relevant: 0, irrelevant: 0, perfect: 0, total: 0 };
    }
  }

  /**
   * Get feedback for similar prompts
   * @param {string} prompt - User prompt
   * @param {string} userEmail - User email
   * @returns {Promise<Array>} Array of feedback records
   */
  async getSimilarPromptFeedback(prompt, userEmail) {
    try {
      const supabase = getSupabase();
      
      // Extract key terms from prompt for similarity matching
      const keyTerms = this.extractKeyTerms(prompt);
      
      const { data, error } = await supabase
        .from('image_feedback')
        .select('*')
        .or(keyTerms.map(term => `prompt.ilike.%${term}%`).join(','))
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        apiLogger.error('Error getting similar prompt feedback:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      apiLogger.error('Error in getSimilarPromptFeedback:', error);
      return [];
    }
  }

  /**
   * Get images that received positive feedback for similar prompts
   * @param {string} prompt - User prompt
   * @param {string} userEmail - User email
   * @returns {Promise<Array>} Array of image IDs with positive feedback
   */
  async getPositiveFeedbackImages(prompt, userEmail) {
    try {
      const similarFeedback = await this.getSimilarPromptFeedback(prompt, userEmail);
      
      // Filter for positive feedback (relevant or perfect)
      const positiveFeedback = similarFeedback.filter(feedback => 
        feedback.feedback_type === 'relevant' || feedback.feedback_type === 'perfect'
      );

      // Return unique image IDs
      const positiveImageIds = [...new Set(positiveFeedback.map(feedback => feedback.image_id))];
      
      apiLogger.debug(`Found ${positiveImageIds.length} images with positive feedback for similar prompts`);
      return positiveImageIds;

    } catch (error) {
      apiLogger.error('Error in getPositiveFeedbackImages:', error);
      return [];
    }
  }

  /**
   * Get images that received negative feedback for similar prompts
   * @param {string} prompt - User prompt
   * @param {string} userEmail - User email
   * @returns {Promise<Array>} Array of image IDs with negative feedback
   */
  async getNegativeFeedbackImages(prompt, userEmail) {
    try {
      const similarFeedback = await this.getSimilarPromptFeedback(prompt, userEmail);
      
      // Filter for negative feedback (irrelevant)
      const negativeFeedback = similarFeedback.filter(feedback => 
        feedback.feedback_type === 'irrelevant'
      );

      // Return unique image IDs
      const negativeImageIds = [...new Set(negativeFeedback.map(feedback => feedback.image_id))];
      
      apiLogger.debug(`Found ${negativeImageIds.length} images with negative feedback for similar prompts`);
      return negativeImageIds;

    } catch (error) {
      apiLogger.error('Error in getNegativeFeedbackImages:', error);
      return [];
    }
  }

  /**
   * Extract key terms from a prompt for similarity matching
   * @param {string} prompt - User prompt
   * @returns {Array} Array of key terms
   */
  extractKeyTerms(prompt) {
    if (!prompt) return [];
    
    // Remove common words and extract meaningful terms
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'create', 'make', 'generate', 'slides', 'content', 'images'];
    
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
    
    return [...new Set(words)].slice(0, 5); // Return up to 5 unique key terms
  }

  /**
   * Calculate image relevance score based on feedback history
   * @param {string} imageId - Image ID
   * @param {string} prompt - User prompt
   * @param {string} userEmail - User email
   * @returns {Promise<number>} Relevance score (0-100)
   */
  async calculateFeedbackBasedScore(imageId, prompt, userEmail) {
    try {
      const stats = await this.getImageFeedbackStats(imageId);
      const positiveImages = await this.getPositiveFeedbackImages(prompt, userEmail);
      const negativeImages = await this.getNegativeFeedbackImages(prompt, userEmail);
      
      let score = 50; // Base score
      
      // Adjust based on overall feedback for this image
      if (stats.total > 0) {
        const positiveRatio = (stats.relevant + stats.perfect) / stats.total;
        score += (positiveRatio - 0.5) * 40; // ±20 points based on feedback ratio
      }
      
      // Boost score if this image received positive feedback for similar prompts
      if (positiveImages.includes(imageId)) {
        score += 15;
      }
      
      // Reduce score if this image received negative feedback for similar prompts
      if (negativeImages.includes(imageId)) {
        score -= 25;
      }
      
      // Clamp score between 0 and 100
      return Math.max(0, Math.min(100, score));

    } catch (error) {
      apiLogger.error('Error in calculateFeedbackBasedScore:', error);
      return 50; // Neutral score on error
    }
  }

  /**
   * Clear feedback cache
   */
  clearCache() {
    this.feedbackCache.clear();
    apiLogger.debug('Image feedback cache cleared');
  }
}

// Export singleton instance
export const imageFeedbackService = new ImageFeedbackService(); 