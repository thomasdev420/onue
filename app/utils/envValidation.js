/**
 * Environment variable validation utility
 */

const REQUIRED_ENV_VARS = {
  // Supabase (required for data persistence)
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  
  // NextAuth (required for authentication)
  NEXTAUTH_SECRET: 'NextAuth secret key',
  NEXTAUTH_URL: 'NextAuth URL (optional in development)',
  
  // OpenAI (required for AI features)
  OPENAI_API_KEY: 'OpenAI API key',
  
  // Google OAuth (optional but recommended)
  GOOGLE_CLIENT_ID: 'Google OAuth client ID (optional)',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret (optional)',
};

const OPTIONAL_ENV_VARS = {
  // TikTok API (optional)
  TIKTOK_CLIENT_KEY: 'TikTok client key',
  TIKTOK_CLIENT_SECRET: 'TikTok client secret',
  TIKTOK_REDIRECT_URI: 'TikTok redirect URI',
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: 'Performance monitoring flag',
  NEXT_PUBLIC_ENABLE_AI_PROMPTS: 'AI prompts flag',
  NEXT_PUBLIC_ENABLE_ANALYTICS: 'Analytics flag',
  NEXT_PUBLIC_ENABLE_BETA_FEATURES: 'Beta features flag',
};

/**
 * Validate environment variables
 * @returns {Object} Validation result with missing vars and warnings
 */
export function validateEnvironment() {
  const missing = [];
  const warnings = [];
  const isDev = process.env.NODE_ENV === 'development';

  // Check required variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    if (!process.env[key]) {
      missing.push({ key, description });
    }
  });

  // Check optional variables and provide warnings
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, description]) => {
    if (!process.env[key]) {
      warnings.push({ key, description });
    }
  });

  // Special validation for development
  if (isDev) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      warnings.push({
        key: 'GOOGLE_OAUTH',
        description: 'Google OAuth not configured - authentication will be bypassed in development'
      });
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    isDev
  };
}

/**
 * Get environment status for debugging
 * @returns {Object} Environment status
 */
export function getEnvironmentStatus() {
  const validation = validateEnvironment();
  
  return {
    ...validation,
    features: {
      authentication: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      database: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      ai: !!process.env.OPENAI_API_KEY,
      tiktok: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
    },
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Log environment validation results
 */
export function logEnvironmentValidation() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('❌ Missing required environment variables:');
    validation.missing.forEach(({ key, description }) => {
      console.error(`   - ${key}: ${description}`);
    });
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    validation.warnings.forEach(({ key, description }) => {
      console.warn(`   - ${key}: ${description}`);
    });
  }
  
  if (validation.isValid) {
    console.log('✅ Environment validation passed');
  }
  
  return validation;
} 