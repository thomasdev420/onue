/**
 * Constants for slide management and configuration
 */

export const SLIDE_CONFIG = {
  DEFAULT_RATIO: '9:16',
  AVAILABLE_RATIOS: ['9:16', '16:9', '1:1', '4:5'],
  MAX_SLIDES: 50,
  MIN_SLIDES: 1,
  DEFAULT_TEXT_POSITION: { x: 50, y: 50 },
  TEXT_POSITION_CONSTRAINTS: {
    MIN_Y: 35, // Avoid top 30% of slide
    MAX_Y: 85, // Avoid bottom 15% of slide
    MIN_X: 10,
    MAX_X: 90
  },
  SLIDE_WIDTH_PERCENTAGE: 32 // Slightly smaller slides for better carousel visibility
};

export const SLIDE_TYPES = {
  BUSINESS: 'business',
  TECHNOLOGY: 'technology',
  SUCCESS: 'success',
  MOTIVATION: 'motivation',
  GROWTH: 'growth',
  CREATIVITY: 'creativity',
  SOCIAL_MEDIA: 'social_media',
  ENTREPRENEURSHIP: 'entrepreneurship',
  MARKETING: 'marketing',
  LIFESTYLE: 'lifestyle'
};

export const SLIDE_VALIDATION = {
  MAX_TEXT_LENGTH: 700, // Increased from 500
  MAX_TEXTS_PER_SLIDE: 5,
  MIN_TEXT_LENGTH: 1
};

// Content types
export const CONTENT_TYPES = {
  STOCK: 'stock',
  USER: 'user'
};

// Modal configuration
export const MODAL_CONFIG = {
  CONTENT_MODAL: {
    WIDTH: '80%',
    MAX_WIDTH: '1000px',
    HEIGHT: '80vh',
    Z_INDEX: 1000
  },
  PROMPT_MODAL: {
    WIDTH: '90%',
    MAX_WIDTH: '500px',
    Z_INDEX: 1000
  }
};

// Colors
export const COLORS = {
  PRIMARY: '#3B82F6',
  PRIMARY_HOVER: '#2563EB',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  BORDER: '#E5E7EB',
  BORDER_HOVER: '#D1D5DB',
  BACKGROUND: '#F7F7F7',
  BACKGROUND_HOVER: '#F9FAFB',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
  TEXT_OVERLAY: 'rgba(0,0,0,0.5)',
  GUIDE_LINE: 'rgba(59, 130, 246, 0.8)'
};

// Spacing and sizing
export const SPACING = {
  SMALL: '8px',
  MEDIUM: '12px',
  LARGE: '16px',
  XLARGE: '24px',
  XXLARGE: '32px'
};

// Border radius
export const BORDER_RADIUS = {
  SMALL: '5px',
  MEDIUM: '8px',
  LARGE: '12px',
  XLARGE: '16px',
  ROUND: '50%'
};

// Font sizes
export const FONT_SIZES = {
  SMALL: '11px',
  MEDIUM: '14px',
  LARGE: '16px',
  XLARGE: '24px'
};

// Font weights
export const FONT_WEIGHTS = {
  NORMAL: 'normal',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700'
};

// Z-index values
export const Z_INDEX = {
  MODAL: 1000,
  GUIDE_LINE: 1000,
  CONTROLS: 10
}; 