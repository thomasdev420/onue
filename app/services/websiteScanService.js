/**
 * Service for scanning websites and extracting product information
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { safeNewUrl } from '../utils/safeNewUrl';

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Extract basic information from a website URL
 * @param {string} url - The website URL to scan
 * @returns {Promise<Object>} Extracted website data
 */
export async function scanWebsite(url) {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    const urlObj = safeNewUrl(url);
    if (!urlObj) {
      throw new Error('Invalid URL format');
    }

    const html = await fetchWebsiteHtml(urlObj.href);
    const metadata = extractMetadata(html, urlObj);

    // Check if OpenAI is available
    if (!openai) {
      console.warn('OpenAI API key not configured, using fallback extraction');
      return {
        success: true,
        data: {
          companyName: extractCompanyName(urlObj.hostname),
          productType: determineProductType(urlObj.pathname, urlObj.hostname),
          productInfo: generateProductInfo(urlObj.hostname, urlObj.pathname),
          companyUrl: urlObj.href,
          logo: `https://logo.clearbit.com/${urlObj.hostname}`,
          images: metadata.images || [],
          metaDescription: metadata.description || '',
          keywords: []
        }
      };
    }

    const aiResponse = await queryAIModel({
      url: urlObj.href,
      domain: urlObj.hostname,
      path: urlObj.pathname,
      metadata
    });

    return {
      success: true,
      data: {
        companyName: aiResponse.companyName,
        productType: aiResponse.productType,
        productInfo: aiResponse.productInfo,
        companyUrl: urlObj.href,
        logo: aiResponse.logo || `https://logo.clearbit.com/${urlObj.hostname}`,
        images: aiResponse.images || [],
        metaDescription: metadata.description || '',
        keywords: aiResponse.keywords || []
      }
    };
  } catch (error) {
    console.error('AI Scan Error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to scan website' 
    };
  }
}

/**
 * Fetch HTML content from a website
 * @param {string} url - The URL to fetch
 * @returns {Promise<string>} HTML content
 */
async function fetchWebsiteHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlightmediaBot/1.0; +https://flightmedia.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch HTML: ${res.status} ${res.statusText}`);
    }
    
    return await res.text();
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(`Failed to fetch website: ${error.message}`);
  }
}

/**
 * Extract metadata from HTML content
 * @param {string} html - HTML content
 * @param {URL} urlObj - URL object
 * @returns {Object} Extracted metadata
 */
function extractMetadata(html, urlObj) {
  try {
    const $ = cheerio.load(html);
    
    const getMeta = (name) => {
      return $(`meta[name="${name}"]`).attr('content') ||
             $(`meta[property="og:${name}"]`).attr('content') ||
             $(`meta[property="twitter:${name}"]`).attr('content');
    };

    // Extract images from various sources
    const images = [];
    
    // From meta tags
    const ogImage = getMeta('image');
    if (ogImage) images.push(ogImage);
    
    // From img tags (first 5)
    $('img').slice(0, 5).each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:')) {
        images.push(src);
      }
    });

    // Parse JSON-LD if available
    let jsonLd = null;
    try {
      const jsonLdScript = $('script[type="application/ld+json"]').first().html();
      if (jsonLdScript) {
        jsonLd = JSON.parse(jsonLdScript);
      }
    } catch (e) {
      console.warn('Failed to parse JSON-LD:', e);
    }

    return {
      title: $('title').text().trim(),
      description: getMeta('description'),
      ogImage: ogImage,
      twitterCard: getMeta('twitter:card'),
      jsonLd: jsonLd,
      domain: urlObj.hostname,
      images: images,
      h1: $('h1').first().text().trim(),
      h2: $('h2').first().text().trim()
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return {
      title: '',
      description: '',
      domain: urlObj.hostname,
      images: []
    };
  }
}

/**
 * Query AI model for website analysis
 * @param {Object} context - Context information
 * @returns {Promise<Object>} AI analysis results
 */
async function queryAIModel(context) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `
You are a web intelligence engine. Given metadata and basic web structure, return a JSON object describing:

- companyName (extract from domain, title, or JSON-LD)
- productType (SaaS Platform, E-commerce Store, Agency, Content Platform, Tool, Business, etc.)
- productInfo (detailed description with summary, features, and tagline)
- keywords (relevant business keywords)
- logo (if image URL found in metadata, otherwise null)
- images (array of relevant image URLs from metadata)

Here is the context:
URL: ${context.url}
Domain: ${context.domain}
Path: ${context.path}
Title: ${context.metadata.title || 'N/A'}
Description: ${context.metadata.description || 'N/A'}
H1: ${context.metadata.h1 || 'N/A'}
H2: ${context.metadata.h2 || 'N/A'}
OG Image: ${context.metadata.ogImage || 'N/A'}
JSON-LD: ${context.metadata.jsonLd ? JSON.stringify(context.metadata.jsonLd) : 'N/A'}
Available Images: ${context.metadata.images ? context.metadata.images.join(', ') : 'N/A'}

Respond with just a JSON object. No prose or explanation. Ensure all fields are properly formatted strings or arrays.
`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional product and brand intelligence AI. Always respond with valid JSON only.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const raw = chatResponse.choices[0].message.content;
    
    // Clean the response in case it has markdown formatting
    const cleanedRaw = raw.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      return JSON.parse(cleanedRaw);
    } catch (e) {
      console.error('Failed to parse GPT output:', cleanedRaw);
      console.error('Parse error:', e);
      
      // Fallback to basic extraction
      return {
        companyName: extractCompanyName(context.domain),
        productType: determineProductType(context.path, context.domain),
        productInfo: generateProductInfo(context.domain, context.path),
        keywords: [],
        logo: null,
        images: context.metadata.images || []
      };
    }
  } catch (error) {
    console.error('AI query error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/**
 * Extract company name from domain (fallback method)
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
 * Determine product type based on URL path and domain (fallback method)
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
 * Generate product information based on domain and path (fallback method)
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
    { progress: 20, message: 'Fetching website content...' },
    { progress: 40, message: 'Extracting metadata...' },
    { progress: 60, message: 'Analyzing with AI...' },
    { progress: 80, message: 'Processing results...' },
    { progress: 100, message: 'Scan complete!' }
  ];
}