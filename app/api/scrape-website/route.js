import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function classifyBusinessType(text) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-3.5-turbo" for lower cost
      messages: [
        {
          role: "system",
          content: `You are a business type classifier. Given website content, respond with a short, specific label for the main business type or industry (e.g., 'IT Services', 'Law Firm', 'E-commerce', 'Restaurant', etc). Only return the label.

Rules:
1. Never return 'unknown', 'unclear', 'N/A', or leave the answer blank. Always make your best guess based on all available clues (domain, keywords, content, etc).
2. If the business is obscure or unclear, infer the most likely type (e.g., 'Consultancy', 'Local Retail', 'Nonprofit', 'Personal Blog', 'Portfolio', 'Online Community', 'Educational Service', etc).
3. Use concise, professional, and plausible industry labels.
4. Avoid generic terms like 'Business' unless absolutely necessary.

Examples:
- 'Electric Cars, Solar & Clean Energy | Tesla' → 'Automotive & Clean Energy'
- 'Women's & Men's Clothes, Shop Fashion' → 'Fashion Retail'
- 'Apple - Official Website' → 'Consumer Electronics'
- 'Microsoft Corporation - Homepage' → 'Software & Technology'
- 'Amazon.com: Online Shopping' → 'E-commerce'
- 'The Law Offices of Jane Smith' → 'Law Firm'
- 'Dr. John Doe, DDS - Family Dentistry' → 'Dental Clinic'
- 'Green Valley Elementary School' → 'Elementary School'
- 'Somerbysit' (no clear info) → 'Personal Blog' or 'Portfolio' or 'Consultancy' (never 'unknown')
- 'Local Community Center' → 'Community Organization'
- 'MyTravelAdventures.net' → 'Travel Blog'

Return only the business type label, nothing else.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 10,
      temperature: 0,
    });
    return completion.choices[0].message.content.trim();
  } catch (e) {
    return '';
  }
}

async function extractCompanyNameWithAI(title, domain, metaDescription) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting clean, professional company names from website titles and metadata.

Rules:
1. Extract ONLY the company/brand name, not descriptive text
2. Remove marketing language, separators, and promotional content
3. Keep the name concise (max 30 characters)
4. Preserve proper capitalization and spelling
5. If unclear, prefer the domain name as reference

Examples:
- "Electric Cars, Solar & Clean Energy | Tesla" → "Tesla"
- "Women's & Men's Clothes, Shop Fashion" → "SHEIN" (from domain)
- "Apple - Official Website" → "Apple"
- "Microsoft Corporation - Homepage" → "Microsoft"
- "Amazon.com: Online Shopping" → "Amazon"

Return only the company name, nothing else.`
        },
        {
          role: "user",
          content: `Title: ${title || 'N/A'}
Domain: ${domain || 'N/A'}
Meta Description: ${metaDescription || 'N/A'}

Extract the company name:`
        }
      ],
      max_tokens: 50,
      temperature: 0,
    });
    
    const companyName = completion.choices[0].message.content.trim();
    
    // Fallback to domain extraction if AI returns something too long or unclear
    if (!companyName || companyName.length > 30 || companyName.toLowerCase().includes('cannot') || companyName.toLowerCase().includes('unclear')) {
      return extractCompanyNameFromDomain(domain);
    }
    
    return companyName;
  } catch (error) {
    console.error('AI company name extraction failed:', error);
    return extractCompanyNameFromDomain(domain);
  }
}

async function extractProductInfoWithAI(metaDescription, domain, title) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating clean, professional product descriptions from website metadata.

Rules:
1. Remove all promotional content, pricing, offers, and marketing language
2. Focus on what the company actually does or sells
3. Keep it concise (max 200 characters)
4. Use professional, business-friendly language
5. If the description is too promotional, create a generic but accurate description

Examples:
- "Shop SHEIN's range of women's, kids' & men's clothes for the latest fashion trends. Free Shipping On £35+✓ Free Return - 45 Days✓ 9000+ New Dropped Daily✓ Get £3 Off First Order!✓" → "Online fashion retailer offering trendy clothing and accessories for men, women, and children."
- "Electric Cars, Solar & Clean Energy | Tesla" → "Automotive and clean energy company focused on electric vehicles and sustainable technology."
- "Apple - Official Website" → "Technology company specializing in consumer electronics and software."

Return only the clean description, nothing else.`
        },
        {
          role: "user",
          content: `Meta Description: ${metaDescription || 'N/A'}
Domain: ${domain || 'N/A'}
Title: ${title || 'N/A'}

Create a clean product description:`
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });
    
    const productInfo = completion.choices[0].message.content.trim();
    
    // Fallback to domain-based generation if AI fails
    if (!productInfo || productInfo.length < 10) {
      return generateProductInfoFromDomain(domain);
    }
    
    return productInfo;
  } catch (error) {
    console.error('AI product info extraction failed:', error);
    return generateProductInfoFromDomain(domain);
  }
}

function extractCompanyNameFromDomain(domain) {
  // Remove common TLDs and www
  let name = domain.replace(/^www\./, '').replace(/\.(com|org|net|co|io|ai|app|tech|dev|me|us|uk|ca|au|de|fr|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|ie|pt|gr|be|at|ch|li|mc|ad|va|sm)$/, '');
  
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

function generateProductInfoFromDomain(domain) {
  const domainLower = domain.toLowerCase();
  
  if (domainLower.includes('shein') || domainLower.includes('fashion') || domainLower.includes('clothing')) {
    return 'Online fashion retailer offering trendy clothing and accessories for men, women, and children.';
  }
  
  if (domainLower.includes('amazon') || domainLower.includes('shop') || domainLower.includes('store')) {
    return 'Online marketplace offering a wide variety of products and services.';
  }
  
  if (domainLower.includes('apple') || domainLower.includes('tech') || domainLower.includes('electronics')) {
    return 'Technology company specializing in consumer electronics and software.';
  }
  
  if (domainLower.includes('tesla') || domainLower.includes('auto') || domainLower.includes('car')) {
    return 'Automotive and clean energy company focused on electric vehicles and sustainable technology.';
  }
  
  return 'Professional business offering quality products and services to customers worldwide.';
}

// Add fetchWithTimeout helper
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 7000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Normalize URL - add https:// if protocol is missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    if (!/^https?:\/\//.test(normalizedUrl)) {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    // Fetch HTML with timeout
    const response = await fetchWithTimeout(normalizedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 7000 });
    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch website' }, { status: 500 });
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const getMeta = (name) => $(`meta[name='${name}']`).attr('content') || $(`meta[property='${name}']`).attr('content');
    const title = $('title').first().text() || '';
    const metaDescription = getMeta('description') || getMeta('og:description') || getMeta('twitter:description') || '';
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000);
    
    // Extract domain for fallback
    const domain = new URL(normalizedUrl).hostname;
    
    // Prepare AI prompt
    const aiText = `Title: ${title}\nDescription: ${metaDescription}\nContent: ${bodyText}`;
    // Run all three AI calls in parallel
    const [companyName, productInfo, productTypeRaw] = await Promise.all([
      extractCompanyNameWithAI(title, domain, metaDescription),
      extractProductInfoWithAI(metaDescription, domain, title),
      classifyBusinessType(aiText)
    ]);
    const productType = productTypeRaw || 'Business';
    
    // Return cleaned data
    return Response.json({
      companyName: companyName,
      productType,
      productInfo: productInfo,
      companyUrl: normalizedUrl,
      // ...other fields as needed
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return Response.json({ error: 'Failed to scrape website' }, { status: 500 });
  }
} 