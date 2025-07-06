/**
 * Safe client-side storage utilities
 * Handles localStorage safely with error boundaries
 */

export const clientStorage = {
  /**
   * Safely get item from localStorage
   */
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  },

  /**
   * Safely set item in localStorage
   */
  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error);
      return false;
    }
  },

  /**
   * Safely remove item from localStorage
   */
  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable() {
    try {
      return typeof window !== 'undefined' && 
             window.localStorage && 
             typeof window.localStorage.getItem === 'function';
    } catch {
      return false;
    }
  }
};

/**
 * Safe window utilities
 */
export const safeWindow = {
  /**
   * Safely access window object
   */
  get() {
    return typeof window !== 'undefined' ? window : null;
  },

  /**
   * Safely navigate to URL
   */
  navigate(url) {
    try {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = url;
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to navigate:', error);
      return false;
    }
  },

  /**
   * Get device pixel ratio safely
   */
  getDevicePixelRatio() {
    try {
      if (typeof window !== 'undefined' && window.devicePixelRatio) {
        return window.devicePixelRatio;
      }
      return 1;
    } catch {
      return 1;
    }
  }
}; 