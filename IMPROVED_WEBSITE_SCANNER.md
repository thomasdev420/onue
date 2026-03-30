# Improved Website Scanner System

## Overview

The website scanner has been significantly enhanced to extract more comprehensive and accurate business information from websites. The system now uses advanced AI analysis combined with structured data extraction to provide detailed business intelligence.

## Key Improvements

### 1. Comprehensive Data Extraction
- **Enhanced AI Analysis**: Uses GPT-4o-mini for intelligent content analysis
- **Structured Data Parsing**: Extracts JSON-LD and microdata
- **Contact Information**: Automatically finds emails, phones, and addresses
- **Public profile links**: Detects and extracts outbound profile URLs
- **Business Intelligence**: Extracts industry, company size, founding year, and mission

### 2. Improved Accuracy
- **Multi-Source Analysis**: Combines HTML content, metadata, and structured data
- **Fallback Mechanisms**: Robust fallback when AI analysis fails
- **Better Error Handling**: Specific error messages for different failure types
- **Enhanced Headers**: Better browser simulation for improved compatibility

### 3. Extended Data Fields

#### Core Business Information
- **Company Name**: Extracted from official sources or domain
- **Product Type**: Business category classification
- **Product Info**: Detailed service description
- **Headquarters**: Location information
- **Key Products**: Main offerings
- **Target Audience**: Customer segments
- **Value Proposition**: Unique selling points

#### Additional Intelligence
- **Industry**: Business sector classification
- **Company Size**: Startup, Small Business, Enterprise, etc.
- **Founded Year**: Year of establishment
- **Mission Statement**: Company mission
- **Contact Information**: Email, phone, address
- **Profile links**: Facebook, Twitter/X, LinkedIn, etc.

## Technical Implementation

### AI Analysis Pipeline

```javascript
async function extractComprehensiveBusinessData(html, url, domain, title, metaDescription) {
  // 1. Extract structured content
  const $ = cheerio.load(html);
  const bodyText = $('body').text().slice(0, 2000);
  const h1Text = $('h1').map((i, el) => $(el).text().trim()).get().join(' | ');
  const h2Text = $('h2').map((i, el) => $(el).text().trim()).get().join(' | ');
  
  // 2. Extract contact information
  const contactInfo = extractContactInfo($, domain);
  
  // 3. Extract public profile links
  const socialLinks = extractSocialLinks($);
  
  // 4. Extract structured data
  const structuredData = extractStructuredData($);
  
  // 5. AI analysis with comprehensive prompt
  const aiResponse = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert business intelligence analyst..."
      },
      {
        role: "user", 
        content: `Website Content Analysis: ${context}`
      }
    ],
    max_tokens: 800,
    temperature: 0.1,
  });
}
```

### Contact Information Extraction

```javascript
function extractContactInfo($, domain) {
  const contactInfo = { email: '', phone: '', address: '' };
  
  // Extract emails using regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = $('body').text().match(emailRegex);
  
  // Extract phone numbers
  const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
  const phones = $('body').text().match(phoneRegex);
  
  // Extract addresses from structured data
  const addressSelectors = [
    '[itemtype*="Organization"] [itemprop="address"]',
    'footer address',
    '.address'
  ];
  
  return contactInfo;
}
```

### Public profile detection

```javascript
function extractSocialLinks($) {
  const socialPlatforms = {
    'facebook.com': 'facebook',
    'twitter.com': 'twitter', 
    'linkedin.com': 'linkedin',
    'instagram.com': 'instagram',
    'youtube.com': 'youtube',
    'tiktok.com': 'tiktok',
    'github.com': 'github'
  };
  
  // Scan all links for known profile hosts
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    // Match against social platforms
  });
}
```

### Structured Data Extraction

```javascript
function extractStructuredData($) {
  const structuredData = {};
  
  // Extract JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const jsonData = JSON.parse($(el).html());
      if (jsonData['@type'] === 'Organization') {
        structuredData.organization = jsonData;
      }
    } catch (e) {
      // Handle parsing errors
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
```

## Enhanced Error Handling

### Specific Error Messages
- **Timeout Errors**: "Request timeout - website took too long to respond"
- **Domain Errors**: "Domain not found - please check the URL"
- **Network Errors**: "Failed to scrape website - please try again"
- **Parsing Errors**: Graceful fallback to domain-based extraction

### Improved Fetch Configuration
```javascript
const response = await fetchWithTimeout(normalizedUrl, { 
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  }
});
```

## Console Logging Enhancements

### Real-Time Progress Updates
- 🔍 Starting comprehensive website scan...
- 📡 Connecting to website
- ✅ Connection established
- 📄 Fetching HTML content...
- 🔍 Parsing page structure...
- 📊 Extracting metadata...
- 🤖 Analyzing with AI...
- 📋 Processing business data...
- 🎉 Comprehensive scan completed successfully!

### Detailed Data Logging
- 📝 Title: [extracted title]
- 📄 Description: [meta description]
- 🏢 Company: [company name]
- 📦 Product Type: [business category]
- 📍 Headquarters: [location]
- 🎯 Target Audience: [customer segments]
- 💼 Key Products: [main offerings]
- 💡 Value Prop: [unique selling points]
- 📞 Contact: [contact information]
- 🏭 Industry: [industry classification]
- 📊 Company Size: [company size]
- 📅 Founded: [founding year]
- 🎯 Mission: [mission statement]
- 📱 Public profiles: [platforms detected]

## Benefits

### 1. More Accurate Data
- **AI-Powered Analysis**: Intelligent content understanding
- **Multi-Source Validation**: Cross-references multiple data sources
- **Structured Data Support**: Leverages website schema markup
- **Fallback Mechanisms**: Ensures data extraction even when AI fails

### 2. Comprehensive Information
- **Business Intelligence**: Industry, size, founding year, mission
- **Contact Details**: Email, phone, address extraction
- **Public presence**: Profile URL detection
- **Enhanced Metadata**: Rich business context

### 3. Better User Experience
- **Detailed Progress**: Real-time scanning updates
- **Comprehensive Logs**: Detailed console output
- **Error Clarity**: Specific error messages
- **Data Completeness**: More fields for business setup

### 4. Improved Reliability
- **Enhanced Headers**: Better website compatibility
- **Timeout Handling**: Graceful timeout management
- **Error Recovery**: Robust fallback mechanisms
- **Data Validation**: Ensures data quality

## Usage Examples

### Basic Website Scan
```javascript
const response = await fetch('/api/scrape-website', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

const data = await response.json();
console.log(data.companyName); // "Example Corp"
console.log(data.industry); // "Technology"
console.log(data.socialLinks); // { facebook: "...", twitter: "..." }
```

### Enhanced Business Information
```javascript
// Comprehensive business data structure
{
  companyName: "Tesla",
  productType: "Automotive & Clean Energy",
  productInfo: "Automotive and clean energy company focused on electric vehicles and sustainable technology.",
  headquarters: "Austin, Texas, United States",
  keyProducts: "Electric vehicles, solar panels, energy storage",
  targetAudience: "Environmentally conscious consumers and businesses",
  valueProp: "Accelerating the world's transition to sustainable energy",
  contact: "contact@tesla.com",
  industry: "Automotive & Clean Energy",
  companySize: "Enterprise",
  foundedYear: "2003",
  mission: "To accelerate the world's transition to sustainable energy",
  socialLinks: {
    twitter: "https://twitter.com/Tesla",
    facebook: "https://facebook.com/Tesla",
    instagram: "https://instagram.com/Tesla"
  }
}
```

## Future Enhancements

1. **Multi-Language Support**: Extract business data from non-English websites
2. **Image Analysis**: Analyze logos and product images
3. **Competitor Analysis**: Identify and analyze competitors
4. **Market Intelligence**: Extract market positioning and trends
5. **Real-time Updates**: Monitor website changes over time
6. **API Rate Limiting**: Implement intelligent rate limiting
7. **Caching System**: Cache results for improved performance
8. **Machine Learning**: Train custom models for specific industries

The improved website scanner provides a much more comprehensive business intelligence baseline: structured facts and public-profile signals that downstream models can use to describe a company accurately for AI-mediated discovery. 