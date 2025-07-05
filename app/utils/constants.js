/**
 * Application constants
 */

// File upload limits
export const FILE_LIMITS = {
  IMAGE: {
    maxSize: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  VIDEO: {
    maxSize: process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE || 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.ogg', '.mov']
  },
  GIF: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/gif'],
    allowedExtensions: ['.gif']
  }
};

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: process.env.NEXT_PUBLIC_DEBOUNCE_DELAY || 1000,
  AUTO_SAVE_DELAY: 1000,
  ERROR_DISPLAY_TIME: 5000,
  SUCCESS_DISPLAY_TIME: 3000,
  LOADING_TIMEOUT: 30000,
  MAX_TEXT_LENGTH: 1000,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500
};

// Slide ratios
export const SLIDE_RATIOS = {
  '16:9': { width: 16, height: 9, label: 'Widescreen' },
  '4:3': { width: 4, height: 3, label: 'Standard' },
  '1:1': { width: 1, height: 1, label: 'Square' },
  '9:16': { width: 9, height: 16, label: 'Portrait' }
};

// Default slide settings
export const DEFAULT_SLIDE = {
  id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
  image: null,
  texts: [],
  ratio: '16:9',
  backgroundColor: '#ffffff',
  textColor: '#000000'
};

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
};

// Z-index layers
export const Z_INDEX = {
  MODAL: 1000,
  TOOLTIP: 1100,
  DROPDOWN: 1200,
  NOTIFICATION: 1300,
  ERROR_BOUNDARY: 1400
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  UPLOAD: '/api/upload',
  ANALYTICS: '/api/analytics',
  CONTENT: '/api/content'
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  FILE_TOO_LARGE: 'File is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a supported file.',
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  SAVE_FAILED: 'Failed to save. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please refresh the page.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  UPLOADED: 'File uploaded successfully.',
  DELETED: 'Item deleted successfully.',
  UPDATED: 'Updated successfully.',
  CREATED: 'Created successfully.'
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'swiftreel-theme',
  SIDEBAR_COLLAPSED: 'swiftreel-sidebar-collapsed',
  USER_PREFERENCES: 'swiftreel-user-preferences',
  ONBOARDING_COMPLETED: 'swiftreel-onboarding-completed'
};

// Feature flags
export const FEATURES = {
  AI_PROMpts: process.env.NEXT_PUBLIC_ENABLE_AI_PROMPTS === 'true',
  PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
  ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  BETA_FEATURES: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true'
};

// Development settings
export const DEV_SETTINGS = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_ERROR_BOUNDARIES: true,
  ENABLE_VALIDATION: true
}; 