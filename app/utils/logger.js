/**
 * Centralized logging utility
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  error(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(`[${this.context}] ERROR:`, message, ...args);
    }
  }

  warn(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(`[${this.context}] WARN:`, message, ...args);
    }
  }

  info(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.info(`[${this.context}] INFO:`, message, ...args);
    }
  }

  debug(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(`[${this.context}] DEBUG:`, message, ...args);
    }
  }

  // Performance logging
  time(label) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }
}

// Create logger instances for different contexts
export const createLogger = (context) => new Logger(context);

// Default loggers for common contexts
export const logger = new Logger('App');
export const apiLogger = new Logger('API');
export const slideLogger = new Logger('Slides');
export const memeLogger = new Logger('Meme');
export const authLogger = new Logger('Auth');
export const businessLogger = new Logger('Business'); 