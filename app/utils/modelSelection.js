/**
 * Model Selection Utility
 * Determines which GPT model to use based on user settings
 */

/**
 * Get the appropriate GPT model based on intelligence mode
 * @param {string} intelligenceMode - 'normal' or 'max'
 * @returns {string} The model name to use
 */
export function getModelForIntelligenceMode(intelligenceMode) {
  switch (intelligenceMode) {
    case 'max':
      return 'gpt-4o'; // GPT-4o for maximum intelligence
    case 'normal':
    default:
      return 'gpt-4o-mini'; // GPT-4o Mini for balanced approach
  }
}

/**
 * Get model configuration including parameters based on intelligence mode
 * @param {string} intelligenceMode - 'normal' or 'max'
 * @returns {Object} Model configuration object
 */
export function getModelConfig(intelligenceMode) {
  const baseConfig = {
    temperature: 0.7,
    max_tokens: 4000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  switch (intelligenceMode) {
    case 'max':
      return {
        ...baseConfig,
        model: 'gpt-4o',
        temperature: 0.8, // Slightly more creative for max mode
        max_tokens: 6000, // More tokens for complex responses
        top_p: 0.9
      };
    case 'normal':
    default:
      return {
        ...baseConfig,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1
      };
  }
}

/**
 * Get credit information for different models
 * @param {string} intelligenceMode - 'normal' or 'max'
 * @returns {Object} Credit information
 */
export function getModelCreditInfo(intelligenceMode) {
  switch (intelligenceMode) {
    case 'max':
      return {
        model: 'gpt-4o',
        creditsPerRequest: 3,
        description: 'Premium model with highest quality output'
      };
    case 'normal':
    default:
      return {
        model: 'gpt-4o-mini',
        creditsPerRequest: 1,
        description: 'Cost-effective model with good quality'
      };
  }
}

/**
 * Validate intelligence mode
 * @param {string} intelligenceMode - Mode to validate
 * @returns {boolean} Whether the mode is valid
 */
export function isValidIntelligenceMode(intelligenceMode) {
  return ['normal', 'max'].includes(intelligenceMode);
} 