/**
 * Production configuration validation
 */

export class ProductionConfigValidator {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Validate all required environment variables
   */
  validateEnvironmentVariables() {
    const requiredVars = {
      // Core functionality
      OPENAI_API_KEY: {
        required: true,
        validate: (value) => value && value.startsWith('sk-'),
        message: 'OpenAI API key must start with sk-'
      },
      NEXTAUTH_SECRET: {
        required: true,
        validate: (value) => value && value.length >= 32,
        message: 'NEXTAUTH_SECRET must be at least 32 characters'
      },
      NEXTAUTH_URL: {
        required: true,
        validate: (value) => value && (value.startsWith('https://') || value.startsWith('http://')),
        message: 'NEXTAUTH_URL must be a valid URL'
      },
      
      // Database
      NEXT_PUBLIC_SUPABASE_URL: {
        required: true,
        validate: (value) => value && value.startsWith('https://'),
        message: 'Supabase URL must be HTTPS'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        required: true,
        validate: (value) => value && value.length > 0,
        message: 'Supabase anonymous key is required'
      }
    };

    const missing = [];
    const invalid = [];

    for (const [varName, config] of Object.entries(requiredVars)) {
      const value = process.env[varName];
      
      if (!value && config.required) {
        missing.push(varName);
      } else if (value && config.validate && !config.validate(value)) {
        invalid.push({
          variable: varName,
          message: config.message
        });
      }
    }

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      environment: process.env.NODE_ENV
    };
  }

  /**
   * Validate production-specific settings
   */
  validateProductionSettings() {
    if (!this.isProduction) {
      return { isValid: true, warnings: [] };
    }

    const warnings = [];

    // Check for development URLs in production
    if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes('localhost')) {
      warnings.push('NEXTAUTH_URL contains localhost - should use production domain');
    }

    if (process.env.TIKTOK_REDIRECT_URI && process.env.TIKTOK_REDIRECT_URI.includes('localhost')) {
      warnings.push('TIKTOK_REDIRECT_URI contains localhost - should use production domain');
    }

    // Check for weak secrets
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('NEXTAUTH_SECRET is too short - should be at least 32 characters');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Get comprehensive configuration status
   */
  getConfigurationStatus() {
    const envValidation = this.validateEnvironmentVariables();
    const productionValidation = this.validateProductionSettings();

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isProduction: this.isProduction,
      environmentVariables: envValidation,
      productionSettings: productionValidation,
      overallStatus: envValidation.isValid && productionValidation.isValid ? 'ready' : 'needs_attention',
      recommendations: this.getRecommendations(envValidation, productionValidation)
    };
  }

  /**
   * Get recommendations for fixing issues
   */
  getRecommendations(envValidation, productionValidation) {
    const recommendations = [];

    if (envValidation.missing.length > 0) {
      recommendations.push(`Add missing environment variables: ${envValidation.missing.join(', ')}`);
    }

    if (envValidation.invalid.length > 0) {
      envValidation.invalid.forEach(invalid => {
        recommendations.push(`Fix ${invalid.variable}: ${invalid.message}`);
      });
    }

    if (productionValidation.warnings.length > 0) {
      recommendations.push(...productionValidation.warnings);
    }

    return recommendations;
  }
}

// Global validator instance
export const configValidator = new ProductionConfigValidator(); 