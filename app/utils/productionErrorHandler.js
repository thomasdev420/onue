/**
 * Production-ready error handling utilities
 */

export class ProductionErrorHandler {
  constructor(context = 'App') {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Handle API errors with proper logging
   */
  handleApiError(error, endpoint, requestData = null) {
    const errorInfo = {
      context: this.context,
      endpoint,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      requestData: requestData ? JSON.stringify(requestData) : null
    };

    // In production, log to external service or console
    if (this.isProduction) {
      console.error('API Error:', JSON.stringify(errorInfo, null, 2));
    } else {
      console.error('API Error:', errorInfo);
    }

    return {
      error: this.isProduction ? 'An error occurred' : error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Handle client-side errors
   */
  handleClientError(error, component, userAction = null) {
    const errorInfo = {
      context: this.context,
      component,
      userAction,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : null
    };

    if (this.isProduction) {
      console.error('Client Error:', JSON.stringify(errorInfo, null, 2));
    } else {
      console.error('Client Error:', errorInfo);
    }

    return {
      error: this.isProduction ? 'Something went wrong' : error.message,
      code: 'CLIENT_ERROR',
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Handle environment variable errors
   */
  handleEnvError(missingVars) {
    const errorInfo = {
      context: this.context,
      missingVariables: missingVars,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    console.error('Environment Error:', errorInfo);

    return {
      error: `Missing required environment variables: ${missingVars.join(', ')}`,
      code: 'MISSING_ENV_VARS',
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Safe async operation wrapper
   */
  async safeAsync(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      this.handleClientError(error, 'safeAsync');
      return fallback;
    }
  }

  /**
   * Safe sync operation wrapper
   */
  safeSync(operation, fallback = null) {
    try {
      return operation();
    } catch (error) {
      this.handleClientError(error, 'safeSync');
      return fallback;
    }
  }
}

// Global error handler instance
export const globalErrorHandler = new ProductionErrorHandler('Global'); 