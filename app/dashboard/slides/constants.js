// Slide configuration
export const SLIDE_CONFIG = {
  DEFAULT_RATIO: '16:9',
  AVAILABLE_RATIOS: ['16:9', '4:3', '1:1', '9:16'],
  SLIDE_WIDTH_PERCENTAGE: 35,
  DEFAULT_TEXT_CONTENT: 'New Text',
  MIN_TEXT_WIDTH: 50,
  MAX_TEXT_WIDTH: '30vw',
  SNAP_THRESHOLD: 10,
  CLICK_THRESHOLD: 5,
  TRANSITION_DURATION: '0.5s',
  TRANSITION_EASING: 'ease-in-out'
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