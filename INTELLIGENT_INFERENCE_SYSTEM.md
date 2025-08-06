# Intelligent Inference System

## Overview

The system now includes intelligent inference capabilities that allow the AI to make reasonable deductions about businesses based on clear indicators, domain knowledge, and industry patterns. This balances accuracy with comprehensive information extraction.

## Intelligent Inference Guidelines

### 1. Industry Inference

#### **Technology Companies**
- **Indicators**: `.io` domains, mentions of "software", "platform", "SaaS"
- **Inference**: Industry = "Technology"
- **Examples**: 
  - `company.io` → Technology
  - "Software platform for businesses" → Technology
  - "SaaS solution" → Technology

#### **E-commerce Companies**
- **Indicators**: "shop" in domain, mentions of "store", "retail", "shopping"
- **Inference**: Industry = "Retail" or "E-commerce"
- **Examples**:
  - `shop.company.com` → Retail
  - "Online store" → E-commerce
  - "Retail platform" → Retail

#### **Consulting Companies**
- **Indicators**: "agency", "consulting", "services"
- **Inference**: Industry = "Consulting"
- **Examples**:
  - "Marketing agency" → Consulting
  - "Business consulting" → Consulting

### 2. Company Type Inference

#### **SaaS Platforms**
- **Indicators**: `.io` domain, "software", "platform", "SaaS"
- **Inference**: ProductType = "SaaS Platform"
- **Target Audience**: "Businesses"

#### **E-commerce Stores**
- **Indicators**: "shop", "store", "retail"
- **Inference**: ProductType = "E-commerce Store"
- **Target Audience**: "Consumers"

#### **Mobile Applications**
- **Indicators**: "app", "mobile", "iOS", "Android"
- **Inference**: ProductType = "Mobile Application"
- **Target Audience**: "Consumers"

#### **Marketplaces**
- **Indicators**: "marketplace", "market", "buyers", "sellers"
- **Inference**: ProductType = "Marketplace"
- **Target Audience**: "Buyers and Sellers"

### 3. Target Audience Inference

#### **Developers**
- **Indicators**: "developers", "engineers", "coders", "API", "SDK"
- **Inference**: TargetAudience = "Developers"

#### **Businesses**
- **Indicators**: "businesses", "enterprise", "B2B", "companies"
- **Inference**: TargetAudience = "Businesses"

#### **Consumers**
- **Indicators**: "consumers", "customers", "shopping", "retail"
- **Inference**: TargetAudience = "Consumers"

#### **Startups**
- **Indicators**: "startup", "entrepreneur", "small business"
- **Inference**: TargetAudience = "Startups"

### 4. Feature Inference

#### **Technology Features**
- **Indicators**: "AI", "artificial intelligence", "machine learning"
- **Inference**: Features = ["ai-powered"]

- **Indicators**: "cloud", "online", "web-based"
- **Inference**: Features = ["cloud"]

- **Indicators**: "mobile", "app", "iOS", "Android"
- **Inference**: Features = ["mobile"]

#### **Business Features**
- **Indicators**: "automate", "automatic", "workflow"
- **Inference**: Features = ["automation"]

- **Indicators**: "analytics", "insights", "data"
- **Inference**: Features = ["analytics"]

- **Indicators**: "secure", "safe", "security"
- **Inference**: Features = ["security"]

### 5. Benefit Inference

#### **Productivity Benefits**
- **Indicators**: "save time", "efficient", "productivity"
- **Inference**: Benefit = "saves time"

- **Indicators**: "automate", "automatic"
- **Inference**: Benefit = "automates tasks"

#### **Problem-Solving Benefits**
- **Indicators**: "solve", "fix", "problem"
- **Inference**: Benefit = "solves problems"

- **Indicators**: "help", "enable", "support"
- **Inference**: Benefit = "helps users"

#### **Connection Benefits**
- **Indicators**: "connect", "network", "community"
- **Inference**: Benefit = "connects people"

## Example Inferences

### **Technology Company Example**

**Input**: `company.io` with description "AI-powered software platform for developers"

**Inferences**:
- Industry: "Technology" (based on `.io` domain and "software platform")
- ProductType: "SaaS Platform" (based on "software platform")
- TargetAudience: "Developers" (explicitly stated)
- Features: ["ai-powered", "platform"] (based on "AI-powered" and "platform")
- Benefit: "provides powerful tools" (inferred from platform type)

### **E-commerce Company Example**

**Input**: `shop.company.com` with description "Online store for fashion"

**Inferences**:
- Industry: "Retail" (based on "shop" in domain and "store")
- ProductType: "E-commerce Store" (based on "online store")
- TargetAudience: "Consumers" (inferred from retail context)
- Features: ["e-commerce"] (based on online store)
- Benefit: "enables online shopping" (inferred from e-commerce)

### **Consulting Company Example**

**Input**: `agency.company.com` with description "Marketing agency for businesses"

**Inferences**:
- Industry: "Consulting" (based on "agency")
- ProductType: "Agency" (based on "agency")
- TargetAudience: "Businesses" (explicitly stated)
- Features: ["services"] (inferred from agency type)
- Benefit: "provides professional services" (inferred from agency)

## Implementation

### **AI Prompt Guidelines**

```javascript
INTELLIGENT INFERENCE GUIDELINES:
- **Industry Inference**: If a company sells software, infer "Technology" industry. If they sell physical products, infer "E-commerce" or "Retail"
- **Company Type Inference**: If they have a .io domain, infer "SaaS/Technology". If they have "shop" in domain, infer "E-commerce"
- **Target Audience Inference**: If they mention "developers" or "engineers", infer "Developers". If they mention "businesses", infer "Businesses"
- **Product Type Inference**: If they mention "app", "platform", "software", infer "SaaS Platform" or "Technology"
- **Location Inference**: If they mention a city/state in content, infer that as headquarters
- **Company Size Inference**: If they mention "startup", "small team", infer "Startup". If they mention "enterprise", infer "Enterprise"
```

### **TikTok Suggestions Inference**

```javascript
// Intelligent inference based on product type and industry
if (features.length === 0 && productInfo) {
  const infoLower = productInfo.toLowerCase();
  
  // Infer features based on common patterns
  if (infoLower.includes('platform') || infoLower.includes('software')) {
    features.push('platform');
  }
  if (infoLower.includes('tool') || infoLower.includes('utility')) {
    features.push('productivity');
  }
  if (infoLower.includes('service') || infoLower.includes('consulting')) {
    features.push('services');
  }
  if (infoLower.includes('marketplace') || infoLower.includes('market')) {
    features.push('marketplace');
  }
}
```

### **Fallback Extraction Inference**

```javascript
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
}
```

## Benefits

### 1. **Comprehensive Information**
- **Fills Gaps**: Uses inference to provide information when not explicitly stated
- **Industry Knowledge**: Leverages domain expertise for accurate categorization
- **Pattern Recognition**: Identifies common business patterns and types
- **Context Awareness**: Uses multiple indicators for accurate inference

### 2. **Balanced Approach**
- **Prioritizes Stated Information**: Uses explicit information over inferences
- **Reasonable Inferences**: Only makes inferences based on clear indicators
- **Conservative When Uncertain**: Falls back to "Not specified" when unclear
- **Cross-Reference Verification**: Uses multiple sources to verify inferences

### 3. **Better User Experience**
- **More Complete Profiles**: Provides comprehensive business information
- **Accurate Categorization**: Properly categorizes businesses by type and industry
- **Relevant Suggestions**: Generates more relevant TikTok suggestions
- **Professional Quality**: High-quality, intelligent business analysis

### 4. **Scalable Intelligence**
- **Pattern-Based**: Uses common business patterns for inference
- **Domain-Aware**: Understands different industry types and business models
- **Extensible**: Easy to add new inference patterns
- **Consistent**: Same inference logic across all businesses

## Example Results

### **Before (Conservative Only)**
- Industry: "Not specified"
- ProductType: "Business"
- TargetAudience: "users"
- Features: []
- Benefit: "Not specified"

### **After (With Intelligent Inference)**
- Industry: "Technology" (inferred from .io domain)
- ProductType: "SaaS Platform" (inferred from software mentions)
- TargetAudience: "Developers" (inferred from developer mentions)
- Features: ["platform", "ai-powered"] (inferred from content)
- Benefit: "provides powerful tools" (inferred from platform type)

The intelligent inference system provides much more comprehensive and accurate business analysis while maintaining reliability and avoiding incorrect assumptions. 