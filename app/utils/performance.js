/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit the rate of function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize function results
 * @param {Function} fn - Function to memoize
 * @returns {Function} Memoized function
 */
export function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Lazy load images
 * @param {string} src - Image source
 * @param {Function} onLoad - On load callback
 * @param {Function} onError - On error callback
 */
export function lazyLoadImage(src, onLoad, onError) {
  const img = new Image();
  img.onload = () => onLoad && onLoad(img);
  img.onerror = () => onError && onError();
  img.src = src;
}

/**
 * Preload critical images
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 */
export function preloadImages(imageUrls) {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

/**
 * Optimize canvas rendering
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function optimizeCanvas(canvas, width, height) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

/**
 * Batch DOM updates
 * @param {Function} updateFunction - Function containing DOM updates
 */
export function batchDOMUpdates(updateFunction) {
  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    updateFunction();
  });
}

/**
 * Measure performance of a function
 * @param {Function} fn - Function to measure
 * @param {string} name - Name for the measurement
 * @returns {any} Function result
 */
export function measurePerformance(fn, name = 'Function') {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Create a performance observer for monitoring
 * @param {string} entryType - Type of performance entry to observe
 * @param {Function} callback - Callback function
 */
export function createPerformanceObserver(entryType, callback) {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(callback);
    });
    observer.observe({ entryTypes: [entryType] });
    return observer;
  }
  return null;
} 