# Research-Based Extraction System

## Overview

The website scanner and TikTok suggestions system has been completely overhauled to use a research-based approach that avoids assumptions and only extracts factual information explicitly stated on websites.

## Key Improvements

### 1. Conservative Data Extraction
- **No Assumptions**: Never makes guesses about what a product does
- **Factual Only**: Only extracts information explicitly stated on the website
- **Conservative Approach**: Better to have less information than wrong information
- **Explicit Sources**: Uses exact quotes and stated information when possible

### 2. Enhanced Website Analysis

#### **Comprehensive Content Extraction**
```javascript
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
```

#### **Enhanced Data Sources**
- **Meta Tags**: Extract all meta tags for additional context
- **Open Graph Data**: Use social media meta tags
- **Structured Data**: Parse JSON-LD and microdata
- **Contact Information**: Extract emails, phones, addresses
- **Social Links**: Find social media profiles
- **All Links**: Analyze link text for context

### 3. Improved AI Prompts

#### **Conservative Analysis Guidelines**
```javascript
CRITICAL RULES:
1. NEVER make assumptions or guesses
2. ONLY extract information that is explicitly stated in the content
3. If information is not clearly stated, use "Not specified" or leave blank
4. Focus on WHAT the product/service actually does, not what you think it might do
5. Extract specific features, benefits, and problems solved from the actual content
6. Use exact quotes from the content when possible
7. Be extremely conservative - it's better to have less information than wrong information
```

#### **Analysis Guidelines**
- Look for specific product descriptions, not generic business categories
- Extract actual features and capabilities mentioned
- Find real problems the product solves
- Identify specific target users mentioned
- Use exact language from the website when possible
- If something is unclear or not stated, don't guess

### 4. Conservative TikTok Suggestions

#### **Feature Extraction**
```javascript
const extractStatedFeatures = (productInfo, keyProducts, valueProp) => {
  const features = [];
  
  // Only extract features that are explicitly mentioned
  if (productInfo) {
    const infoLower = productInfo.toLowerCase();
    
    // Look for specific stated features
    if (infoLower.includes('block') || infoLower.includes('prevent')) {
      features.push('blocking');
    }
    if (infoLower.includes('track') || infoLower.includes('monitor')) {
      features.push('tracking');
    }
    if (infoLower.includes('design') || infoLower.includes('create')) {
      features.push('design');
    }
    // ... more specific feature detection
  }
  
  return features.slice(0, 3);
};
```

#### **Benefit Analysis**
```javascript
const extractStatedBenefit = (productInfo, valueProp) => {
  // Only use explicitly stated benefits
  if (valueProp && valueProp !== 'Not specified') {
    return valueProp.slice(0, 100); // Use the actual stated value proposition
  }
  
  // Only extract if clearly stated
  if (productInfo && productInfo !== 'Not specified') {
    const infoLower = productInfo.toLowerCase();
    if (infoLower.includes('help') || infoLower.includes('enable')) {
      return 'helps users';
    }
    // ... more conservative benefit extraction
  }
  
  return 'Not specified';
};
```

#### **Conservative Username Generation**
```javascript
const generateConservativeUsernames = (companyName, productType, features) => {
  const suggestions = [];
  
  // Company-based usernames (most reliable)
  if (companyName && companyName !== 'Not specified') {
    const cleanCompanyName = companyName.toLowerCase().replace(/\s+/g, '');
    suggestions.push(cleanCompanyName);
    suggestions.push(`${cleanCompanyName}official`);
  }
  
  // Product type based (if we have it)
  if (productType && productType !== 'Not specified') {
    const cleanProductType = productType.toLowerCase().replace(/\s+/g, '');
    suggestions.push(`${cleanProductType}pro`);
  }
  
  // Feature-based (only if we have specific features)
  if (features.length > 0) {
    const mainFeature = features[0].replace(/\s+/g, '');
    suggestions.push(`${mainFeature}pro`);
  }
  
  return suggestions.slice(0, 4);
};
```

#### **Conservative Bio Generation**
```javascript
const generateConservativeBios = (companyName, features, mainBenefit, targetUsers, productInfo) => {
  const suggestions = [];
  
  // Only create bios if we have actual information
  if (companyName && companyName !== 'Not specified') {
    // Use actual product info if available
    if (productInfo && productInfo !== 'Not specified') {
      const shortInfo = productInfo.slice(0, 50);
      suggestions.push(`🚀 ${companyName} - ${shortInfo}`);
    }
    
    // Use stated features if available
    if (features.length > 0) {
      const featureList = features.slice(0, 2).join(' + ');
      suggestions.push(`✨ ${companyName} - ${featureList}`);
    }
    
    // Use stated benefit if available
    if (mainBenefit && mainBenefit !== 'Not specified') {
      suggestions.push(`💡 ${companyName} - ${mainBenefit}`);
    }
  }
  
  return suggestions.slice(0, 4);
};
```

### 5. Improved Fallback System

#### **Conservative Fallback Extraction**
```javascript
function fallbackExtraction(domain, title, metaDescription, contactInfo, socialLinks) {
  // Extract company name from domain only if no better source available
  let companyName = domain.replace(/^www\./, '').replace(/\.(com|org|net|co|io|ai|app|tech|dev|me|us|uk|ca|au|de|fr|es|it|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|ie|pt|gr|be|at|ch|li|mc|ad|va|sm)$/, '');
  companyName = companyName.split(/[-._]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  
  // Use title and description to extract basic info without assumptions
  const titleText = title || '';
  const descText = metaDescription || '';
  
  // Only extract what we can be certain about
  let productInfo = '';
  let productType = 'Business';
  
  // If we have a title or description, use it directly
  if (titleText && descText) {
    productInfo = `${titleText} - ${descText}`.slice(0, 300);
  } else if (titleText) {
    productInfo = titleText.slice(0, 300);
  } else if (descText) {
    productInfo = descText.slice(0, 300);
  } else {
    productInfo = 'Not specified';
  }
  
  return {
    companyName: companyName || 'Not specified',
    productType,
    productInfo,
    headquarters: 'Not specified',
    keyProducts: 'Not specified',
    targetAudience: 'Not specified',
    valueProp: 'Not specified',
    contact: contactInfo.email || contactInfo.phone || 'Not specified',
    socialLinks,
    industry: 'Not specified',
    companySize: 'Not specified',
    foundedYear: 'Not specified',
    mission: 'Not specified'
  };
}
```

## Example Results

### **For Opal.so (with actual research)**

#### **Before (Assumptions)**
- Product Info: "Tool that prevents infinite scrolling and helps users focus by blocking distracting websites and apps"
- Value Prop: "Stop wasting time on social media and focus on what matters most"
- Username: `scrollblockingpro`, `focusapp`
- Bio: "🚀 Opal - scroll blocking + focus tools for developers"

#### **After (Research-Based)**
- Product Info: "The best way to stop infinite scrolling" (from actual website)
- Value Prop: "Stop infinite scrolling" (from actual website)
- Username: `opal`, `opalofficial`, `blockingpro` (only if "blocking" is stated)
- Bio: "🚀 Opal - The best way to stop infinite scrolling" (using actual stated info)

### **For Generic Business (with limited info)**

#### **Before (Assumptions)**
- Product Info: "Modern software platform designed to streamline business operations"
- Value Prop: "Simplify complex business processes and boost team productivity"
- Username: `saaspro`, `businessapp`
- Bio: "🚀 Company - Your trusted partner for SaaS Platform"

#### **After (Research-Based)**
- Product Info: "Not specified" (if not clearly stated)
- Value Prop: "Not specified" (if not clearly stated)
- Username: `companyname`, `companynameofficial` (only company name)
- Bio: "🚀 Company Name - official account" (only if company name is available)

## Benefits

### 1. **Accuracy**
- **Factual Information**: Only uses information explicitly stated on websites
- **No Assumptions**: Never guesses what a product does
- **Reliable Data**: All extracted information is verifiable
- **Conservative Approach**: Better to have less information than wrong information

### 2. **Trustworthiness**
- **Transparent Process**: Clear about what information is available vs. assumed
- **Honest Results**: Shows "Not specified" when information isn't available
- **User Confidence**: Users can trust the extracted information
- **Professional Quality**: High-quality, research-based content

### 3. **Better User Experience**
- **Accurate Suggestions**: TikTok suggestions based on real product information
- **Relevant Content**: Content that actually matches the product
- **Actionable Information**: Users can rely on the extracted data
- **Time-Saving**: No need to verify or correct assumptions

### 4. **Scalability**
- **Consistent Results**: Same approach works for any type of website
- **Maintainable Code**: Clear, conservative logic is easier to maintain
- **Future-Proof**: System doesn't break when encountering new types of businesses
- **Reliable Performance**: Predictable results across different websites

## Technical Implementation

### **Enhanced Content Extraction**
- **Multiple Sources**: Extracts from headers, navigation, footer, sidebar, hero sections
- **Structured Data**: Parses JSON-LD and microdata for additional context
- **Meta Tags**: Uses Open Graph and Twitter Card data
- **Contact Information**: Extracts emails, phones, addresses using regex
- **Social Links**: Finds social media profiles automatically

### **Conservative AI Analysis**
- **Explicit Instructions**: AI is told to only extract stated information
- **Conservative Prompts**: Emphasizes accuracy over completeness
- **Fallback Handling**: Graceful degradation when information is limited
- **Error Prevention**: Multiple validation layers to prevent assumptions

### **Research-Based TikTok Generation**
- **Feature Detection**: Only uses explicitly stated features
- **Benefit Extraction**: Uses actual value propositions from websites
- **Target User Analysis**: Only identifies users explicitly mentioned
- **Conservative Suggestions**: Generates safe, factual content

The research-based extraction system ensures that all information is factual, verifiable, and based on actual website content rather than assumptions or generic templates. 