/**
 * Validation utilities for file uploads and user inputs
 */

// File validation constants
export const FILE_LIMITS = {
  IMAGE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  VIDEO: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.ogg', '.mov']
  },
  GIF: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/gif'],
    allowedExtensions: ['.gif']
  }
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {string} type - Type of file ('image', 'video', 'gif')
 * @returns {Object} Validation result with success boolean and error message
 */
export function validateFile(file, type = 'image') {
  const limits = FILE_LIMITS[type.toUpperCase()];
  
  if (!limits) {
    return {
      success: false,
      error: `Invalid file type: ${type}`
    };
  }

  // Check file size
  if (file.size > limits.maxSize) {
    const maxSizeMB = limits.maxSize / (1024 * 1024);
    return {
      success: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  // Check file type
  if (!limits.allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type not allowed. Allowed types: ${limits.allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!limits.allowedExtensions.includes(fileExtension)) {
    return {
      success: false,
      error: `File extension not allowed. Allowed extensions: ${limits.allowedExtensions.join(', ')}`
    };
  }

  return { success: true };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize text input
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length allowed
 * @param {boolean} trimWhitespace - Whether to trim leading/trailing whitespace (default: true)
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, maxLength = 1000, trimWhitespace = true) {
  if (!text) return '';
  
  // Remove HTML tags
  const sanitized = text.replace(/<[^>]*>/g, '');
  
  // Only trim whitespace if requested (for final validation, not during typing)
  const processed = trimWhitespace ? sanitized.trim() : sanitized;
  
  // Limit length
  return processed.length > maxLength ? processed.substring(0, maxLength) : processed;
}

/**
 * Validate slide data
 * @param {Object} slide - Slide object to validate
 * @returns {Object} Validation result
 */
export function validateSlide(slide) {
  if (!slide || typeof slide !== 'object') {
    return { success: false, error: 'Invalid slide data' };
  }

  if (!slide.id || (typeof slide.id !== 'number' && typeof slide.id !== 'string')) {
    return { success: false, error: 'Slide must have a valid ID' };
  }

  if (slide.texts && !Array.isArray(slide.texts)) {
    return { success: false, error: 'Slide texts must be an array' };
  }

  if (slide.texts) {
    for (let i = 0; i < slide.texts.length; i++) {
      const text = slide.texts[i];
      if (!text.content || typeof text.content !== 'string') {
        return { success: false, error: `Text ${i + 1} must have valid content` };
      }
      if (text.content.length > 500) {
        return { success: false, error: `Text ${i + 1} is too long (max 500 characters)` };
      }
    }
  }

  return { success: true };
}

/**
 * Validate user input for onboarding
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
export function validateUserData(userData) {
  const errors = [];

  if (userData.email && !validateEmail(userData.email)) {
    errors.push('Invalid email format');
  }

  if (userData.name && userData.name.length > 100) {
    errors.push('Name is too long (max 100 characters)');
  }

  if (userData.companyWebsite && !userData.companyWebsite.startsWith('http')) {
    errors.push('Company website must start with http:// or https://');
  }

  if (userData.interests && userData.interests.length > 10) {
    errors.push('Too many interests (max 10)');
  }

  return {
    success: errors.length === 0,
    errors
  };
} 