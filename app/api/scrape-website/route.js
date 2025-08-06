import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { safeNewUrl } from '../../utils/safeNewUrl';

// Lazy initialization to avoid build-time errors
let openai = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

async function researchExternalSources(companyName, domain) {
  const externalData = {
    companyInfo: null,
    newsArticles: [],
    fundingInfo: null,
    competitors: [],
    industryData: null
  };

  try {
    // Research company information from business databases
    if (companyName && companyName !== 'Not specified') {
      try {
        // Try to find company information from business directories
        const businessDirectories = [
          `https://www.crunchbase.com/organization/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
          `https://angel.co/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
          `https://www.producthunt.com/companies/${companyName.toLowerCase().replace(/\s+/g, '-')}`
        ];

        for (const url of businessDirectories) {
          try {
            const response = await fetchWithTimeout(url, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
            });
            
            if (response.ok) {
              const html = await response.text();
              const $ = cheerio.load(html);
              
              // Extract company information
              const description = $('.description, .summary, .about').text().trim();
              const industry = $('.industry, .category').text().trim();
              const founded = $('.founded, .established').text().trim();
              const funding = $('.funding, .investment').text().trim();
              
              if (description || industry || founded || funding) {
                externalData.companyInfo = { description, industry, founded, funding };
                break; // Use the first successful source
              }
            }
          } catch (error) {
            // Continue to next source
            continue;
          }
        }
      } catch (error) {
        console.log('Business directory research failed:', error.message);
      }
    }

    // Research news articles about the company
    if (companyName && companyName !== 'Not specified') {
      try {
        // Try to find recent news about the company
        const newsSources = [
          `https://news.google.com/search?q=${encodeURIComponent(companyName)}&hl=en`,
          `https://techcrunch.com/tag/${companyName.toLowerCase().replace(/\s+/g, '-')}/`,
          `https://www.theverge.com/search?q=${encodeURIComponent(companyName)}`
        ];

        for (const url of newsSources) {
          try {
            const response = await fetchWithTimeout(url, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
            });
            
            if (response.ok) {
              const html = await response.text();
              const $ = cheerio.load(html);
              
              // Extract recent news articles
              $('article, .post, .story').slice(0, 5).each((i, el) => {
                const title = $(el).find('h1, h2, h3, .title').text().trim();
                const summary = $(el).find('.summary, .excerpt, .description').text().trim();
                const date = $(el).find('.date, .time').text().trim();
                
                if (title && summary) {
                  externalData.newsArticles.push({ title, summary, date });
                }
              });
              
              if (externalData.newsArticles.length > 0) {
                break; // Use the first successful source
              }
            }
          } catch (error) {
            // Continue to next source
            continue;
          }
        }
      } catch (error) {
        console.log('News research failed:', error.message);
      }
    }

    // Research industry and market information
    if (externalData.companyInfo && externalData.companyInfo.industry) {
      try {
        const industry = externalData.companyInfo.industry.toLowerCase();
        
        // Try to find industry information
        const industrySources = [
          `https://www.statista.com/topics/search/?q=${encodeURIComponent(industry)}`,
          `https://www.ibisworld.com/search/?q=${encodeURIComponent(industry)}`
        ];

        for (const url of industrySources) {
          try {
            const response = await fetchWithTimeout(url, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
            });
            
            if (response.ok) {
              const html = await response.text();
              const $ = cheerio.load(html);
              
              // Extract industry insights
              const marketSize = $('.market-size, .industry-size').text().trim();
              const growthRate = $('.growth-rate, .growth').text().trim();
              const trends = $('.trends, .market-trends').text().trim();
              
              if (marketSize || growthRate || trends) {
                externalData.industryData = { marketSize, growthRate, trends };
                break;
              }
            }
          } catch (error) {
            // Continue to next source
            continue;
          }
        }
      } catch (error) {
        console.log('Industry research failed:', error.message);
      }
    }

  } catch (error) {
    console.error('External research failed:', error);
  }

  return externalData;
}

async function researchSocialMedia(companyName, domain) {
  const socialData = {
    linkedin: null,
    twitter: null,
    facebook: null,
    instagram: null,
    youtube: null,
    github: null,
    additionalInfo: []
  };

  try {
    // Research LinkedIn for company information
    if (companyName && companyName !== 'Not specified') {
      try {
        const linkedinUrl = `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`;
        const linkedinResponse = await fetchWithTimeout(linkedinUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
        });
        
        if (linkedinResponse.ok) {
          const linkedinHtml = await linkedinResponse.text();
          const $ = cheerio.load(linkedinHtml);
          
          // Extract company description, industry, size, etc.
          const description = $('.org-top-card-summary__tagline').text().trim();
          const industry = $('.org-about-company-module__industry').text().trim();
          const size = $('.org-about-company-module__company-staff-count').text().trim();
          const founded = $('.org-about-company-module__founded').text().trim();
          
          if (description || industry || size || founded) {
            socialData.linkedin = { description, industry, size, founded };
          }
        }
      } catch (error) {
        console.log('LinkedIn research failed:', error.message);
      }
    }

    // Research Twitter/X for company information
    if (companyName && companyName !== 'Not specified') {
      try {
        const twitterUrl = `https://twitter.com/${companyName.toLowerCase().replace(/\s+/g, '')}`;
        const twitterResponse = await fetchWithTimeout(twitterUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
        });
        
        if (twitterResponse.ok) {
          const twitterHtml = await twitterResponse.text();
          const $ = cheerio.load(twitterHtml);
          
          // Extract bio, location, website, etc.
          const bio = $('[data-testid="UserDescription"]').text().trim();
          const location = $('[data-testid="UserLocation"]').text().trim();
          const website = $('[data-testid="UserUrl"]').text().trim();
          
          if (bio || location || website) {
            socialData.twitter = { bio, location, website };
          }
        }
      } catch (error) {
        console.log('Twitter research failed:', error.message);
      }
    }

    // Research GitHub for tech companies
    if (companyName && companyName !== 'Not specified') {
      try {
        const githubUrl = `https://github.com/${companyName.toLowerCase().replace(/\s+/g, '')}`;
        const githubResponse = await fetchWithTimeout(githubUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
        });
        
        if (githubResponse.ok) {
          const githubHtml = await githubResponse.text();
          const $ = cheerio.load(githubHtml);
          
          // Extract bio, location, website, etc.
          const bio = $('.p-note').text().trim();
          const location = $('.p-label').text().trim();
          const website = $('.Link--primary').attr('href');
          
          if (bio || location || website) {
            socialData.github = { bio, location, website };
          }
        }
      } catch (error) {
        console.log('GitHub research failed:', error.message);
      }
    }

    // Research company website for additional pages
    if (domain) {
      try {
        const additionalPages = await researchCompanyPages(domain);
        if (additionalPages.length > 0) {
          socialData.additionalInfo = additionalPages;
        }
      } catch (error) {
        console.log('Additional pages research failed:', error.message);
      }
    }

  } catch (error) {
    console.error('Social media research failed:', error);
  }

  return socialData;
}

async function researchCompanyPages(domain) {
  const pages = [];
  const commonPages = [
    '/about', '/about-us', '/company', '/team', '/our-story',
    '/products', '/services', '/solutions', '/features',
    '/contact', '/support', '/help', '/faq',
    '/blog', '/news', '/press', '/media'
  ];

  for (const page of commonPages) {
    try {
      const url = `https://${domain}${page}`;
      const response = await fetchWithTimeout(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500);
        
        if (title || description || content) {
          pages.push({
            page,
            title,
            description,
            content
          });
        }
      }
    } catch (error) {
      // Continue to next page if one fails
      continue;
    }
  }

  return pages;
}

async function extractComprehensiveBusinessData(html, url, domain, title, metaDescription) {
  try {
    const openaiClient = getOpenAI();
    
    // Extract comprehensive content for deep analysis
    const $ = cheerio.load(html);
    
    // Extract all text content systematically
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
    const h1Text = $('h1').map((i, el) => $(el).text().trim()).get().join(' | ');
    const h2Text = $('h2').map((i, el) => $(el).text().trim()).get().join(' | ');
    const h3Text = $('h3').map((i, el) => $(el).text().trim()).get().join(' | ');
    const navText = $('nav').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const footerText = $('footer').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const sidebarText = $('.sidebar, aside').text().replace(/\s+/g, ' ').trim().slice(0, 500);
    
    // Extract specific content sections
    const heroText = $('.hero, .banner, .jumbotron, .main-banner').text().replace(/\s+/g, ' ').trim().slice(0, 500);
    const featuresText = $('.features, .benefits, .why-choose, .what-we-do').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const aboutText = $('.about, .about-us, .company, .story').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const productText = $('.product, .service, .solution, .offer').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    
    // Extract all links and their text
    const links = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && href.startsWith('http')) {
        links.push({ href, text });
      }
    });
    
    // Extract contact information
    const contactInfo = extractContactInfo($, domain);
    
    // Extract social media links
    const socialLinks = extractSocialLinks($);
    
    // Extract JSON-LD structured data
    const structuredData = extractStructuredData($);
    
    // Extract meta tags for additional context
    const metaTags = extractMetaTags($);
    
    // Extract Open Graph and Twitter Card data
    const ogData = extractOpenGraphData($);
    
    // Research social media and additional sources
    const companyName = extractCompanyName($, domain, title);
    const socialResearch = await researchSocialMedia(companyName, domain);
    const externalResearch = await researchExternalSources(companyName, domain);
    
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert business intelligence analyst with deep knowledge of product analysis and market research. Your task is to extract factual information from the provided website content and social media research, and make intelligent inferences based on clear indicators.

ANALYSIS RULES:
1. Extract factual information that is explicitly stated in the content
2. Make intelligent inferences based on clear indicators and patterns
3. Use industry knowledge to categorize businesses appropriately
4. Infer company type and industry from domain, content, and context
5. Use social media research to supplement and verify website information
6. Be reasonable and accurate in your inferences
7. If information is unclear or ambiguous, use "Not specified" or leave blank
8. Prioritize stated information over inferences, but use inferences to fill gaps

INTELLIGENT INFERENCE GUIDELINES:
- **Industry Inference**: If a company sells software, infer "Technology" industry. If they sell physical products, infer "E-commerce" or "Retail"
- **Company Type Inference**: If they have a .io domain, infer "SaaS/Technology". If they have "shop" in domain, infer "E-commerce"
- **Target Audience Inference**: If they mention "developers" or "engineers", infer "Developers". If they mention "businesses", infer "Businesses"
- **Product Type Inference**: If they mention "app", "platform", "software", infer "SaaS Platform" or "Technology"
- **Location Inference**: If they mention a city/state in content, infer that as headquarters
- **Company Size Inference**: If they mention "startup", "small team", infer "Startup". If they mention "enterprise", infer "Enterprise"

Return a JSON object with this structure:

{
  "companyName": "Exact company name as stated on website or social media (max 50 chars)",
  "productType": "Business category based on content and intelligent inference",
  "productInfo": "What the product/service actually does - use specific details from content (max 300 chars)",
  "headquarters": "Location if explicitly stated or reasonably inferred",
  "keyProducts": "Specific products/services mentioned (comma-separated)",
  "targetAudience": "Target customers if explicitly stated or reasonably inferred",
  "valueProp": "Specific problem solved or benefit provided as stated on website (1-2 sentences)",
  "contact": "Contact information if found",
  "socialLinks": "Social media links if found",
  "industry": "Industry if explicitly stated or intelligently inferred",
  "companySize": "Company size if explicitly stated or reasonably inferred",
  "foundedYear": "Year founded if explicitly stated",
  "mission": "Mission statement if explicitly stated"
}

INFERENCE EXAMPLES:
- Apple.com → Industry: "Technology", ProductType: "Consumer Electronics", TargetAudience: "Consumers"
- Shopify.com → Industry: "E-commerce", ProductType: "SaaS Platform", TargetAudience: "Businesses"
- GitHub.com → Industry: "Technology", ProductType: "Developer Platform", TargetAudience: "Developers"
- Nike.com → Industry: "Retail", ProductType: "E-commerce", TargetAudience: "Consumers"
- McKinsey.com → Industry: "Consulting", ProductType: "Professional Services", TargetAudience: "Businesses"

Analysis Guidelines:
- Look for specific product descriptions and features
- Extract actual capabilities and benefits mentioned
- Find real problems the product solves
- Identify target users through content analysis
- Use domain knowledge to make reasonable inferences
- Cross-reference information across sources for accuracy
- Use social media research to fill gaps and verify inferences`
        },
        {
          role: "user",
          content: `Website Content Analysis:

URL: ${url}
Domain: ${domain}
Title: ${title}
Meta Description: ${metaDescription}

Main Content: ${bodyText}
H1 Headers: ${h1Text}
H2 Headers: ${h2Text}
H3 Headers: ${h3Text}
Navigation: ${navText}
Footer: ${footerText}
Sidebar: ${sidebarText}
Hero Section: ${heroText}
Features Section: ${featuresText}
About Section: ${aboutText}
Product Section: ${productText}
Contact Info: ${JSON.stringify(contactInfo)}
Social Links: ${JSON.stringify(socialLinks)}
Structured Data: ${JSON.stringify(structuredData)}
Meta Tags: ${JSON.stringify(metaTags)}
Open Graph Data: ${JSON.stringify(ogData)}
All Links: ${JSON.stringify(links.slice(0, 20))}

Social Media Research:
LinkedIn: ${JSON.stringify(socialResearch.linkedin)}
Twitter: ${JSON.stringify(socialResearch.twitter)}
GitHub: ${JSON.stringify(socialResearch.github)}
Additional Pages: ${JSON.stringify(socialResearch.additionalInfo)}

External Research:
Company Info: ${JSON.stringify(externalResearch.companyInfo)}
News Articles: ${JSON.stringify(externalResearch.newsArticles)}
Industry Data: ${JSON.stringify(externalResearch.industryData)}

Extract ONLY factual information that is explicitly stated in the content:`
        }
      ],
      max_tokens: 1200,
      temperature: 0.1,
    });
    
    const response = completion.choices[0].message.content.trim();
    
    try {
      // Clean the response and parse JSON
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsedData = JSON.parse(cleanedResponse);
      
      // Merge with extracted contact info and social research
      return {
        ...parsedData,
        contact: parsedData.contact || contactInfo.email || contactInfo.phone || '',
        socialLinks: parsedData.socialLinks || socialLinks,
        structuredData: structuredData,
        socialResearch: socialResearch,
        externalResearch: externalResearch
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return fallbackExtraction(domain, title, metaDescription, contactInfo, socialLinks);
    }
  } catch (error) {
    console.error('AI extraction failed:', error);
    return fallbackExtraction(domain, title, metaDescription, {}, {});
  }
}

function extractCompanyName($, domain, title) {
  // Try to extract company name from various sources
  let companyName = '';
  
  // Try structured data first
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonData = JSON.parse($(el).html());
      if (jsonData.name && !companyName) {
        companyName = jsonData.name;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  });
  
  // Try meta tags
  if (!companyName) {
    companyName = $('meta[property="og:site_name"]').attr('content') || '';
  }
  
  // Try title
  if (!companyName && title) {
    companyName = title.split(' - ')[0].split(' | ')[0].trim();
  }
  
  // Fallback to domain
  if (!companyName) {
    companyName = domain.replace(/^www\./, '').replace(/\.(com|org|net|co|io|ai|app|tech|dev|me|us|uk|ca|au|de|fr|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|ie|pt|gr|be|at|ch|li|mc|ad|va|sm)$/, '');
    companyName = companyName.split(/[-._]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }
  
  return companyName;
}

function extractContactInfo($, domain) {
  const contactInfo = {
    email: '',
    phone: '',
    address: ''
  };
  
  // Extract email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const bodyText = $('body').text();
  const emails = bodyText.match(emailRegex);
  if (emails && emails.length > 0) {
    contactInfo.email = emails[0];
  }
  
  // Extract phone numbers
  const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
  const phones = bodyText.match(phoneRegex);
  if (phones && phones.length > 0) {
    contactInfo.phone = phones[0].trim();
  }
  
  // Extract address from structured data or footer
  const addressSelectors = [
    '[itemtype*="Organization"] [itemprop="address"]',
    '[itemtype*="Organization"] [itemprop="streetAddress"]',
    'footer address',
    '.address',
    '#address'
  ];
  
  for (const selector of addressSelectors) {
    const address = $(selector).text().trim();
    if (address) {
      contactInfo.address = address;
      break;
    }
  }
  
  return contactInfo;
}

function extractSocialLinks($) {
  const socialLinks = {};
  const socialPlatforms = {
    'facebook.com': 'facebook',
    'twitter.com': 'twitter',
    'linkedin.com': 'linkedin',
    'instagram.com': 'instagram',
    'youtube.com': 'youtube',
    'tiktok.com': 'tiktok',
    'github.com': 'github'
  };
  
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      for (const [domain, platform] of Object.entries(socialPlatforms)) {
        if (href.includes(domain)) {
          socialLinks[platform] = href;
          break;
        }
      }
    }
  });
  
  return socialLinks;
}

function extractStructuredData($) {
  const structuredData = {};
  
  // Extract JSON-LD structured data
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonData = JSON.parse($(el).html());
      if (jsonData['@type'] === 'Organization' || jsonData['@type'] === 'LocalBusiness') {
        structuredData.organization = jsonData;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  });
  
  // Extract microdata
  $('[itemtype*="Organization"]').each((i, el) => {
    const $el = $(el);
    structuredData.microdata = {
      name: $el.find('[itemprop="name"]').text().trim(),
      url: $el.find('[itemprop="url"]').attr('href'),
      address: $el.find('[itemprop="address"]').text().trim(),
      telephone: $el.find('[itemprop="telephone"]').text().trim(),
      email: $el.find('[itemprop="email"]').text().trim()
    };
  });
  
  return structuredData;
}

function extractMetaTags($) {
  const metaTags = {};
  $('meta').each((i, el) => {
    const name = $(el).attr('name');
    const property = $(el).attr('property');
    const content = $(el).attr('content');

    if (name) {
      metaTags[name] = content;
    } else if (property) {
      metaTags[property] = content;
    }
  });
  return metaTags;
}

function extractOpenGraphData($) {
  const ogData = {};
  $('meta[property^="og:"]').each((i, el) => {
    const property = $(el).attr('property');
    const content = $(el).attr('content');
    if (property && content) {
      ogData[property.replace('og:', '')] = content;
    }
  });
  return ogData;
}

function fallbackExtraction(domain, title, metaDescription, contactInfo, socialLinks) {
  // Extract company name from domain only if no better source available
  let companyName = domain.replace(/^www\./, '').replace(/\.(com|org|net|co|io|ai|app|tech|dev|me|us|uk|ca|au|de|fr|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|ie|pt|gr|be|at|ch|li|mc|ad|va|sm)$/, '');
  companyName = companyName.split(/[-._]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  
  // Use title and description to extract basic info
  const titleText = title || '';
  const descText = metaDescription || '';
  
  // Extract product info from title and description
  let productInfo = '';
  if (titleText && descText) {
    productInfo = `${titleText} - ${descText}`.slice(0, 300);
  } else if (titleText) {
    productInfo = titleText.slice(0, 300);
  } else if (descText) {
    productInfo = descText.slice(0, 300);
  } else {
    productInfo = 'Not specified';
  }
  
  // Intelligent inference for product type and industry
  let productType = 'Business';
  let industry = 'Not specified';
  let targetAudience = 'Not specified';
  let valueProp = 'Not specified';
  
  const domainLower = domain.toLowerCase();
  const titleLower = titleText.toLowerCase();
  const descLower = descText.toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;
  
  // Infer product type and industry based on domain and content
  if (domainLower.includes('.io') || combinedText.includes('saas') || combinedText.includes('software')) {
    productType = 'SaaS Platform';
    industry = 'Technology';
    targetAudience = 'Businesses';
    valueProp = 'Provides software solutions for businesses';
  } else if (domainLower.includes('shop') || combinedText.includes('shop') || combinedText.includes('store')) {
    productType = 'E-commerce Store';
    industry = 'Retail';
    targetAudience = 'Consumers';
    valueProp = 'Enables online shopping and retail';
  } else if (combinedText.includes('agency') || combinedText.includes('consulting')) {
    productType = 'Agency';
    industry = 'Consulting';
    targetAudience = 'Businesses';
    valueProp = 'Provides professional services and consulting';
  } else if (combinedText.includes('app') || combinedText.includes('mobile')) {
    productType = 'Mobile Application';
    industry = 'Technology';
    targetAudience = 'Consumers';
    valueProp = 'Provides mobile solutions and apps';
  } else if (combinedText.includes('platform') || combinedText.includes('tool')) {
    productType = 'Platform';
    industry = 'Technology';
    targetAudience = 'Businesses';
    valueProp = 'Provides platform and tool solutions';
  } else if (combinedText.includes('marketplace') || combinedText.includes('market')) {
    productType = 'Marketplace';
    industry = 'E-commerce';
    targetAudience = 'Buyers and Sellers';
    valueProp = 'Connects buyers and sellers';
  } else if (combinedText.includes('social') || combinedText.includes('community')) {
    productType = 'Social Platform';
    industry = 'Technology';
    targetAudience = 'Individuals';
    valueProp = 'Builds communities and social networks';
  } else if (combinedText.includes('blog') || combinedText.includes('news')) {
    productType = 'Content Platform';
    industry = 'Media';
    targetAudience = 'Readers';
    valueProp = 'Provides content and information';
  }
  
  return {
    companyName: companyName || 'Not specified',
    productType,
    productInfo,
    headquarters: 'Not specified',
    keyProducts: 'Not specified',
    targetAudience,
    valueProp,
    contact: contactInfo.email || contactInfo.phone || 'Not specified',
    socialLinks,
    industry,
    companySize: 'Not specified',
    foundedYear: 'Not specified',
    mission: 'Not specified'
  };
}

// Add fetchWithTimeout helper
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlightmediaBot/1.0; +https://flightmedia.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        ...options.headers
      }
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
    
    // Fetch HTML with timeout and better headers
    const response = await fetchWithTimeout(normalizedUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return Response.json({ 
        error: `Failed to fetch website: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract basic metadata
    const getMeta = (name) => $(`meta[name='${name}']`).attr('content') || $(`meta[property='${name}']`).attr('content');
    const title = $('title').first().text() || '';
    const metaDescription = getMeta('description') || getMeta('og:description') || getMeta('twitter:description') || '';
    
    // Extract domain
    const urlObj = safeNewUrl(normalizedUrl);
    if (!urlObj) {
      return Response.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    const domain = urlObj.hostname;
    
    // Extract comprehensive business data
    const businessData = await extractComprehensiveBusinessData(
      html, 
      normalizedUrl, 
      domain, 
      title, 
      metaDescription
    );
    
    // Return comprehensive data with additional metadata
    return Response.json({
      ...businessData,
      companyUrl: normalizedUrl,
      // Additional metadata for console display
      title: title,
      description: metaDescription,
      domain: domain,
      scanTimestamp: new Date().toISOString(),
      // Enhanced logging for debugging
      extractionMethod: 'AI + Fallback',
      contentLength: html.length,
      hasStructuredData: Object.keys(businessData.structuredData || {}).length > 0
    });
    
  } catch (error) {
    console.error('Scrape error:', error);
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      return Response.json({ error: 'Request timeout - website took too long to respond' }, { status: 408 });
    }
    
    if (error.code === 'ENOTFOUND') {
      return Response.json({ error: 'Domain not found - please check the URL' }, { status: 404 });
    }
    
    return Response.json({ 
      error: 'Failed to scrape website - please try again or check the URL' 
    }, { status: 500 });
  }
} 