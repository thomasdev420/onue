# Enhanced Research System

## Overview

The website scanner now includes comprehensive research capabilities that go beyond the initial website to gather information from social media platforms, business directories, news sources, and other external sources. This provides much deeper and more accurate business intelligence.

## Research Capabilities

### 1. Social Media Research

#### **LinkedIn Research**
```javascript
// Research LinkedIn for company information
const linkedinUrl = `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`;

// Extract company information
const description = $('.org-top-card-summary__tagline').text().trim();
const industry = $('.org-about-company-module__industry').text().trim();
const size = $('.org-about-company-module__company-staff-count').text().trim();
const founded = $('.org-about-company-module__founded').text().trim();
```

**Data Extracted:**
- Company description and tagline
- Industry classification
- Company size and employee count
- Founded year
- Headquarters location
- Company overview

#### **Twitter/X Research**
```javascript
// Research Twitter/X for company information
const twitterUrl = `https://twitter.com/${companyName.toLowerCase().replace(/\s+/g, '')}`;

// Extract profile information
const bio = $('[data-testid="UserDescription"]').text().trim();
const location = $('[data-testid="UserLocation"]').text().trim();
const website = $('[data-testid="UserUrl"]').text().trim();
```

**Data Extracted:**
- Company bio and description
- Location information
- Website links
- Recent tweets and announcements
- Follower count and engagement

#### **GitHub Research**
```javascript
// Research GitHub for tech companies
const githubUrl = `https://github.com/${companyName.toLowerCase().replace(/\s+/g, '')}`;

// Extract profile information
const bio = $('.p-note').text().trim();
const location = $('.p-label').text().trim();
const website = $('.Link--primary').attr('href');
```

**Data Extracted:**
- Company bio and description
- Location information
- Website links
- Repository information
- Technology stack
- Open source contributions

### 2. External Source Research

#### **Business Directory Research**
```javascript
// Research company information from business databases
const businessDirectories = [
  `https://www.crunchbase.com/organization/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
  `https://angel.co/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
  `https://www.producthunt.com/companies/${companyName.toLowerCase().replace(/\s+/g, '-')}`
];

// Extract company information
const description = $('.description, .summary, .about').text().trim();
const industry = $('.industry, .category').text().trim();
const founded = $('.founded, .established').text().trim();
const funding = $('.funding, .investment').text().trim();
```

**Data Extracted:**
- Company descriptions and summaries
- Industry classifications
- Founded dates
- Funding information
- Investor details
- Company metrics

#### **News Research**
```javascript
// Research news articles about the company
const newsSources = [
  `https://news.google.com/search?q=${encodeURIComponent(companyName)}&hl=en`,
  `https://techcrunch.com/tag/${companyName.toLowerCase().replace(/\s+/g, '-')}/`,
  `https://www.theverge.com/search?q=${encodeURIComponent(companyName)}`
];

// Extract recent news articles
$('article, .post, .story').slice(0, 5).each((i, el) => {
  const title = $(el).find('h1, h2, h3, .title').text().trim();
  const summary = $(el).find('.summary, .excerpt, .description').text().trim();
  const date = $(el).find('.date, .time').text().trim();
});
```

**Data Extracted:**
- Recent news articles
- Company announcements
- Product launches
- Funding news
- Industry mentions
- Press releases

#### **Industry Research**
```javascript
// Research industry and market information
const industrySources = [
  `https://www.statista.com/topics/search/?q=${encodeURIComponent(industry)}`,
  `https://www.ibisworld.com/search/?q=${encodeURIComponent(industry)}`
];

// Extract industry insights
const marketSize = $('.market-size, .industry-size').text().trim();
const growthRate = $('.growth-rate, .growth').text().trim();
const trends = $('.trends, .market-trends').text().trim();
```

**Data Extracted:**
- Market size and industry data
- Growth rates and trends
- Competitive landscape
- Industry insights
- Market forecasts

### 3. Company Website Deep Research

#### **Additional Pages Research**
```javascript
// Research company website for additional pages
const commonPages = [
  '/about', '/about-us', '/company', '/team', '/our-story',
  '/products', '/services', '/solutions', '/features',
  '/contact', '/support', '/help', '/faq',
  '/blog', '/news', '/press', '/media'
];

// Extract content from each page
const title = $('title').text().trim();
const description = $('meta[name="description"]').attr('content') || '';
const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500);
```

**Pages Researched:**
- About pages and company information
- Product and service pages
- Team and leadership pages
- Contact and support pages
- Blog and news pages
- Press and media pages

## Enhanced Data Structure

### **Comprehensive Research Results**
```javascript
{
  // Website data
  companyName: "Extracted company name",
  productType: "Business category",
  productInfo: "What the product actually does",
  headquarters: "Location information",
  keyProducts: "Specific products/services",
  targetAudience: "Target customers",
  valueProp: "Value proposition",
  contact: "Contact information",
  socialLinks: "Social media links",
  industry: "Industry classification",
  companySize: "Company size",
  foundedYear: "Year founded",
  mission: "Mission statement",
  
  // Social media research
  socialResearch: {
    linkedin: { description, industry, size, founded },
    twitter: { bio, location, website },
    github: { bio, location, website },
    additionalInfo: [{ page, title, description, content }]
  },
  
  // External research
  externalResearch: {
    companyInfo: { description, industry, founded, funding },
    newsArticles: [{ title, summary, date }],
    industryData: { marketSize, growthRate, trends }
  }
}
```

## Research Process

### **1. Initial Website Analysis**
- Extract comprehensive content from main website
- Parse structured data and meta tags
- Identify company name and basic information

### **2. Social Media Research**
- Research LinkedIn for company profile and industry data
- Research Twitter/X for company bio and recent updates
- Research GitHub for tech company information
- Research additional company website pages

### **3. External Source Research**
- Research business directories (Crunchbase, AngelList, Product Hunt)
- Research news sources for recent articles and announcements
- Research industry databases for market insights
- Cross-reference information for accuracy

### **4. Data Integration**
- Combine all research sources
- Verify consistency across sources
- Prioritize official company information
- Use external sources to fill gaps

## Example Research Results

### **For Opal.so (Enhanced Research)**

#### **Website Analysis**
- Product Info: "The best way to stop infinite scrolling"
- Company Name: "Opal"

#### **Social Media Research**
- **LinkedIn**: Company size, industry, founded year
- **Twitter**: Bio, location, recent announcements
- **GitHub**: Tech stack, open source contributions

#### **External Research**
- **Crunchbase**: Funding information, investor details
- **News**: Recent product launches, company updates
- **Industry**: Productivity tool market insights

#### **Enhanced TikTok Suggestions**
- **Username**: `opal`, `opalofficial`, `productivitypro`
- **Bio**: "🚀 Opal - The best way to stop infinite scrolling | Backed by [investors] | [Industry insights]"
- **Hashtags**: `#opal`, `#productivity`, `#focus`, `#productivitytools`, `#saas`

### **For Generic Business (Limited Info)**

#### **Website Analysis**
- Product Info: "Not specified"
- Company Name: "Company Name"

#### **Social Media Research**
- **LinkedIn**: Industry, company size, founded year
- **Twitter**: Bio and location
- **Additional Pages**: About page, product pages

#### **External Research**
- **Business Directories**: Company description, industry
- **News**: Recent company news and announcements

#### **Enhanced TikTok Suggestions**
- **Username**: `companyname`, `companynameofficial`
- **Bio**: "🚀 Company Name - [Industry] | [Company size] | [Founded year]"
- **Hashtags**: `#companyname`, `#[industry]`, `#business`, `#tech`

## Benefits

### 1. **Comprehensive Information**
- **Multiple Sources**: Research from website, social media, and external sources
- **Deep Insights**: Industry data, market trends, and competitive landscape
- **Recent Updates**: News articles and social media updates
- **Verified Data**: Cross-referenced information from multiple sources

### 2. **Accurate TikTok Suggestions**
- **Rich Context**: Industry insights and market positioning
- **Recent Information**: Latest company updates and announcements
- **Competitive Analysis**: Understanding of market position
- **Trending Topics**: Current industry trends and news

### 3. **Professional Quality**
- **Research-Based**: All information comes from actual research
- **Comprehensive**: Covers multiple aspects of the business
- **Up-to-Date**: Includes recent news and social media updates
- **Verified**: Cross-referenced across multiple sources

### 4. **Scalable Research**
- **Automated Process**: Systematic research across multiple sources
- **Error Handling**: Graceful degradation when sources are unavailable
- **Consistent Results**: Same research process for any company
- **Extensible**: Easy to add new research sources

## Technical Implementation

### **Research Pipeline**
1. **Website Analysis**: Extract comprehensive content from main website
2. **Social Media Research**: Research LinkedIn, Twitter, GitHub profiles
3. **External Research**: Research business directories and news sources
4. **Data Integration**: Combine and verify information from all sources
5. **AI Analysis**: Use enhanced data for more accurate AI analysis

### **Error Handling**
- **Graceful Degradation**: Continue research even if some sources fail
- **Timeout Protection**: Prevent research from taking too long
- **Fallback Options**: Use alternative sources when primary sources fail
- **Conservative Approach**: Better to have less information than wrong information

### **Performance Optimization**
- **Parallel Research**: Research multiple sources simultaneously
- **Caching**: Cache research results to avoid repeated requests
- **Rate Limiting**: Respect rate limits of external sources
- **Timeout Management**: Set appropriate timeouts for each source

The enhanced research system provides much deeper and more accurate business intelligence by combining website analysis with social media research and external source investigation. 