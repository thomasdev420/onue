/**
 * Model Selection Utility
 * Determines which GPT model to use based on user settings
 */

/**
 * Get the appropriate GPT model based on intelligence mode
 * @param {string} intelligenceMode - 'normal', 'max', or 'auto'
 * @param {string} prompt - User prompt (required for auto mode)
 * @param {Object} context - Additional context (required for auto mode)
 * @param {string} service - Service type (required for auto mode)
 * @returns {string} The model name to use
 */
export function getModelForIntelligenceMode(intelligenceMode, prompt = '', context = {}, service = 'content') {
  switch (intelligenceMode) {
    case 'max':
      return 'gpt-4o'; // GPT-4o for maximum intelligence
    case 'auto':
      // Import auto mode selection dynamically to avoid circular dependencies
      const { selectOptimalMode } = require('./autoModeSelection');
      const optimalMode = selectOptimalMode(prompt, context, service);
      return optimalMode === 'max' ? 'gpt-4o' : 'gpt-4o-mini';
    case 'normal':
    default:
      return 'gpt-4o-mini'; // GPT-4o Mini for balanced approach
  }
}

/**
 * Get model configuration including parameters based on intelligence mode
 * @param {string} intelligenceMode - 'normal', 'max', or 'auto'
 * @param {string} prompt - User prompt (required for auto mode)
 * @param {Object} context - Additional context (required for auto mode)
 * @param {string} service - Service type (required for auto mode)
 * @returns {Object} Model configuration object
 */
export function getModelConfig(intelligenceMode, prompt = '', context = {}, service = 'content') {
  const baseConfig = {
    temperature: 0.9,
    max_tokens: 4000,
    top_p: 1,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
  };

  switch (intelligenceMode) {
    case 'max':
      return {
        ...baseConfig,
        model: 'gpt-4o',
        temperature: 0.95, // Higher creativity for max mode
        max_tokens: 6000, // More tokens for complex responses
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.2
      };
    case 'auto':
      // Import auto mode selection dynamically to avoid circular dependencies
      const { selectOptimalMode } = require('./autoModeSelection');
      const optimalMode = selectOptimalMode(prompt, context, service);
      return optimalMode === 'max' ? {
        ...baseConfig,
        model: 'gpt-4o',
        temperature: 0.95,
        max_tokens: 6000,
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.2
      } : {
        ...baseConfig,
        model: 'gpt-4o-mini',
        temperature: 0.9,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };
    case 'normal':
    default:
      return {
        ...baseConfig,
        model: 'gpt-4o-mini',
        temperature: 0.9,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };
  }
}

/**
 * Get credit information for different models
 * @param {string} intelligenceMode - 'normal', 'max', or 'auto'
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
    case 'auto':
      return {
        model: 'gpt-4o-mini',
        creditsPerRequest: '1-3',
        description: 'Smart mode that automatically optimizes cost and quality'
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
  return ['normal', 'max', 'auto'].includes(intelligenceMode);
} 