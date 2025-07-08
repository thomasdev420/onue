/**
 * Service for scanning websites and extracting product information
 */

/**
 * Extract basic information from a website URL
 * @param {string} url - The website URL to scan
 * @returns {Promise<Object>} Extracted website data
 */
export async function scanWebsite(url) {
  try {
    // Validate URL first
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // In a real implementation, this would:
    // 1. Fetch the website HTML
    // 2. Parse meta tags, title, description
    // 3. Extract structured data (JSON-LD, microdata)
    // 4. Analyze content for product information
    // 5. Use AI to categorize and extract key details
    
    // For now, we'll simulate the process with mock data
    // based on common patterns
    
    let domain, path;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
      path = urlObj.pathname;
    } catch (urlError) {
      throw new Error('Invalid URL format');
    }
    
    // Simulate different types of websites
    let extractedData = {
      companyName: extractCompanyName(domain), // This will be overridden by real scraping
      productType: determineProductType(path, domain),
      productInfo: generateProductInfo(domain, path),
      companyUrl: url,
      logo: null,
      images: [],
      metaDescription: '',
      keywords: []
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      data: extractedData
    };
  } catch (error) {
    console.error('Error scanning website:', error);
    return {
      success: false,
      error: error.message || 'Failed to scan website'
    };
  }
}

/**
 * Extract company name from domain
 * @param {string} domain - Domain name
 * @returns {string} Company name
 */
function extractCompanyName(domain) {
  // Remove common TLDs and www
  let name = domain.replace(/^www\./, '').replace(/\.(com|org|net|co|io|ai|app|tech|dev|me|us|uk|ca|au|de|fr|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|ie|pt|gr|be|at|ch|li|mc|ad|va|sm|mt|va|it|es|pt|gr|be|at|ch|li|mc|ad|va|sm)$/, '');
  
  // Convert to title case and handle common patterns
  name = name
    .split(/[-._]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Handle common abbreviations
  const commonAbbreviations = {
    'saas': 'SaaS',
    'api': 'API',
    'ai': 'AI',
    'ml': 'ML',
    'crm': 'CRM',
    'erp': 'ERP'
  };
  
  Object.entries(commonAbbreviations).forEach(([abbr, full]) => {
    name = name.replace(new RegExp(abbr, 'gi'), full);
  });
  
  return name || 'Your Company';
}

/**
 * Determine product type based on URL path and domain
 * @param {string} path - URL path
 * @param {string} domain - Domain name
 * @returns {string} Product type
 */
function determineProductType(path, domain) {
  const pathLower = path.toLowerCase();
  const domainLower = domain.toLowerCase();
  
  // Check for specific product indicators
  if (pathLower.includes('/product') || pathLower.includes('/products')) {
    return 'Product';
  }
  
  if (pathLower.includes('/service') || pathLower.includes('/services')) {
    return 'Service';
  }
  
  if (domainLower.includes('app') || domainLower.includes('saas') || pathLower.includes('/app')) {
    return 'SaaS Platform';
  }
  
  if (domainLower.includes('shop') || domainLower.includes('store') || pathLower.includes('/shop')) {
    return 'E-commerce Store';
  }
  
  if (domainLower.includes('agency') || domainLower.includes('consulting')) {
    return 'Agency';
  }
  
  if (domainLower.includes('blog') || domainLower.includes('news')) {
    return 'Content Platform';
  }
  
  if (domainLower.includes('tool') || domainLower.includes('utility')) {
    return 'Tool';
  }
  
  return 'Business';
}

/**
 * Generate product information based on domain and path
 * @param {string} domain - Domain name
 * @param {string} path - URL path
 * @returns {string} Product description
 */
function generateProductInfo(domain, path) {
  const domainLower = domain.toLowerCase();
  const pathLower = path.toLowerCase();
  
  // Generate contextual descriptions
  if (domainLower.includes('app') || domainLower.includes('saas')) {
    return 'A modern SaaS platform designed to streamline your business operations and boost productivity.';
  }
  
  if (domainLower.includes('shop') || domainLower.includes('store')) {
    return 'An online store offering quality products with seamless shopping experience and fast delivery.';
  }
  
  if (domainLower.includes('agency') || domainLower.includes('consulting')) {
    return 'Professional consulting services helping businesses grow and achieve their goals through strategic solutions.';
  }
  
  if (domainLower.includes('tool') || domainLower.includes('utility')) {
    return 'A powerful tool designed to simplify complex tasks and improve workflow efficiency.';
  }
  
  if (domainLower.includes('blog') || domainLower.includes('news')) {
    return 'A content platform providing valuable insights, news, and information to our audience.';
  }
  
  return 'A professional business offering innovative solutions to meet your needs and exceed expectations.';
}

/**
 * Validate website URL and normalize it
 * @param {string} url - URL to validate
 * @returns {Object} Validation result with normalized URL
 */
export function validateWebsiteUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  let normalizedUrl = url.trim();
  
  // If URL doesn't start with http:// or https://, add https://
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  try {
    const urlObj = new URL(normalizedUrl);
    // Additional validation to ensure it's a valid web URL
    if (!urlObj.protocol || !urlObj.hostname) {
      return { valid: false, error: 'Invalid URL format' };
    }
    return { valid: true, normalizedUrl };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Get scanning progress steps
 * @returns {Array} Array of progress steps
 */
export function getScanningSteps() {
  return [
    { progress: 20, message: 'Fetching product information...' },
    { progress: 40, message: 'Generating product page...' },
    { progress: 60, message: 'Extracting key details...' },
    { progress: 80, message: 'Analyzing content...' },
    { progress: 100, message: 'Scan complete!' }
  ];
} 