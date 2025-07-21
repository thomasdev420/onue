import { getSupabase } from '../../supabaseClient';
import { apiLogger } from '../utils/logger';
import OpenAI from 'openai';
import { buildContextAwarePrompt } from '../utils/contextPriority.js';
import { retrieveUserMemory, buildMemoryContext, extractMemoryInsights, storeMemoryInsights } from './aiMemoryService.js';
import { UNIFIED_CATEGORIES, getCategoryKeywords } from '../shared/constants/imageCategories.js';
import { getModelConfig } from '../utils/modelSelection.js';
import { getIntelligenceMode } from './userSettingsService.js';
import { visualAnalysisService } from './visualAnalysisService.js';
import { creditService } from './creditService.js';

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

// Stock photo categories with keywords
const STOCK_PHOTO_CATEGORIES = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => [key, value.keywords])
);

/**
 * Unified Content Engine - Single service for generating complete slide content
 * Combines text generation and image selection into one streamlined process
 */
export class UnifiedContentEngine {
  constructor() {
    this.cache = new Map();
    this.categoryCache = new Map();
    this.usedImages = new Set(); // Simplified to single tracking like the old code
    this.rateLimitStatus = { isLimited: false, lastCheck: 0, retryAfter: 0 };
  }

  /**
   * AI-powered category detection using ChatGPT 4o
   * Analyzes user prompt and intelligently selects the most suitable categories
   * @param {string} prompt - User prompt
   * @param {Object} businessContext - Business context for better analysis
   * @returns {Promise<Array>} Array of detected categories
   */
  async detectCategoriesFromPrompt(prompt, businessContext = {}, intelligenceMode = 'normal') {
    try {
      const openaiClient = getOpenAI();
      
      // Build context for better category analysis
      let contextInfo = '';
      if (businessContext?.companyName) {
        contextInfo += `Company: ${businessContext.companyName}\n`;
      }
      if (businessContext?.businessType) {
        contextInfo += `Business Type: ${businessContext.businessType}\n`;
      }
      if (businessContext?.productInfo) {
        contextInfo += `Product: ${businessContext.productInfo}\n`;
      }
      
      const systemPrompt = `You are an expert at analyzing content and selecting the most appropriate image categories for visual content creation.

CRITICAL RULE: You MUST select ONLY ONE category per generation. Never select multiple categories.

Available image categories:
${Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => 
  `- ${key}: ${value.name} (${value.keywords.join(', ')})`
).join('\n')}

TASK: Analyze the user's prompt and select the SINGLE most appropriate image category that would best represent the visual style and theme of the content they want to create.

ANALYSIS GUIDELINES:

1. Select ONLY ONE category - the most dominant and relevant category
2. Consider the business context if provided
3. Never use the same image twice in the same slide generation
4. Pick the category that best represents the overall theme, not multiple categories
5. Available image categories: ${Object.keys(UNIFIED_CATEGORIES).join(', ')}

RESPONSE FORMAT: Return ONLY a JSON object with a "categories" array containing EXACTLY ONE category key.
Example: {"categories": ["business"]}

EXAMPLES (SINGLE CATEGORY ONLY):
User prompt: "Create slides about startup funding and investment strategies"
Business context: Technology startup
Response: {"categories": ["finance"]}

User prompt: "Make motivational content about fitness and health"
Response: {"categories": ["health"]}

User prompt: "Design slides about luxury travel destinations"
Response: {"categories": ["luxury"]}

User prompt: "Create content about team collaboration in modern offices"
Response: {"categories": ["business"]}`;

      const userPrompt = `${contextInfo ? `Context:\n${contextInfo}\n` : ''}User prompt: "${prompt}"

Select the most appropriate image categories:`;

      // Get model configuration based on intelligence mode
      const modelConfig = getModelConfig(intelligenceMode, prompt, businessContext, 'category');
      apiLogger.debug(`Using model config for category detection (${intelligenceMode} mode):`, {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      });
      
      const completion = await openaiClient.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: modelConfig.max_tokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.top_p,
        frequency_penalty: modelConfig.frequency_penalty,
        presence_penalty: modelConfig.presence_penalty,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI category analysis');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        apiLogger.warn('Failed to parse AI category response, falling back to keyword detection:', parseError.message);
        return this.detectCategoriesFromPromptFallback(prompt);
      }

      // Extract categories from the response
      let detectedCategories = [];
      if (Array.isArray(parsedResponse.categories)) {
        detectedCategories = parsedResponse.categories;
      } else if (Array.isArray(parsedResponse)) {
        detectedCategories = parsedResponse;
      } else {
        // Try to find categories in the response object
        detectedCategories = Object.values(parsedResponse).filter(val => 
          Array.isArray(val) && val.every(cat => typeof cat === 'string')
        ).flat();
      }

      // Validate that all detected categories exist in our unified categories
      const validCategories = detectedCategories.filter(category => 
        UNIFIED_CATEGORIES.hasOwnProperty(category)
      );

      if (validCategories.length === 0) {
        apiLogger.warn('No valid categories detected by AI, falling back to keyword detection');
        return this.detectCategoriesFromPromptFallback(prompt);
      }

      // ENFORCE SINGLE CATEGORY RULE - return only the first (most relevant) category
      const singleCategory = [validCategories[0]];
      apiLogger.info(`🎯 AI detected categories: ${validCategories.join(', ')}, using SINGLE category: ${singleCategory[0]}`);
      return singleCategory;

    } catch (error) {
      apiLogger.error('Error in AI category detection, falling back to keyword detection:', error.message);
      return this.detectCategoriesFromPromptFallback(prompt);
    }
  }

  /**
   * Enhanced AI-powered specific keyword detection for precise image selection
   * Analyzes user prompt and extracts specific keywords for targeted image selection
   * @param {string} prompt - User prompt
   * @param {Object} businessContext - Business context for better analysis
   * @returns {Promise<Object>} Object with categories and specific keywords
   */
  async detectSpecificKeywordsFromPrompt(prompt, businessContext = {}, intelligenceMode = 'normal') {
    try {
      const openaiClient = getOpenAI();
      
      // Build context for better keyword analysis
      let contextInfo = '';
      if (businessContext?.companyName) {
        contextInfo += `Company: ${businessContext.companyName}\n`;
      }
      if (businessContext?.businessType) {
        contextInfo += `Business Type: ${businessContext.businessType}\n`;
      }
      if (businessContext?.productInfo) {
        contextInfo += `Product: ${businessContext.productInfo}\n`;
      }
      
      const systemPrompt = `You are an expert at analyzing content and extracting specific keywords for precise image selection.

CRITICAL RULE: You MUST select ONLY ONE category per generation. Never select multiple categories.

TASK: Analyze the user's prompt and extract:
1. The SINGLE most appropriate image category (from the available categories)
2. Specific keywords that should be present in the selected images for maximum relevance

AVAILABLE IMAGE CATEGORIES:
${Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => 
  `- ${key}: ${value.name} (${value.keywords.join(', ')})`
).join('\n')}

ANALYSIS GUIDELINES:
1. Select ONLY ONE category - the most dominant and relevant category
2. Extract 5-8 specific keywords that should appear in image titles or descriptions
3. Focus on visual elements, objects, scenes, or concepts mentioned in the prompt
4. Consider the business context for more targeted keyword selection
5. Keywords should be specific enough to find relevant images but not so specific that no images match
6. IMPORTANT: Pick the category that best represents the overall theme, not multiple categories
7. AVOID generic categories like "general" - pick the most specific relevant category
8. Think about what visual elements would best represent the content theme

RESPONSE FORMAT: Return ONLY a JSON object with:
{
  "category": "single_selected_category_key",
  "specificKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

EXAMPLES (SINGLE CATEGORY ONLY):
User prompt: "Create slides about startup funding and investment strategies"
Response: {
  "category": "finance",
  "specificKeywords": ["investment", "funding", "startup", "money", "business", "entrepreneur", "growth", "success"]
}

User prompt: "Make motivational content about fitness and health"
Response: {
  "category": "health",
  "specificKeywords": ["fitness", "workout", "healthy", "exercise", "wellness", "athlete", "strength", "motivation"]
}

User prompt: "Design slides about luxury travel destinations"
Response: {
  "category": "luxury",
  "specificKeywords": ["luxury", "travel", "destination", "premium", "exclusive", "resort", "vacation", "paradise"]
}

User prompt: "Create content about team collaboration in modern offices"
Response: {
  "category": "business",
  "specificKeywords": ["team", "collaboration", "office", "meeting", "workplace", "professional", "partnership", "success"]
}

User prompt: "Create slides about nature and environmental conservation"
Response: {
  "category": "nature",
  "specificKeywords": ["nature", "environment", "conservation", "wildlife", "outdoor", "forest", "sustainability", "green"]
}

User prompt: "Create slides about personality types and psychology"
Response: {
  "category": "abstract",
  "specificKeywords": ["psychology", "personality", "mind", "thinking", "brain", "analysis", "understanding", "behavior"]
}

User prompt: "Create slides about romantic relationships and love"
Response: {
  "category": "lifestyle",
  "specificKeywords": ["love", "romance", "relationship", "couple", "heart", "emotion", "connection", "intimacy"]
}`;

      const userPrompt = `${contextInfo ? `Context:\n${contextInfo}\n` : ''}User prompt: "${prompt}"

Extract the most appropriate category and specific keywords:`;

      // Get model configuration based on intelligence mode
      const modelConfig = getModelConfig(intelligenceMode, prompt, businessContext, 'keyword');
      apiLogger.debug(`Using model config for keyword detection (${intelligenceMode} mode):`, {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      });
      
      const completion = await openaiClient.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: modelConfig.max_tokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.top_p,
        frequency_penalty: modelConfig.frequency_penalty,
        presence_penalty: modelConfig.presence_penalty,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI keyword analysis');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        apiLogger.warn('Failed to parse AI keyword response, falling back to category detection:', parseError.message);
        const categories = await this.detectCategoriesFromPrompt(prompt, businessContext, intelligenceMode);
        return {
          category: categories[0] || 'business',
          specificKeywords: []
        };
      }

      // Validate the response structure and ensure SINGLE category
      if (!parsedResponse.category || !UNIFIED_CATEGORIES.hasOwnProperty(parsedResponse.category)) {
        apiLogger.warn('Invalid category in AI response, falling back to category detection');
        const categories = await this.detectCategoriesFromPrompt(prompt, businessContext, intelligenceMode);
        return {
          category: categories[0] || 'business', // Ensure only ONE category
          specificKeywords: parsedResponse.specificKeywords || []
        };
      }

      // ENFORCE SINGLE CATEGORY RULE
      const selectedCategory = parsedResponse.category;
      apiLogger.info(`🎯 SINGLE CATEGORY SELECTED: ${selectedCategory} for entire generation`);
      
      // Validate that we're not getting multiple categories
      if (Array.isArray(selectedCategory)) {
        apiLogger.warn(`⚠️ AI returned multiple categories, using only the first: ${selectedCategory[0]}`);
        parsedResponse.category = selectedCategory[0];
      }

      // Validate and clean specific keywords
      const specificKeywords = Array.isArray(parsedResponse.specificKeywords) 
        ? parsedResponse.specificKeywords.filter(keyword => typeof keyword === 'string' && keyword.trim().length > 0)
        : [];

      apiLogger.debug(`AI detected category: ${parsedResponse.category}, specific keywords: ${specificKeywords.join(', ')}`);
      
      return {
        category: parsedResponse.category,
        specificKeywords: specificKeywords
      };

    } catch (error) {
      apiLogger.error('Error in AI specific keyword detection, falling back to category detection:', error.message);
      const categories = await this.detectCategoriesFromPrompt(prompt, businessContext, intelligenceMode);
      return {
        category: categories[0] || 'business',
        specificKeywords: []
      };
    }
  }

  /**
   * Fallback method using the original keyword-based detection
   * @param {string} prompt - User prompt
   * @returns {Array} Array of detected categories
   */
  detectCategoriesFromPromptFallback(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const detectedCategories = [];
    
    for (const [category, categoryData] of Object.entries(UNIFIED_CATEGORIES)) {
      for (const keyword of categoryData.keywords) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          detectedCategories.push(category);
          break; // Found one keyword for this category, move to next
        }
      }
    }
    
    // ENFORCE SINGLE CATEGORY RULE - return only the first (most relevant) category
    const singleCategory = detectedCategories.length > 0 ? [detectedCategories[0]] : ['business'];
    apiLogger.debug(`Fallback detected categories: ${detectedCategories.join(', ')}, using SINGLE category: ${singleCategory[0]}`);
    return singleCategory;
  }

  /**
   * Intelligent semantic fallback for image selection
   * Uses AI to determine the most relevant image category when specific keywords don't match
   * @param {string} prompt - Original user prompt
   * @param {Array} specificKeywords - Keywords that didn't find matches
   * @param {Object} businessContext - Business context
   * @returns {Promise<string>} Fallback category
   */
  async getIntelligentFallbackCategory(prompt, specificKeywords, businessContext = {}, intelligenceMode = 'normal') {
    try {
      apiLogger.debug(`Using AI for intelligent fallback analysis...`);
      
      const openaiClient = getOpenAI();
      
      // Build context for better reasoning
      let contextInfo = '';
      if (businessContext?.companyName) {
        contextInfo += `Company: ${businessContext.companyName}\n`;
      }
      if (businessContext?.businessType) {
        contextInfo += `Business Type: ${businessContext.businessType}\n`;
      }
      
      const systemPrompt = `You are an expert at analyzing content and determining the most appropriate image categories for visual content creation.

TASK: The user requested images for specific keywords that don't exist in our image database. Your job is to analyze the context and determine what category of images would best represent the theme, mood, or concept of their request.

AVAILABLE IMAGE CATEGORIES:
${Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => 
  `- ${key}: ${value.name} (${value.keywords.join(', ')})`
).join('\n')}

ANALYSIS GUIDELINES:
1. Use your vast contextual knowledge about people, places, concepts, and cultural references
2. Think about what the user is trying to convey or represent visually
3. Consider the broader theme, mood, or concept behind their request
4. Select the category that would best visually represent their content
5. Consider emotional resonance, cultural associations, and visual symbolism
6. Be dynamic and creative in your reasoning - don't rely on rigid rules

EXAMPLES OF INTELLIGENT REASONING:
- "iman gadzhi" → luxury (wealth, entrepreneurship, luxury lifestyle, success)
- "elon musk" → technology (innovation, space, electric cars, future)
- "kylie jenner" → luxury (fashion, wealth, lifestyle, influence)
- "cristiano ronaldo" → sports (athleticism, success, fitness, competition)
- "tesla" → technology (electric cars, innovation, sustainability, future)
- "meditation" → lifestyle (wellness, peace, mindfulness, personal growth)
- "startup funding" → finance (investment, money, business growth, opportunity)
- "sustainable living" → nature (environment, green living, eco-friendly)
- "urban nightlife" → urban (city, night, entertainment, metropolitan)
- "family bonding" → family (relationships, love, togetherness, connection)

RESPONSE FORMAT: Return ONLY the category key (e.g., "luxury", "technology", "business").

AVAILABLE CATEGORIES: ${Object.keys(UNIFIED_CATEGORIES).join(', ')}`;

      const userPrompt = `${contextInfo ? `Context:\n${contextInfo}\n` : ''}User prompt: "${prompt}"
Specific keywords that didn't find matches: ${specificKeywords.join(', ')}

What category would best represent the theme or concept of this content?`;

      // Get model configuration based on intelligence mode
      const modelConfig = getModelConfig(intelligenceMode, prompt, businessContext, 'category');
      apiLogger.debug(`Using model config for intelligent fallback (${intelligenceMode} mode):`, {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      });
      
      const completion = await openaiClient.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: modelConfig.max_tokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.top_p,
        frequency_penalty: modelConfig.frequency_penalty,
        presence_penalty: modelConfig.presence_penalty,
      });

      const response = completion.choices[0]?.message?.content?.trim().toLowerCase();
      if (!response) {
        throw new Error('No response from AI fallback analysis');
      }

      // Clean the response and validate it's a valid category
      const cleanResponse = response.replace(/[^a-z_]/g, '');
      
      // Check if the response is a valid category
      if (UNIFIED_CATEGORIES.hasOwnProperty(cleanResponse)) {
        apiLogger.debug(`AI fallback selected category: ${cleanResponse} for keywords: ${specificKeywords.join(', ')}`);
        return cleanResponse;
      }

      // If the response isn't a valid category, try to find the closest match
      const validCategories = Object.keys(UNIFIED_CATEGORIES);
      for (const category of validCategories) {
        if (cleanResponse.includes(category) || category.includes(cleanResponse)) {
          apiLogger.debug(`AI fallback matched category: ${category} for response: ${cleanResponse}`);
          return category;
        }
      }

      // If still no match, return business as default
      apiLogger.warn(`Could not determine fallback category from AI response: "${response}". Using business as default.`);
      return 'business';

    } catch (error) {
      apiLogger.error('Error in intelligent fallback category detection:', error.message);
      return 'business'; // Default fallback
    }
  }

  /**
   * Generate complete slides with text and images in one unified process
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - User prompt
   * @param {number} params.slideCount - Number of slides to generate
   * @param {Object} params.businessContext - Business context
   * @param {Object} params.userInfo - User information
   * @param {Array} params.existingSlides - Existing slides for context
   * @returns {Promise<Array>} Complete slides with text and images
   */
  async generateCompleteSlides({ prompt, slideCount = 5, businessContext, userInfo, existingSlides = [] }) {
    // Skip credit checks for vaporware - allow all functionality
    // TODO: Re-enable credit checks when moving to production
    apiLogger.info('Skipping credit checks for vaporware development');

    // Get user's intelligence mode setting
    let intelligenceMode = 'normal'; // Default fallback
    if (userInfo?.email) {
      try {
        intelligenceMode = await getIntelligenceMode(userInfo.email);
        apiLogger.debug(`Using intelligence mode: ${intelligenceMode} for user: ${userInfo.email}`);
      } catch (error) {
        apiLogger.warn(`Failed to get intelligence mode for user ${userInfo.email}, using default:`, error.message);
      }
    }
    try {
      apiLogger.debug(`Generating ${slideCount} complete slides for prompt: "${prompt}"`);
      
      // Clear used images tracking and cache for new generation
      this.usedImages.clear();
      this.cache.clear();
      this.categoryCache.clear(); // Also clear category cache to get fresh images
      apiLogger.info('🧹 Cleared all caches for fresh image selection');
      
      // Detect the MOST DOMINANT category and specific keywords from user prompt using AI
      apiLogger.debug(`Starting AI-powered category and keyword detection for prompt: "${prompt}" (${intelligenceMode} mode)`);
      const keywordAnalysis = await this.detectSpecificKeywordsFromPrompt(prompt, businessContext, intelligenceMode);
      const dominantCategory = keywordAnalysis.category;
      const allowedCategories = [dominantCategory]; // Use ONLY the dominant category - NO MIXING
      const specificKeywords = keywordAnalysis.specificKeywords;
      apiLogger.debug(`AI detection complete. DOMINANT Category: ${dominantCategory}, Specific keywords: ${specificKeywords.join(', ')}`);
      apiLogger.info(`🎯 Using SINGLE dominant category: ${dominantCategory} for entire generation`);
      
      // Build context-aware prompt
      const context = { businessContext, userInfo };
      let systemPrompt = buildContextAwarePrompt(context, prompt);
      
      // Add specific handling for quotes (romantic, stoic, motivational, etc.)
      if (prompt.toLowerCase().includes('romantic') || prompt.toLowerCase().includes('quote') || prompt.toLowerCase().includes('stoic') || prompt.toLowerCase().includes('philosophy')) {
        systemPrompt += `\n\nSPECIAL INSTRUCTIONS FOR QUOTES:\n- When creating quote slides, use the ACTUAL QUOTE TEXT in the "content" field\n- Do NOT include JSON metadata, position data, or structural information in the quote text\n- The quote should be clean, readable text that users can understand\n- Include the author attribution as a separate text element if needed\n- Focus on the emotional impact and readability of the quote\n- For stoic quotes, use famous stoic philosophers like Seneca, Epictetus, Marcus Aurelius, etc.\n- Each quote slide should contain the full quote, not just the author name\n\nEXAMPLE FOR STOIC QUOTES:\n✅ GOOD: "The happiness of your life depends upon the quality of your thoughts."\n✅ GOOD: "Waste no more time arguing about what a good man should be. Be one."\n✅ GOOD: "It is not death that a man should fear, but he should fear never beginning to live."\n❌ BAD: "— Seneca"\n❌ BAD: "— Epictetus"\n❌ BAD: "— Marcus Aurelius"\n\nEXAMPLE FORMAT FOR QUOTE SLIDES:\n[{\n  "texts": [{\n    "id": "text-1-1",\n    "content": "4 powerful stoic quotes",\n    "position": {"x": 50, "y": 40}\n  }],\n  "imageCategory": "creativity",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-2-1",\n    "content": "The happiness of your life depends upon the quality of your thoughts.",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-2-2",\n    "content": "— Marcus Aurelius",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "creativity",\n  "ratio": "9:16"\n}]\n`;
      }
      
      // Add existing slides context if available
      if (existingSlides && existingSlides.length > 0) {
        const existingSlidesContext = existingSlides.map((slide, index) => {
          const slideTexts = slide.texts?.map(text => text.content).join(' | ') || 'No text';
          return `Slide ${index + 1}: ${slideTexts}`;
        }).join('\n');
        
        // Add existing slides context (the detection logic is now handled in the main system prompt)
        systemPrompt += `\n\nEXISTING SLIDES CONTEXT:\n${existingSlidesContext}\n\nIMPORTANT: The user already has slides with the content above. Please create new slides that are related to and build upon this existing content. Maintain the same theme, style, and flow.`;
      }
      
      // Add memory context if available
      if (userInfo?.email) {
        const userMemory = await retrieveUserMemory(userInfo.email);
        if (userMemory.length > 0) {
          const memoryContext = buildMemoryContext(userMemory, prompt);
          systemPrompt += memoryContext;
        }
      }
      
      // Enhanced system prompt for unified generation
      const isMoreSlidesRequest = existingSlides && existingSlides.length > 0 && (
        prompt.toLowerCase().includes('more') || 
        prompt.toLowerCase().includes('additional') || 
        prompt.toLowerCase().includes('continue') || 
        prompt.toLowerCase().includes('add') ||
        prompt.toLowerCase().includes('extra')
      );
      
      if (isMoreSlidesRequest) {
        // For "more slides" requests, generate ONLY content slides (no intro slide)
        systemPrompt += `\n\nYou are a professional content creator specializing in engaging social media slides.\n\nCRITICAL: This is a request to ADD MORE slides to existing content. Create EXACTLY ${slideCount} CONTENT slides (NO intro slide):\n- Each slide contains one valuable, informative fact\n- These slides will be ADDED to existing slides, so NO intro slide needed\n- Use the same style and theme as the existing slides\n\nCRITICAL CATEGORY RULE: Use ONLY ONE imageCategory for ALL slides. Do NOT mix different categories. Pick the most appropriate single category and use it for every slide.\n\nCRITICAL CONTENT REQUIREMENTS:\n1. Each slide MUST contain 70-175 characters of valuable, educational content\n2. Include specific facts, statistics, actionable tips, or insightful observations\n3. Make each slide self-contained with enough information to be valuable\n4. Use clear, engaging language that educates and informs\n5. Focus on providing real value, not generic statements\n6. Each slide should teach something specific or provide actionable insights\n\nCONTENT EXAMPLES:\n✅ GOOD: "The average person spends 2.5 hours daily on social media, equivalent to 38 days per year"\n✅ GOOD: "Compound interest can turn $10,000 into $100,000 in 25 years at 9% return"\n✅ GOOD: "Reading 20 pages daily equals 30 books per year, putting you in the top 1% of readers"\n❌ BAD: "Social media is important for business"\n❌ BAD: "Investing is good for your future"\n❌ BAD: "Reading books helps you grow"\n\nEXAMPLE FORMAT FOR ADDITIONAL SLIDES:\nuser prompt: "add 2 more slides"\n\n[{\n  "texts": [{\n    "id": "text-1-1",\n    "content": "New valuable fact or insight here",\n    "position": {"x": 50, "y": 35}\n  }],\n  "imageCategory": "business",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-2-1",\n    "content": "Another valuable fact or insight here",\n    "position": {"x": 50, "y": 35}\n  }],\n  "imageCategory": "business",\n  "ratio": "9:16"\n}]\n\nCRITICAL: Return ONLY valid JSON array. Do not include any explanatory text, markdown formatting, or other content outside the JSON array. The response must be parseable by JSON.parse().`;
      } else {
        // For new slide sets, include intro slide
        const contentSlides = slideCount - 1; // Number of actual content slides (excluding intro)
        systemPrompt += `\n\nYou are a professional content creator specializing in engaging social media slides.\n\nCreate EXACTLY ${slideCount} slides in total:\n- The first slide is ALWAYS an introduction/title slide.\n- The remaining ${contentSlides} slides each contain one valuable, informative fact.\n\nCRITICAL SLIDE COUNTING RULE:\nWhen user asks for "N slides about X", create:\n- Slide 1: Introduction saying "${contentSlides} [topic] about X" (NOT "N slides about X")\n- Slides 2-${slideCount}: ${contentSlides} actual content slides\n\nCRITICAL CATEGORY RULE: Use ONLY ONE imageCategory for ALL slides. Do NOT mix different categories. Pick the most appropriate single category and use it for every slide.\n\nEXAMPLES:\n- User asks "5 slides about fitness" → Intro says "4 incredible facts about fitness" + 4 content slides\n- User asks "3 slides about money" → Intro says "2 powerful insights about money" + 2 content slides\n- User asks "6 slides about success" → Intro says "5 proven strategies for success" + 5 content slides\n\nCRITICAL CONTENT REQUIREMENTS:\n1. Each valuable slide (slides 2 to ${slideCount}) MUST contain 70-175 characters of valuable, educational content\n2. Include specific facts, statistics, actionable tips, or insightful observations\n3. Make each valuable slide self-contained with enough information to be valuable\n4. Use clear, engaging language that educates and informs\n5. Focus on providing real value, not generic statements\n6. Each valuable slide should teach something specific or provide actionable insights\n\nCONTENT EXAMPLES:\n✅ GOOD: "The average person spends 2.5 hours daily on social media, equivalent to 38 days per year"\n✅ GOOD: "Compound interest can turn $10,000 into $100,000 in 25 years at 9% return"\n✅ GOOD: "Reading 20 pages daily equals 30 books per year, putting you in the top 1% of readers"\n❌ BAD: "Social media is important for business"\n❌ BAD: "Investing is good for your future"\n❌ BAD: "Reading books helps you grow"\n\nEXAMPLE FORMAT ONE:\nuser prompt: "5 slides about Haile Gebrselassie"\n\n[{\n  "texts": [{\n    "id": "text-1-1",\n    "content": "4 incredible facts about Haile Gebrselassie",\n    "position": {"x": 50, "y": 40}\n  }],\n  "imageCategory": "sports",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-2-1",\n    "content": "Fact 1 ...",\n    "position": {"x": 50, "y": 35}\n  }],\n  "imageCategory": "sports",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-3-1",\n    "content": "Fact 2 ...",\n    "position": {"x": 50, "y": 35}\n  }],\n  "imageCategory": "sports",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-4-1",\n    "content": "Fact 3 ...",\n    "position": {"x": 50, "y": 35}\n  }],\n  "imageCategory": "sports",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-5-1",\n    "content": "Fact 4 ...",\n    "position": {"x": 50, "y": 35}\n  }],\n  "imageCategory": "sports",\n  "ratio": "9:16"\n}]\n\nEXAMPLE FORMAT TWO:\nuser prompt: "6 slides about things people learn too late in life"\n\n[{\n  "texts": [{\n    "id": "text-1-1",\n    "content": "5 things people learn too late in life",\n    "position": {"x": 50, "y": 40}\n  }],\n  "imageCategory": "lifestyle",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-2-1",\n    "content": "1. your body is not invisible",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-2-2",\n    "content": "the choices you make in your 20s and 30s will affect the quality of life in your 50s and beyond",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "lifestyle",\n  "ratio": "9:16"\n}, {\n  "texts": [{   \n    "id": "text-3-1",\n    "content": "2. discipline beats motivation",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-3-2",\n    "content": "motivation is temporary but showing up even when you don't feel like it is what makes real progress",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "lifestyle",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-4-1",\n    "content": "3. comparison steals progress",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-4-2",\n    "content": "the only person you should be competing against is the person you were yesterday",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "lifestyle",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-5-1",\n    "content": "4. consistency over intensity",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-5-2",\n    "content": "making small progress consistently is better than the occasional all out effort",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "lifestyle",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-6-1",\n    "content": "5. time is the only true currency",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-6-2",\n    "content": "money can be made, but time once gone, is gone",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "lifestyle",\n  "ratio": "9:16"\n}]\n\nEXAMPLE FORMAT THREE:\nuser prompt: "3 slides about personality types that match with intjs" \n\n[{\n  "texts": [{\n    "id": "text-1-1",\n    "content": "2 personality types that perfectly match with intjs",\n    "position": {"x": 50, "y": 40}\n  }],\n  "imageCategory": "abstract",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-2-1",\n    "content": "1. enfp, the perfect contrast",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-2-2",\n    "content": "enfps bring emotional warmth, adaptability, and endless curiosity. They pull intjs out of their heads and into the moment, making strategy feel alive and human.",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "abstract",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-3-1",\n    "content": "2. infj, the intuitive equal",\n    "position": {"x": 50, "y": 35}\n  }, {\n    "id": "text-3-2",\n    "content": "Both are future-focused and value deep meaning. While intjs bring vision and systems, infjs add emotional intelligence and insight that makes the plan more human-centered.",\n    "position": {"x": 50, "y": 50}\n  }],\n  "imageCategory": "abstract",\n  "ratio": "9:16"\n}]\n\nNotice: The first slide is always an introduction and the remaining slides contain the valuable content. The intro slide text states the correct number of content slides (N-1), not the total number of slides (N). Content slides can have multiple text elements with different positioning for better visual hierarchy.

CRITICAL: Return ONLY valid JSON array. Do not include any explanatory text, markdown formatting, or other content outside the JSON array. The response must be parseable by JSON.parse().`;
      }

      // Generate content using OpenAI with model selection based on intelligence mode
      const openaiClient = getOpenAI();
      const modelConfig = getModelConfig(intelligenceMode, prompt, { businessContext, userInfo }, 'content');
      apiLogger.debug(`Using model config for ${intelligenceMode} mode:`, {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      });
      
      const completion = await openaiClient.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: modelConfig.max_tokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.top_p,
        frequency_penalty: modelConfig.frequency_penalty,
        presence_penalty: modelConfig.presence_penalty,
      });

      let slides = [];
      try {
        slides = JSON.parse(completion.choices[0].message.content);
        if (!Array.isArray(slides)) throw new Error('Not an array');
        
        // Clean any JSON metadata that might have been mixed into content
        slides = this.cleanSlideContent(slides);
        
      } catch (e) {
        apiLogger.error('Failed to parse AI response:', e);
        // Fallback parsing logic
        slides = this.parseFallbackResponse(completion.choices[0].message.content, slideCount, allowedCategories);
      }

      // Validate and enhance slides with proper unique IDs
      slides = slides.map((slide, idx) => {
        const slideId = slide.id || `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${idx}`;
        return {
          id: slideId,
          texts: (slide.texts || []).map((text, textIdx) => ({
            ...text,
            id: text.id || `text-${slideId}-${textIdx}`
          })),
          imageCategory: slide.imageCategory || 'business',
          ratio: slide.ratio || '9:16'
        };
      });

      // ENFORCE SINGLE CATEGORY RULE - Override any AI-generated categories with dominant category
      slides = slides.map((slide, idx) => {
        if (slide.imageCategory !== dominantCategory) {
          apiLogger.warn(`🔄 Overriding AI-generated category "${slide.imageCategory}" with dominant category "${dominantCategory}" for slide ${idx}`);
          slide.imageCategory = dominantCategory;
        }
        return slide;
      });
      apiLogger.info(`🎯 Enforced single category "${dominantCategory}" across all ${slides.length} slides`);

      // Ensure we have the exact number of slides requested
      apiLogger.debug(`AI generated ${slides.length} slides, requested ${slideCount}`);
      if (slides.length !== slideCount) {
        apiLogger.warn(`Generated ${slides.length} slides, expected ${slideCount}. Adjusting...`);
        if (slides.length < slideCount) {
          // Instead of generating placeholder slides, just use what we have
          // This prevents the creation of generic "Additional content" slides
          apiLogger.debug(`Using ${slides.length} slides instead of requested ${slideCount} to avoid placeholder content`);
        } else {
          // Trim to requested number
          slides = slides.slice(0, slideCount);
          apiLogger.debug(`Trimmed to ${slideCount} slides`);
        }
      }

      // Apply smart text positioning and add images - process in parallel for speed
      const completeSlides = await Promise.all(
        slides.map((slide, i) => 
          this.enhanceSlideWithImage(slide, i, prompt, allowedCategories, specificKeywords, businessContext, intelligenceMode)
        )
      );

      // Store memory insights
      if (userInfo?.email && prompt) {
        const insights = extractMemoryInsights(prompt, { businessContext, userInfo });
        if (insights.length > 0) {
          await storeMemoryInsights(userInfo.email, insights);
          apiLogger.debug(`Extracted ${insights.length} memory insights`);
        }
      }

      // Skip credit consumption for vaporware - allow all functionality
      // TODO: Re-enable credit consumption when moving to production
      apiLogger.info('Skipping credit consumption for vaporware development');

      apiLogger.debug(`Successfully generated ${completeSlides.length} complete slides using SINGLE dominant category: ${dominantCategory}`);
      return completeSlides;

    } catch (error) {
      // Skip credit consumption for vaporware - allow all functionality
      // TODO: Re-enable credit consumption when moving to production
      apiLogger.info('Skipping credit consumption for failed generation (vaporware mode)');
      
      apiLogger.error('Error in unified content generation:', error);
      throw error;
    }
  }

  /**
   * Enhance a slide with the appropriate image
   * @param {Object} slide - Slide object
   * @param {number} slideIndex - Slide index
   * @param {string} prompt - Original prompt
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @param {Array} specificKeywords - Specific keywords for precise image selection
   * @param {Object} businessContext - Business context for intelligent fallback
   * @returns {Promise<Object>} Enhanced slide with image
   */
  async enhanceSlideWithImage(slide, slideIndex, prompt, allowedCategories = ['business'], specificKeywords = [], businessContext = {}, intelligenceMode = 'normal') {
    try {
      // STRICT category enforcement - use ONLY the dominant category
      const dominantCategory = allowedCategories[0]; // Always use the first (dominant) category
      let imageCategory = slide.imageCategory || dominantCategory;
      
      // Force override to dominant category - NO MIXING ALLOWED
      if (imageCategory !== dominantCategory) {
        apiLogger.warn(`🔄 Forcing category change from "${imageCategory}" to dominant category "${dominantCategory}" for slide ${slideIndex}`);
        imageCategory = dominantCategory;
      }
      
      apiLogger.debug(`🎯 Slide ${slideIndex} using dominant category: ${dominantCategory}`);
      
      // Select appropriate image based on content, category, and specific keywords
      const selectedImage = await this.selectImageForSlide(
        imageCategory,
        slideIndex,
        prompt,
        allowedCategories,
        specificKeywords,
        businessContext,
        intelligenceMode
      );

      return {
        ...slide,
        image: selectedImage,
        imageCategory: imageCategory,
        texts: slide.texts.map(text => ({
          ...text,
          style: {
            fontSize: '16px',
            color: 'white',
            fontWeight: 'normal',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }
        }))
      };
    } catch (error) {
      apiLogger.error(`Error enhancing slide ${slideIndex}:`, error);
      return slide; // Return slide without image if selection fails
    }
  }

  /**
   * Dynamic image selection that bypasses rigid category system
   * Uses AI to find the best images for any topic by analyzing the entire image database
   * @param {string} prompt - User prompt
   * @param {Array} specificKeywords - Specific keywords to match
   * @param {number} slideIndex - Slide index
   * @param {Object} businessContext - Business context
   * @param {string} intelligenceMode - Intelligence mode
   * @returns {Promise<Object|null>} Best matching image
   */
  async selectImageDynamically(prompt, specificKeywords, slideIndex, businessContext = {}, intelligenceMode = 'normal', dominantCategory = null) {
    try {
      apiLogger.info(`🚀 Using DYNAMIC image selection for slide ${slideIndex} - prompt: "${prompt}" - DOMINANT CATEGORY: ${dominantCategory}`);
      
      // CONTENT-AWARE KEYWORD GENERATION: Generate slide-specific keywords for better relevance
      const slideSpecificKeywords = await this.generateSlideSpecificKeywords(prompt, specificKeywords, slideIndex, intelligenceMode);
      const allKeywords = [...new Set([...specificKeywords, ...slideSpecificKeywords])];
      
      apiLogger.info(`🔍 Content-aware keywords for slide ${slideIndex}: ${allKeywords.join(', ')}`);
      
      // STEP 1: STRICT CATEGORY ENFORCEMENT - Only search within the dominant category
      if (!dominantCategory) {
        apiLogger.error(`❌ No dominant category provided for slide ${slideIndex}`);
        return null;
      }
      
      apiLogger.info(`🎯 STRICT CATEGORY ENFORCEMENT: Only searching within category "${dominantCategory}" for slide ${slideIndex}`);
      
      // Step 2: Search ONLY within the dominant category with these keywords
      let images = await this.queryImagesByCategoryAndKeywords(dominantCategory, allKeywords);
      
      if (!images || images.length === 0) {
        apiLogger.warn(`❌ No images found in category "${dominantCategory}" with content-aware keywords: ${allKeywords.join(', ')}`);
        // Fallback to broader search within the SAME category
        const fallbackKeywords = this.getFallbackKeywords(prompt, slideIndex);
        images = await this.queryImagesByCategoryAndKeywords(dominantCategory, fallbackKeywords);
        
        if (!images || images.length === 0) {
          apiLogger.error(`❌ No images found in category "${dominantCategory}" even with fallback keywords`);
          return null;
        }
      }
      
      // Continue with existing logic...
      const availableImages = images.filter(img => !this.usedImages.has(img.id));
      apiLogger.info(`🔍 Dynamic search found ${images.length} total images, ${availableImages.length} available (not used)`);
      
      // NEW: INTELLIGENT CATEGORY EXPANSION
      // If we don't have enough available images, expand search to other relevant categories
      if (availableImages.length === 0) {
        apiLogger.warn(`⚠️ No available images in dominant category "${dominantCategory}", expanding search to other categories`);
        
        // Get relevant categories based on keywords
        const relevantCategories = this.getRelevantCategoriesForKeywords(allKeywords, dominantCategory);
        apiLogger.info(`🔍 Expanding search to relevant categories: ${relevantCategories.join(', ')}`);
        
        let expandedImages = [];
        for (const category of relevantCategories) {
          if (category === dominantCategory) continue; // Skip the dominant category since we already searched it
          
          apiLogger.info(`🔍 Searching category "${category}" for slide ${slideIndex}`);
          const categoryImages = await this.queryImagesByCategoryAndKeywords(category, allKeywords);
          
          if (categoryImages && categoryImages.length > 0) {
            const categoryAvailableImages = categoryImages.filter(img => !this.usedImages.has(img.id));
            if (categoryAvailableImages.length > 0) {
              apiLogger.info(`✅ Found ${categoryAvailableImages.length} available images in category "${category}"`);
              expandedImages.push(...categoryAvailableImages);
            }
          }
        }
        
        // If we found images in other categories, use them
        if (expandedImages.length > 0) {
          apiLogger.info(`🎯 Using ${expandedImages.length} images from expanded category search for slide ${slideIndex}`);
          images = expandedImages;
        } else {
          // If still no images, try broader keyword search across all categories
          apiLogger.warn(`⚠️ No images found in relevant categories, trying broader keyword search`);
          const broaderImages = await this.queryImagesByKeywords(allKeywords);
          if (broaderImages && broaderImages.length > 0) {
            const broaderAvailableImages = broaderImages.filter(img => !this.usedImages.has(img.id));
            if (broaderAvailableImages.length > 0) {
              apiLogger.info(`✅ Found ${broaderAvailableImages.length} images with broader keyword search`);
              images = broaderAvailableImages;
            }
          }
        }
      } else {
        images = availableImages;
      }
      
      // If we still don't have enough images, try to find more before resetting
      if (images.length === 0) {
        apiLogger.warn(`⚠️ No available images, attempting to find more before reset`);
        
        // Get more images from the database within the SAME category
        const moreImages = await this.findMoreImagesByCategory(dominantCategory, allKeywords);
        if (moreImages && moreImages.length > 0) {
          const newAvailableImages = moreImages.filter(img => !this.usedImages.has(img.id));
          if (newAvailableImages.length > 0) {
            apiLogger.info(`🔍 Found ${newAvailableImages.length} additional unused images`);
            images = newAvailableImages;
          } else {
            // If we still don't have enough, then reset
            const usedPercentage = this.usedImages.size / Math.max(images.length + moreImages.length, 1);
            if (usedPercentage > 0.8) {
              apiLogger.warn(`⚠️ Used ${Math.round(usedPercentage * 100)}% of all available images. Resetting selection.`);
              this.usedImages.clear();
              const freshImages = [...images, ...moreImages].filter(img => !this.usedImages.has(img.id));
              if (freshImages.length === 0) {
                apiLogger.error(`❌ No fresh images available after reset`);
                return null;
              }
              images = freshImages;
              apiLogger.info(`🔄 Reset complete. Now have ${images.length} fresh images available.`);
            } else {
              // More intelligent reset logic for small image sets
              const totalImages = images.length + moreImages.length;
              const shouldReset = this.shouldResetImageSelection(totalImages, usedPercentage);
              
              if (shouldReset) {
                apiLogger.warn(`🔄 Resetting image selection due to limited variety (${totalImages} total images, ${Math.round(usedPercentage * 100)}% used)`);
                this.usedImages.clear();
                const freshImages = [...images, ...moreImages].filter(img => !this.usedImages.has(img.id));
                if (freshImages.length === 0) {
                  apiLogger.error(`❌ No fresh images available after reset`);
                  return null;
                }
                images = freshImages;
                apiLogger.info(`🔄 Reset complete. Now have ${images.length} fresh images available.`);
              } else {
                apiLogger.warn(`⚠️ No available images but only ${Math.round(usedPercentage * 100)}% used. Using random selection.`);
                const allImages = [...images, ...moreImages];
                const randomImage = allImages[Math.floor(Math.random() * allImages.length)];
                apiLogger.warn(`🔄 Reusing image: "${randomImage.title}" (ID: ${randomImage.id}) for slide ${slideIndex}`);
                return randomImage;
              }
            }
          }
        } else {
          // If we can't find more images, reset if we've used most of what we have
          const usedPercentage = this.usedImages.size / Math.max(images.length, 1);
          if (usedPercentage > 0.8) {
            apiLogger.warn(`⚠️ Used ${Math.round(usedPercentage * 100)}% of images. Resetting selection.`);
            this.usedImages.clear();
            const freshImages = images.filter(img => !this.usedImages.has(img.id));
            if (freshImages.length === 0) {
              apiLogger.error(`❌ No fresh images available after reset`);
              return null;
            }
            images = freshImages;
            apiLogger.info(`🔄 Reset complete. Now have ${images.length} fresh images available.`);
          } else {
            // More intelligent reset logic for small image sets
            const shouldReset = this.shouldResetImageSelection(images.length, usedPercentage);
            
            if (shouldReset) {
              apiLogger.warn(`🔄 Resetting image selection due to limited variety (${images.length} total images, ${Math.round(usedPercentage * 100)}% used)`);
              this.usedImages.clear();
              const freshImages = images.filter(img => !this.usedImages.has(img.id));
              if (freshImages.length === 0) {
                apiLogger.error(`❌ No fresh images available after reset`);
                return null;
              }
              images = freshImages;
              apiLogger.info(`🔄 Reset complete. Now have ${images.length} fresh images available.`);
            } else {
              apiLogger.warn(`⚠️ No available images but only ${Math.round(usedPercentage * 100)}% used. Using random selection.`);
              const randomImage = images[Math.floor(Math.random() * images.length)];
              apiLogger.warn(`🔄 Reusing image: "${randomImage.title}" (ID: ${randomImage.id}) for slide ${slideIndex}`);
              return randomImage;
            }
          }
        }
      }
      
      // Step 3: Select the best image using visual analysis
      const selectedImage = await this.selectBestMatchingImageWithVisualAnalysis(images, allKeywords, slideIndex, prompt, intelligenceMode);
      
      if (selectedImage) {
        this.usedImages.add(selectedImage.id);
        apiLogger.info(`✅ Dynamic selection found image: "${selectedImage.title}" for slide ${slideIndex}`);
        return selectedImage;
      }

      return null;

    } catch (error) {
      apiLogger.error(`Error in dynamic image selection for slide ${slideIndex}:`, error);
      return null;
    }
  }

  /**
   * Select image for a specific slide with enhanced visual analysis and intelligent fallback
   * @param {string} imageCategory - Image category
   * @param {number} slideIndex - Slide index
   * @param {string} prompt - Original prompt
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @param {Array} specificKeywords - Specific keywords to match for precise selection
   * @param {Object} businessContext - Business context for intelligent fallback
   * @returns {Promise<Object|null>} Selected image
   */
  async selectImageForSlide(imageCategory, slideIndex, prompt, allowedCategories = ['business'], specificKeywords = [], businessContext = {}, intelligenceMode = 'normal') {
    try {
      // Use dynamic image selection instead of rigid category system
      apiLogger.info(`🎯 Using dynamic image selection for slide ${slideIndex}`);
      
      const dynamicSelectedImage = await this.selectImageDynamically(
        prompt, 
        specificKeywords, 
        slideIndex, 
        businessContext, 
        intelligenceMode,
        imageCategory // Pass the dominant category
      );
      
      if (dynamicSelectedImage) {
        apiLogger.info(`✅ Dynamic selection found image: "${dynamicSelectedImage.title}" for slide ${slideIndex}`);
        return dynamicSelectedImage;
      }
      
      // Fallback to category-based selection if dynamic selection fails
      apiLogger.warn(`❌ Dynamic selection failed, falling back to category-based selection for slide ${slideIndex}`);
      
      // STRICT category enforcement - use ONLY the dominant category
      const dominantCategory = allowedCategories[0]; // Always use the first (dominant) category
      if (imageCategory !== dominantCategory) {
        apiLogger.warn(`🔄 Forcing category change from "${imageCategory}" to dominant category "${dominantCategory}" for slide ${slideIndex}`);
        imageCategory = dominantCategory;
      }
      
      apiLogger.info(`🎯 Using dominant category "${dominantCategory}" for slide ${slideIndex}`);
      
      // Get images for the category
      const categoryKeywords = getCategoryKeywords(imageCategory) || getCategoryKeywords('business');
      
      // Combine category keywords with specific keywords for more precise selection
      const allKeywords = [...new Set([...categoryKeywords, ...specificKeywords])];
      let images = await this.queryImagesByKeywords(allKeywords);
      
      // If no images found and we have specific keywords, try intelligent fallback within dominant category
      if ((!images || images.length === 0) && specificKeywords.length > 0) {
        apiLogger.info(`🎯 No images found for specific keywords: ${specificKeywords.join(', ')}. Using intelligent fallback within dominant category...`);
        
        // Use intelligent fallback but respect the dominant category
        const fallbackCategory = await this.getIntelligentFallbackCategory(prompt, specificKeywords, businessContext, intelligenceMode);
        apiLogger.info(`🧠 Intelligent fallback selected category: ${fallbackCategory} for prompt: "${prompt}"`);
        
        // BUT enforce dominant category - no mixing allowed
        if (fallbackCategory !== dominantCategory) {
          apiLogger.warn(`🔄 Intelligent fallback wanted "${fallbackCategory}" but enforcing dominant category "${dominantCategory}"`);
        }
        
        // Get images from the dominant category (not fallback)
        const dominantKeywords = getCategoryKeywords(dominantCategory) || getCategoryKeywords('business');
        images = await this.queryImagesByKeywords(dominantKeywords);
        
        if (images && images.length > 0) {
          apiLogger.info(`✅ Found ${images.length} images using dominant category: ${dominantCategory}`);
        } else {
          apiLogger.warn(`❌ No images found even with dominant category: ${dominantCategory}`);
          return null;
        }
      } else if (!images || images.length === 0) {
        apiLogger.warn(`No images found for dominant category: ${dominantCategory}`);
        return null;
      }

      // Filter out already used images FIRST - this is critical to prevent duplicates
      const availableImages = images.filter(img => !this.usedImages.has(img.id));
      
      if (availableImages.length === 0) {
        // Only reset if we've used more than 80% of available images to prevent premature resets
        const usedPercentage = this.usedImages.size / images.length;
        if (usedPercentage > 0.8) {
          apiLogger.warn(`Used ${usedPercentage * 100}% of images in category "${imageCategory}". Resetting selection.`);
          this.usedImages.clear();
          
          // Get fresh available images after reset
          const freshAvailableImages = images.filter(img => !this.usedImages.has(img.id));
          if (freshAvailableImages.length > 0) {
            const categorySelectedImage = await this.selectBestMatchingImageWithVisualAnalysis(freshAvailableImages, specificKeywords, slideIndex, prompt);
            this.usedImages.add(categorySelectedImage.id);
            apiLogger.debug(`Selected image ${categorySelectedImage.id} for slide ${slideIndex} in category ${imageCategory} (after reset)`);
            return categorySelectedImage;
          }
        }
        
        // If we can't reset or still no available images, pick a random image from all images
        // But still avoid duplicates by checking if it's already used
        const unusedImages = images.filter(img => !this.usedImages.has(img.id));
        if (unusedImages.length > 0) {
          const categorySelectedImage = await this.selectBestMatchingImageWithVisualAnalysis(unusedImages, specificKeywords, slideIndex, prompt);
          this.usedImages.add(categorySelectedImage.id);
          apiLogger.debug(`Selected image ${categorySelectedImage.id} for slide ${slideIndex} in category ${imageCategory} (fallback)`);
          return categorySelectedImage;
        } else {
          // If all images are used, we have no choice but to reuse one
          const randomImage = images[Math.floor(Math.random() * images.length)];
          apiLogger.warn(`All images in category "${imageCategory}" have been used. Reusing image ${randomImage.id} for slide ${slideIndex}`);
          return randomImage;
        }
      }

      // Select the best matching image from available options using visual analysis
      const selectedImage = await this.selectBestMatchingImageWithVisualAnalysis(availableImages, specificKeywords, slideIndex, prompt, intelligenceMode);
      this.usedImages.add(selectedImage.id);
      
      return selectedImage;

    } catch (error) {
      apiLogger.error('Error selecting image for slide:', error);
      return null;
    }
  }

  /**
   * Select the best matching image based on specific keywords
   * @param {Array} availableImages - Array of available images
   * @param {Array} specificKeywords - Specific keywords to match
   * @param {number} slideIndex - Slide index for logging
   * @returns {Object} Best matching image
   */
  selectBestMatchingImage(availableImages, specificKeywords, slideIndex) {
    if (!specificKeywords || specificKeywords.length === 0) {
      // If no specific keywords, return random image
      return availableImages[Math.floor(Math.random() * availableImages.length)];
    }

    // Score each image based on keyword matches
    const scoredImages = availableImages.map(image => {
      let score = 0;
      const imageTitle = (image.title || '').toLowerCase();
      
      // Check for exact keyword matches
      specificKeywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        if (imageTitle.includes(lowerKeyword)) {
          score += 2; // Higher score for exact matches
        }
      });
      
      // Check for partial matches (word boundaries)
      specificKeywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        const words = imageTitle.split(/\s+/);
        words.forEach(word => {
          if (word.includes(lowerKeyword) || lowerKeyword.includes(word)) {
            score += 1; // Lower score for partial matches
          }
        });
      });
      
      return { image, score };
    });

    // Sort by score (highest first) and select the best match
    scoredImages.sort((a, b) => b.score - a.score);
    
    // If we have a clear winner (score > 0), use it
    if (scoredImages[0].score > 0) {
      const bestMatch = scoredImages[0];
      apiLogger.debug(`Selected best matching image for slide ${slideIndex}: "${bestMatch.image.title}" (score: ${bestMatch.score})`);
      return bestMatch.image;
    }
    
    // If no good matches, return random image
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    apiLogger.debug(`No keyword matches found for slide ${slideIndex}, using random image: "${randomImage.title}"`);
    return randomImage;
  }

  /**
   * Select the best matching image using visual analysis and keyword matching
   * @param {Array} availableImages - Array of available images
   * @param {Array} specificKeywords - Specific keywords to match
   * @param {number} slideIndex - Slide index for logging
   * @param {string} prompt - Original user prompt for visual analysis
   * @returns {Promise<Object>} Best matching image
   */
  async selectBestMatchingImageWithVisualAnalysis(availableImages, specificKeywords, slideIndex, prompt, intelligenceMode = 'normal') {
    try {
      // SPEED OPTIMIZATION: Reduce images analyzed based on intelligence mode
      const maxImagesToAnalyze = intelligenceMode === 'max' ? 8 : 4; // Reduced from 15/8 to 8/4
      
      // Randomly sample images to avoid always analyzing the same ones
      const imagesToAnalyze = this.getRandomSample(availableImages, maxImagesToAnalyze);
      
      apiLogger.info(`🔍 Analyzing ${imagesToAnalyze.length} images with visual AI for slide ${slideIndex} (${intelligenceMode} mode) - SPEED OPTIMIZED`);
      
      // SPEED OPTIMIZATION: Use keyword-based selection first for speed
      // For normal mode, try keyword-based selection first, then fall back to visual analysis
      if (intelligenceMode === 'normal') {
        // First, try keyword-based selection for quick results
        const keywordBasedImage = this.selectBestMatchingImage(availableImages, specificKeywords, slideIndex);
        
        // If we have a good keyword match (score > 0), use it
        const keywordScore = this.calculateKeywordScore(keywordBasedImage, specificKeywords);
        if (keywordScore > 0) {
          apiLogger.debug(`✅ Using keyword-based selection for slide ${slideIndex}: "${keywordBasedImage.title}" (score: ${keywordScore}) - SPEED OPTIMIZED`);
          return keywordBasedImage;
        }
        
        // If no good keyword matches, use visual analysis
        apiLogger.info(`🎯 No good keyword matches, using visual analysis for slide ${slideIndex} (${intelligenceMode} mode)`);
      } else if (intelligenceMode === 'max') {
        // Max mode: Always use visual analysis for best quality
        apiLogger.info(`🎯 Using visual analysis for slide ${slideIndex} (${intelligenceMode} mode) - MAX QUALITY`);
      } else {
        // Normal mode: Always use visual analysis for better image selection
        apiLogger.info(`🎯 Using visual analysis for slide ${slideIndex} (${intelligenceMode} mode)`);
      }
      
      // SPEED OPTIMIZATION: Check if we're rate limited and use fast fallback
      const isRateLimited = this.checkRateLimitStatus();
      
      if (isRateLimited) {
        apiLogger.warn(`⚡ Rate limit detected - using FAST MODE (keyword-based selection only) for slide ${slideIndex}`);
        const keywordBasedImage = this.selectBestMatchingImage(availableImages, specificKeywords, slideIndex);
        return keywordBasedImage;
      }
      
      // Analyze images with visual AI
      const imageUrls = imagesToAnalyze.map(img => img.image_url);
      const visualAnalyses = await visualAnalysisService.analyzeImageBatch(imageUrls, prompt, intelligenceMode);
      
      if (visualAnalyses.length === 0) {
        apiLogger.warn(`❌ Visual analysis failed, falling back to keyword-based selection for slide ${slideIndex}`);
        return this.selectBestMatchingImage(availableImages, specificKeywords, slideIndex);
      }
      
      // Find the image with the highest relevance score
      const bestVisualMatch = visualAnalyses[0];
      const selectedImage = imagesToAnalyze.find(img => img.image_url === bestVisualMatch.imageUrl);
      
      if (selectedImage) {
        apiLogger.info(`🎨 Visual analysis selected image for slide ${slideIndex}: "${selectedImage.title}" (relevance: ${bestVisualMatch.relevanceScore}/100)`);
        apiLogger.debug(`📝 Visual analysis: ${bestVisualMatch.description}`);
        
        // Log if the image has low relevance
        if (bestVisualMatch.relevanceScore < 70) {
          apiLogger.warn(`⚠️ Low relevance image selected (${bestVisualMatch.relevanceScore}/100): "${selectedImage.title}" for prompt: "${prompt}"`);
        }
        
        return selectedImage;
      }
      
      // Fallback to random selection if visual analysis fails
      apiLogger.warn(`❌ Visual analysis failed to find matching image, using random selection for slide ${slideIndex}`);
      return availableImages[Math.floor(Math.random() * availableImages.length)];
      
    } catch (error) {
      apiLogger.error(`Error in visual analysis for slide ${slideIndex}:`, error);
      // Fallback to keyword-based selection
      return this.selectBestMatchingImage(availableImages, specificKeywords, slideIndex);
    }
  }

  /**
   * Get a random sample of images to avoid analyzing the same ones repeatedly
   * @param {Array} images - Array of available images
   * @param {number} sampleSize - Number of images to sample
   * @returns {Array} Random sample of images
   */
  getRandomSample(images, sampleSize) {
    if (images.length <= sampleSize) {
      return images; // Return all images if we have fewer than sample size
    }
    
    // Create a copy of the array and shuffle it
    const shuffled = [...images];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return the first sampleSize elements
    return shuffled.slice(0, sampleSize);
  }

  /**
   * Calculate keyword score for an image
   * @param {Object} image - Image object
   * @param {Array} keywords - Keywords to match
   * @returns {number} Keyword score
   */
  calculateKeywordScore(image, keywords) {
    if (!keywords || keywords.length === 0) return 0;
    
    let score = 0;
    const imageTitle = (image.title || '').toLowerCase();
    
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (imageTitle.includes(lowerKeyword)) {
        score += 2; // Higher score for exact matches
      }
      
      // Check for partial matches
      const words = imageTitle.split(/\s+/);
      words.forEach(word => {
        if (word.includes(lowerKeyword) || lowerKeyword.includes(word)) {
          score += 1; // Lower score for partial matches
        }
      });
    });
    
    return score;
  }

  /**
   * Query images by keywords with caching and intelligent expansion
   * @param {Array<string>} keywords - Search keywords
   * @returns {Promise<Array>} Matching images
   */
  async queryImagesByKeywords(keywords) {
    const cacheKey = keywords.join(',');
    
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey);
    }

    try {
      const supabase = getSupabase();
      
      // Step 1: Try exact keyword matches first
      let { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url, category, keywords, description')
        .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
        .limit(100);

      if (error) {
        apiLogger.error('Supabase error:', error);
        return [];
      }

      // Step 2: If we don't have enough images, expand the search intelligently
      if (!images || images.length < 10) {
        apiLogger.info(`🔍 Only found ${images?.length || 0} images, expanding search intelligently`);
        
        // Get all images for broader search
        const { data: allImages, error: allError } = await supabase
          .from('images')
          .select('id, title, image_url, category, keywords, description')
          .limit(1000);
        
        if (allError) {
          apiLogger.error('Error fetching all images for expansion:', allError);
          return images || [];
        }

        // Create expanded keywords based on context
        const expandedKeywords = this.getExpandedKeywords(keywords);
        
        // Filter images using expanded keywords
        const expandedImages = allImages.filter(img => {
          try {
            const title = img.title?.toLowerCase() || '';
            const category = img.category?.toLowerCase() || '';
            
            // Handle keywords as array or string
            let keywordsText = '';
            if (Array.isArray(img.keywords)) {
              keywordsText = img.keywords.join(' ').toLowerCase();
            } else if (typeof img.keywords === 'string') {
              keywordsText = img.keywords.toLowerCase();
            }
            
            const description = img.description?.toLowerCase() || '';
            
            // Check if any expanded keyword appears in any field
            return expandedKeywords.some(expandedKeyword => {
              const searchTerm = expandedKeyword.toLowerCase();
              return title.includes(searchTerm) || 
                     category.includes(searchTerm) || 
                     keywordsText.includes(searchTerm) || 
                     description.includes(searchTerm);
            });
          } catch (error) {
            apiLogger.error('Error filtering expanded image:', error, img);
            return false;
          }
        });

        // Combine and remove duplicates
        const combinedImages = [...(images || []), ...expandedImages];
        const uniqueImages = combinedImages.filter((img, index, self) => 
          index === self.findIndex(t => t.id === img.id)
        );
        
        apiLogger.info(`🔍 Expanded search found ${uniqueImages.length} total images`);
        this.categoryCache.set(cacheKey, uniqueImages);
        return uniqueImages;
      }

      this.categoryCache.set(cacheKey, images || []);
      return images || [];
    } catch (error) {
      apiLogger.error('Error querying images:', error);
      return [];
    }
  }

  /**
   * Query images by category AND keywords - STRICT CATEGORY ENFORCEMENT
   * @param {string} category - The dominant category to search within
   * @param {Array} keywords - Keywords to match within the category
   * @returns {Promise<Array>} Matching images
   */
  async queryImagesByCategoryAndKeywords(category, keywords) {
    const cacheKey = `category_${category}_${keywords.join(',')}`;
    
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey);
    }

    try {
      if (!category) {
        apiLogger.error('No category provided for category-based image search');
        return [];
      }
      
      if (!keywords || keywords.length === 0) {
        apiLogger.warn('No keywords provided for category-based image search');
        return [];
      }

      const supabase = getSupabase();
      const searchTerms = keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0);
      
      if (searchTerms.length === 0) {
        apiLogger.warn('No valid search terms after filtering');
        return [];
      }

      // SIMPLE: Just get all images in the category, then filter by keywords in JavaScript
      let { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url, category, keywords, description')
        .eq('category', category) // STRICT: Only images in this category
        .limit(200);

      if (error) {
        apiLogger.error(`Error querying images by category "${category}" and keywords:`, error);
        return [];
      }

      // SIMPLE: Filter images by keywords in JavaScript (handles array keywords properly)
      if (images && images.length > 0) {
        const filteredImages = images.filter(img => {
          try {
            const title = img.title?.toLowerCase() || '';
            const description = img.description?.toLowerCase() || '';
            
            // Handle keywords as array or string
            let keywordsText = '';
            if (Array.isArray(img.keywords)) {
              keywordsText = img.keywords.join(' ').toLowerCase();
            } else if (typeof img.keywords === 'string') {
              keywordsText = img.keywords.toLowerCase();
            }
            
            // Check if any search term appears in any field
            return searchTerms.some(term => {
              const searchTerm = term.toLowerCase();
              return title.includes(searchTerm) || 
                     keywordsText.includes(searchTerm) || 
                     description.includes(searchTerm);
            });
          } catch (error) {
            return false;
          }
        });
        
        apiLogger.info(`🎯 Found ${filteredImages.length} images in category "${category}" matching keywords: ${searchTerms.join(', ')}`);
        this.categoryCache.set(cacheKey, filteredImages);
        return filteredImages;
      }

      // If we don't have enough images, try broader keyword search within the same category
      if (!images || images.length < 5) {
        apiLogger.info(`🔍 Only found ${images?.length || 0} images in category "${category}", trying broader search within category`);
        
        const { data: categoryImages, error: categoryError } = await supabase
          .from('images')
          .select('id, title, image_url, category, keywords, description')
          .eq('category', category) // Still enforce category
          .limit(200);
        
        if (categoryError) {
          apiLogger.error('Error fetching category images for expansion:', categoryError);
          return images || [];
        }

        // Filter by expanded keywords within the category
        const expandedKeywords = this.getExpandedKeywords(searchTerms);
        const expandedImages = categoryImages.filter(img => {
          try {
            const title = img.title?.toLowerCase() || '';
            const keywordsText = Array.isArray(img.keywords) ? img.keywords.join(' ').toLowerCase() : (img.keywords?.toLowerCase() || '');
            const description = img.description?.toLowerCase() || '';
            
            return expandedKeywords.some(expandedKeyword => {
              const searchTerm = expandedKeyword.toLowerCase();
              return title.includes(searchTerm) || keywordsText.includes(searchTerm) || description.includes(searchTerm);
            });
          } catch (error) {
            return false;
          }
        });

        // Combine and remove duplicates
        const combinedImages = [...(images || []), ...expandedImages];
        const uniqueImages = combinedImages.filter((img, index, self) => 
          index === self.findIndex(t => t.id === img.id)
        );
        
        apiLogger.info(`🎯 Found ${uniqueImages.length} total images in category "${category}" for keywords: ${searchTerms.join(', ')}`);
        this.categoryCache.set(cacheKey, uniqueImages);
        return uniqueImages;
      }

      apiLogger.info(`🎯 Found ${images?.length || 0} images in category "${category}" for keywords: ${searchTerms.join(', ')}`);
      this.categoryCache.set(cacheKey, images || []);
      return images || [];
    } catch (error) {
      apiLogger.error('Error in queryImagesByCategoryAndKeywords:', error);
      return [];
    }
  }

  /**
   * Find more images by category - STRICT CATEGORY ENFORCEMENT
   * @param {string} category - The dominant category to search within
   * @param {Array} keywords - Keywords to match within the category
   * @returns {Promise<Array>} Additional matching images
   */
  async findMoreImagesByCategory(category, keywords) {
    try {
      if (!category) {
        apiLogger.error('No category provided for findMoreImagesByCategory');
        return [];
      }

      const supabase = getSupabase();
      const broadKeywords = this.getBroadKeywords(keywords);
      
      // SIMPLE: Just get all images in the category
      const { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url, category, keywords, description')
        .eq('category', category) // STRICT: Only images in this category
        .limit(100);

      if (error) {
        apiLogger.error(`Error finding more images in category "${category}":`, error);
        return [];
      }

      apiLogger.info(`🔍 Found ${images?.length || 0} additional images in category "${category}"`);
      return images || [];
    } catch (error) {
      apiLogger.error('Error in findMoreImagesByCategory:', error);
      return [];
    }
  }

  /**
   * Get expanded keywords for broader image search
   * @param {Array} originalKeywords - Original search keywords
   * @returns {Array} Expanded keywords for broader search
   */
  getExpandedKeywords(originalKeywords) {
    const expandedKeywords = [...originalKeywords];
    
    // Add category-based expansions
    originalKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Nature-related expansions
      if (['nature', 'environment', 'landscape', 'sustainable', 'green'].includes(lowerKeyword)) {
        expandedKeywords.push('forest', 'rainforest', 'jungle', 'wilderness', 'mountain', 'lake', 'river', 'ocean', 'beach', 'trees', 'plants', 'wildlife', 'outdoor', 'scenic', 'natural', 'environmental', 'ecology', 'conservation', 'biodiversity', 'ecosystem', 'flora', 'fauna', 'botanical', 'garden', 'park', 'reserve', 'sanctuary');
      }
      
      // Business-related expansions
      if (['business', 'office', 'meeting', 'corporate', 'professional', 'work', 'team', 'collaboration', 'success', 'growth', 'money', 'investment'].includes(lowerKeyword)) {
        expandedKeywords.push('entrepreneur', 'startup', 'finance', 'technology', 'innovation', 'strategy', 'leadership', 'management', 'productivity', 'efficiency', 'partnership', 'networking', 'conference', 'presentation', 'boardroom', 'workspace', 'modern', 'contemporary', 'professional', 'executive');
      }
      
      // Historical/philosophical expansions
      if (['marcus', 'aurelius', 'philosophy', 'stoicism', 'roman', 'emperor', 'ancient', 'classical', 'statue', 'marble', 'sculpture', 'bust', 'portrait', 'historical', 'antiquity', 'meditation', 'wisdom'].includes(lowerKeyword)) {
        expandedKeywords.push('greek', 'thinker', 'contemplation', 'stoic', 'philosopher', 'classical', 'thinker', 'man', 'person', 'figure', 'art', 'culture', 'history', 'antique', 'vintage', 'heritage', 'tradition', 'legacy', 'monument', 'architecture', 'civilization', 'empire', 'kingdom', 'dynasty');
      }
      
      // Technology-related expansions
      if (['technology', 'innovation', 'digital', 'modern', 'future', 'ai', 'artificial', 'intelligence', 'automation', 'robotics'].includes(lowerKeyword)) {
        expandedKeywords.push('computer', 'laptop', 'smartphone', 'device', 'gadget', 'app', 'software', 'hardware', 'network', 'data', 'analytics', 'cloud', 'virtual', 'augmented', 'reality', 'cyber', 'tech', 'startup', 'innovation', 'research', 'laboratory', 'scientist', 'engineer', 'developer');
      }
      
      // Lifestyle/health expansions
      if (['lifestyle', 'health', 'fitness', 'wellness', 'wellbeing', 'mindfulness', 'meditation', 'yoga', 'exercise', 'workout'].includes(lowerKeyword)) {
        expandedKeywords.push('healthy', 'active', 'vitality', 'energy', 'balance', 'harmony', 'peace', 'tranquility', 'serenity', 'calm', 'relaxation', 'stress', 'relief', 'therapy', 'healing', 'recovery', 'renewal', 'transformation', 'growth', 'development', 'personal', 'self', 'care', 'nurture');
      }
      
      // Abstract/conceptual expansions
      if (['abstract', 'concept', 'idea', 'thought', 'mind', 'brain', 'intelligence', 'creativity', 'imagination', 'inspiration'].includes(lowerKeyword)) {
        expandedKeywords.push('artistic', 'creative', 'design', 'pattern', 'texture', 'color', 'shape', 'form', 'composition', 'aesthetic', 'beautiful', 'elegant', 'sophisticated', 'modern', 'contemporary', 'minimalist', 'geometric', 'organic', 'fluid', 'dynamic', 'energetic', 'vibrant', 'bold', 'subtle');
      }
    });
    
    // Add general high-quality image keywords
    expandedKeywords.push('high', 'quality', 'professional', 'premium', 'excellent', 'outstanding', 'amazing', 'beautiful', 'stunning', 'gorgeous', 'magnificent', 'spectacular', 'impressive', 'remarkable', 'extraordinary', 'exceptional', 'superior', 'top', 'grade', 'award', 'winning');
    
    // Remove duplicates and return
    return [...new Set(expandedKeywords)];
  }

  /**
   * Find more images from the database when we run out
   * @param {Array} keywords - Search keywords
   * @returns {Promise<Array>} Additional images
   */
  async findMoreImages(keywords) {
    try {
      const supabase = getSupabase();
      
      // Get all images from the database
      const { data: allImages, error } = await supabase
        .from('images')
        .select('id, title, image_url, category, keywords, description')
        .limit(2000);
      
      if (error || !allImages || allImages.length === 0) {
        apiLogger.error('Error fetching all images for expansion:', error);
        return [];
      }

      // Create very broad keywords for maximum coverage
      const broadKeywords = this.getBroadKeywords(keywords);
      
      // Filter images using broad keywords
      const broadImages = allImages.filter(img => {
        try {
          const title = img.title?.toLowerCase() || '';
          const category = img.category?.toLowerCase() || '';
          
          // Handle keywords as array or string
          let keywordsText = '';
          if (Array.isArray(img.keywords)) {
            keywordsText = img.keywords.join(' ').toLowerCase();
          } else if (typeof img.keywords === 'string') {
            keywordsText = img.keywords.toLowerCase();
          }
          
          const description = img.description?.toLowerCase() || '';
          
          // Check if any broad keyword appears in any field
          return broadKeywords.some(broadKeyword => {
            const searchTerm = broadKeyword.toLowerCase();
            return title.includes(searchTerm) || 
                   category.includes(searchTerm) || 
                   keywordsText.includes(searchTerm) || 
                   description.includes(searchTerm);
          });
        } catch (error) {
          apiLogger.error('Error filtering broad image:', error, img);
          return false;
        }
      });

      apiLogger.info(`🔍 Found ${broadImages.length} additional images using broad search`);
      return broadImages;
    } catch (error) {
      apiLogger.error('Error finding more images:', error);
      return [];
    }
  }

  /**
   * Get very broad keywords for maximum image coverage
   * @param {Array} originalKeywords - Original search keywords
   * @returns {Array} Very broad keywords
   */
  getBroadKeywords(originalKeywords) {
    const broadKeywords = [];
    
    // Add very general categories that could work for most content
    broadKeywords.push('people', 'person', 'human', 'man', 'woman', 'individual', 'group', 'team', 'crowd', 'audience');
    broadKeywords.push('business', 'office', 'work', 'professional', 'corporate', 'meeting', 'presentation', 'conference');
    broadKeywords.push('nature', 'outdoor', 'landscape', 'scenic', 'natural', 'environmental', 'green', 'blue', 'sky', 'earth');
    broadKeywords.push('technology', 'digital', 'modern', 'contemporary', 'innovation', 'future', 'advanced', 'sophisticated');
    broadKeywords.push('abstract', 'artistic', 'creative', 'design', 'pattern', 'texture', 'color', 'shape', 'form');
    broadKeywords.push('lifestyle', 'health', 'wellness', 'fitness', 'active', 'vitality', 'energy', 'balance', 'harmony');
    broadKeywords.push('luxury', 'premium', 'exclusive', 'high-end', 'sophisticated', 'elegant', 'refined', 'quality');
    broadKeywords.push('urban', 'city', 'metropolitan', 'architecture', 'building', 'street', 'road', 'transportation');
    broadKeywords.push('education', 'learning', 'knowledge', 'wisdom', 'intelligence', 'brain', 'mind', 'thinking');
    broadKeywords.push('success', 'achievement', 'accomplishment', 'victory', 'winning', 'triumph', 'excellence');
    
    // Add quality indicators
    broadKeywords.push('high', 'quality', 'professional', 'premium', 'excellent', 'outstanding', 'amazing', 'beautiful', 'stunning', 'gorgeous', 'magnificent', 'spectacular', 'impressive', 'remarkable', 'extraordinary', 'exceptional', 'superior', 'top', 'grade', 'award', 'winning');
    
    // Add the original keywords
    broadKeywords.push(...originalKeywords);
    
    // Remove duplicates and return
    return [...new Set(broadKeywords)];
  }

  /**
   * Parse fallback response when JSON parsing fails
   * @param {string} content - AI response content
   * @param {number} slideCount - Expected slide count
   * @param {Array} allowedCategories - Categories allowed for this generation
   * @returns {Array} Parsed slides
   */
  parseFallbackResponse(content, slideCount, allowedCategories = ['business']) {
    let splitSlides = [];
    
    // Try multiple patterns to split slides
    if (content.includes('---')) {
      splitSlides = content.split(/---+/).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\*\*Slide \d+/)) {
      splitSlides = content.split(/\*\*Slide \d+:/).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/Slide \d+:/)) {
      splitSlides = content.split(/Slide \d+:/).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\d+\./)) {
      splitSlides = content.split(/\d+\./).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\d+ /)) {
      splitSlides = content.split(/\d+ /).map(s => s.trim()).filter(Boolean);
    } else if (content.match(/\[\{/)) {
      // Try to extract JSON-like content
      const jsonMatches = content.match(/\[\{[^}]*\}[^\]]*\]/g);
      if (jsonMatches) {
        splitSlides = jsonMatches.map(match => match.trim());
      }
    }
    
    const defaultCategory = allowedCategories[0] || 'business';
    
    if (splitSlides.length > 1) {
      return splitSlides.slice(0, slideCount).map((text, index) => {
        const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`;
        return {
          id: slideId,
          texts: [{ 
            id: `text-${slideId}-0`,
            content: text, 
            position: { x: 50, y: 60 } 
          }],
          imageCategory: defaultCategory
        };
      });
    } else {
      // If we can't split, create the requested number of slides from the content
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      if (sentences.length >= slideCount) {
        // Use sentences if we have enough
        return sentences.slice(0, slideCount).map((sentence, index) => {
          const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`;
          return {
            id: slideId,
            texts: [{ 
              id: `text-${slideId}-0`,
              content: sentence.trim(), 
              position: { x: 50, y: 60 } 
            }],
            imageCategory: defaultCategory
          };
        });
      } else {
        // Fallback to word splitting
        const words = content.split(' ');
        const wordsPerSlide = Math.ceil(words.length / slideCount);
        
        const slides = [];
        for (let i = 0; i < slideCount; i++) {
          const start = i * wordsPerSlide;
          const end = Math.min(start + wordsPerSlide, words.length);
          const slideText = words.slice(start, end).join(' ');
          const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${i}`;
          
          slides.push({
            id: slideId,
            texts: [{ 
              id: `text-${slideId}-0`,
              content: slideText, 
              position: { x: 50, y: 60 } 
            }],
            imageCategory: defaultCategory
          });
        }
        return slides;
      }
    }
  }

  /**
   * Clean slide content to remove JSON metadata that might be mixed in
   * @param {Array} slides - Array of slide objects
   * @returns {Array} Cleaned slides
   */
  cleanSlideContent(slides) {
    return slides.map(slide => {
      if (slide.texts && slide.texts.length > 0) {
        slide.texts = slide.texts.map(text => {
          if (text.content) {
            // Remove JSON metadata patterns that might be mixed into content
            let cleanedContent = text.content;
            
            // Remove JSON object patterns like {"position": {"x": 50, "y": 35}}
            cleanedContent = cleanedContent.replace(/\{\s*"[^"]*"\s*:\s*\{[^}]*\}\s*\}/g, '');
            
            // Remove JSON key-value patterns like "id": "text-2-2"
            cleanedContent = cleanedContent.replace(/"\s*[^"]*"\s*:\s*"[^"]*"/g, '');
            
            // Remove JSON key-value patterns like "content": "some text"
            cleanedContent = cleanedContent.replace(/"\s*content\s*"\s*:\s*"[^"]*"/g, '');
            
            // Remove JSON key-value patterns like "position": {"x": 50, "y": 35}
            cleanedContent = cleanedContent.replace(/"\s*position\s*"\s*:\s*\{[^}]*\}/g, '');
            
            // Remove JSON key-value patterns like "imageCategory": "love"
            cleanedContent = cleanedContent.replace(/"\s*imageCategory\s*"\s*:\s*"[^"]*"/g, '');
            
            // Remove JSON key-value patterns like "ratio": "9:16"
            cleanedContent = cleanedContent.replace(/"\s*ratio\s*"\s*:\s*"[^"]*"/g, '');
            
            // Remove JSON array patterns like {"id": "text-3-1", "content": ""}
            cleanedContent = cleanedContent.replace(/\{\s*"[^"]*"\s*:\s*"[^"]*"\s*,\s*"[^"]*"\s*:\s*"[^"]*"\s*\}/g, '');
            
            // Remove any remaining JSON-like patterns
            cleanedContent = cleanedContent.replace(/\{\s*"[^"]*"\s*:\s*[^}]*\}/g, '');
            
            // Clean up extra whitespace and commas
            cleanedContent = cleanedContent.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Remove any leading/trailing quotes that might be left
            cleanedContent = cleanedContent.replace(/^["']+|["']+$/g, '');
            
            text.content = cleanedContent;
          }
          return text;
        });
      }
      return slide;
    });
  }


  /**
   * Generate slide-specific keywords for better image relevance
   * @param {string} prompt - Original prompt
   * @param {Array} specificKeywords - Base keywords
   * @param {number} slideIndex - Slide index
   * @param {string} intelligenceMode - Intelligence mode
   * @returns {Promise<Array>} Slide-specific keywords
   */
  async generateSlideSpecificKeywords(prompt, specificKeywords, slideIndex, intelligenceMode = 'normal') {
    try {
      // For speed, use simple keyword expansion instead of AI
      const expandedKeywords = [];
      
      // Add slide-specific variations
      if (slideIndex === 0) {
        // Intro slide - add presentation/overview keywords
        expandedKeywords.push('presentation', 'overview', 'introduction', 'title');
      } else {
        // Content slides - add content-specific keywords
        expandedKeywords.push('content', 'information', 'fact', 'detail', 'insight');
      }
      
      // Add visual keywords based on base keywords
      specificKeywords.forEach(keyword => {
        const visualVariations = this.getVisualVariations(keyword);
        expandedKeywords.push(...visualVariations);
      });
      
      return [...new Set(expandedKeywords)].slice(0, 5); // Limit to 5 additional keywords
    } catch (error) {
      apiLogger.warn(`Error generating slide-specific keywords: ${error.message}`);
      return [];
    }
  }

  /**
   * Get visual variations of a keyword
   * @param {string} keyword - Base keyword
   * @returns {Array} Visual variations
   */
  getVisualVariations(keyword) {
    const variations = {
      'business': ['professional', 'corporate', 'office', 'meeting', 'team'],
      'finance': ['money', 'investment', 'wealth', 'success', 'growth'],
      'health': ['fitness', 'wellness', 'exercise', 'athlete', 'strength'],
      'technology': ['digital', 'innovation', 'future', 'modern', 'tech'],
      'lifestyle': ['life', 'living', 'daily', 'routine', 'personal'],
      'nature': ['outdoor', 'environment', 'natural', 'green', 'wildlife'],
      'luxury': ['premium', 'exclusive', 'elegant', 'sophisticated', 'high-end'],
      'abstract': ['concept', 'idea', 'thought', 'mind', 'creative'],
      'sports': ['athletic', 'competition', 'performance', 'energy', 'movement'],
      'family': ['relationship', 'love', 'connection', 'together', 'bond'],
      'urban': ['city', 'metropolitan', 'modern', 'contemporary', 'street'],
      'travel': ['journey', 'adventure', 'exploration', 'destination', 'experience']
    };
    
    return variations[keyword] || [keyword];
  }

  /**
   * Get fallback keywords when specific keywords don't find matches
   * @param {string} prompt - Original prompt
   * @param {number} slideIndex - Slide index
   * @returns {Array} Fallback keywords
   */
  getFallbackKeywords(prompt, slideIndex) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Determine fallback category based on prompt content
    if (lowerPrompt.includes('business') || lowerPrompt.includes('work') || lowerPrompt.includes('professional')) {
      return ['business', 'professional', 'office', 'team', 'meeting'];
    } else if (lowerPrompt.includes('health') || lowerPrompt.includes('fitness') || lowerPrompt.includes('wellness')) {
      return ['health', 'fitness', 'wellness', 'exercise', 'lifestyle'];
    } else if (lowerPrompt.includes('finance') || lowerPrompt.includes('money') || lowerPrompt.includes('investment')) {
      return ['finance', 'money', 'business', 'success', 'growth'];
    } else if (lowerPrompt.includes('technology') || lowerPrompt.includes('digital') || lowerPrompt.includes('innovation')) {
      return ['technology', 'digital', 'modern', 'future', 'innovation'];
    } else if (lowerPrompt.includes('nature') || lowerPrompt.includes('environment') || lowerPrompt.includes('outdoor')) {
      return ['nature', 'outdoor', 'environment', 'natural', 'green'];
    } else if (lowerPrompt.includes('luxury') || lowerPrompt.includes('premium') || lowerPrompt.includes('exclusive')) {
      return ['luxury', 'premium', 'exclusive', 'elegant', 'sophisticated'];
    } else {
      // Default fallback
      return ['people', 'lifestyle', 'modern', 'professional', 'success'];
    }
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
    this.categoryCache.clear();
    this.usedImages.clear();
  }

  /**
   * Check if we're currently rate limited
   * @returns {boolean} True if rate limited
   */
  checkRateLimitStatus() {
    const now = Date.now();
    
    // Check if we're still within the rate limit window
    if (this.rateLimitStatus.isLimited && now < this.rateLimitStatus.lastCheck + this.rateLimitStatus.retryAfter) {
      return true;
    }
    
    // Reset if we're past the retry time
    if (this.rateLimitStatus.isLimited && now >= this.rateLimitStatus.lastCheck + this.rateLimitStatus.retryAfter) {
      this.rateLimitStatus.isLimited = false;
      this.rateLimitStatus.retryAfter = 0;
    }
    
    return false;
  }

  /**
   * Update rate limit status when we hit a rate limit
   * @param {number} retryAfter - Retry after time in milliseconds
   */
  updateRateLimitStatus(retryAfter) {
    this.rateLimitStatus.isLimited = true;
    this.rateLimitStatus.lastCheck = Date.now();
    this.rateLimitStatus.retryAfter = retryAfter;
    apiLogger.warn(`⚠️ Rate limit status updated: retry after ${retryAfter}ms`);
  }

  /**
   * Get relevant categories based on keywords
   * @param {Array} keywords - Keywords to match
   * @param {string} dominantCategory - Dominant category to exclude
   * @returns {Array} Relevant categories ordered by relevance
   */
  getRelevantCategoriesForKeywords(keywords, dominantCategory) {
    const keywordString = keywords.join(' ').toLowerCase();
    const categoryScores = [];
    
    // Score each category based on keyword overlap
    for (const [category, categoryData] of Object.entries(UNIFIED_CATEGORIES)) {
      if (category === dominantCategory) continue;
      
      const categoryKeywords = categoryData.keywords.join(' ').toLowerCase();
      let score = 0;
      
      // Check for keyword matches
      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (categoryKeywords.includes(lowerKeyword)) {
          score += 2; // Direct keyword match
        }
        // Check for semantic similarity (e.g., "planes" matches "travel", "aviation" matches "transportation")
        if (this.hasSemanticOverlap(lowerKeyword, categoryKeywords)) {
          score += 1; // Semantic match
        }
      }
      
      if (score > 0) {
        categoryScores.push({ category, score });
      }
    }
    
    // Sort by score (highest first) and return category names
    categoryScores.sort((a, b) => b.score - a.score);
    const relevantCategories = categoryScores.map(item => item.category);
    
    // Add some fallback categories if we don't have enough relevant ones
    const fallbackCategories = ['technology', 'business', 'general'];
    for (const fallback of fallbackCategories) {
      if (!relevantCategories.includes(fallback) && fallback !== dominantCategory) {
        relevantCategories.push(fallback);
      }
    }
    
    apiLogger.info(`🎯 Relevant categories for keywords [${keywords.join(', ')}]: ${relevantCategories.slice(0, 5).join(', ')}`);
    return relevantCategories;
  }
  
  /**
   * Check for semantic overlap between keywords and category keywords
   * @param {string} keyword - Single keyword
   * @param {string} categoryKeywords - Category keywords as string
   * @returns {boolean} True if there's semantic overlap
   */
  hasSemanticOverlap(keyword, categoryKeywords) {
    // Define semantic relationships
    const semanticGroups = {
      'planes': ['travel', 'transportation', 'aviation', 'flight'],
      'aviation': ['travel', 'transportation', 'planes', 'flight'],
      'aircraft': ['travel', 'transportation', 'planes', 'aviation'],
      'flight': ['travel', 'transportation', 'planes', 'aviation'],
      'cars': ['transportation', 'travel', 'automotive'],
      'automotive': ['transportation', 'travel', 'cars'],
      'technology': ['tech', 'digital', 'computer', 'innovation'],
      'business': ['corporate', 'professional', 'office', 'work'],
      'health': ['fitness', 'wellness', 'medical', 'healthcare'],
      'sports': ['athletic', 'fitness', 'competition', 'training'],
      'food': ['dining', 'restaurant', 'culinary', 'cuisine'],
      'fashion': ['style', 'clothing', 'apparel', 'trendy'],
      'luxury': ['premium', 'exclusive', 'high-end', 'sophisticated'],
      'nature': ['outdoor', 'landscape', 'environmental', 'green'],
      'urban': ['city', 'metropolitan', 'architecture', 'skyline'],
      'industrial': ['manufacturing', 'factory', 'production', 'machinery']
    };
    
    // Check if the keyword has semantic relationships
    for (const [groupKeyword, relatedKeywords] of Object.entries(semanticGroups)) {
      if (keyword.includes(groupKeyword) || groupKeyword.includes(keyword)) {
        return relatedKeywords.some(related => categoryKeywords.includes(related));
      }
    }
    
    return false;
  }
  
  /**
   * Determine if image selection should be reset based on available images and usage
   * @param {number} totalImages - Total number of available images
   * @param {number} usedPercentage - Percentage of images already used
   * @returns {boolean} True if selection should be reset
   */
  shouldResetImageSelection(totalImages, usedPercentage) {
    // For very small image sets (1-3 images), reset more aggressively
    if (totalImages <= 3) {
      return usedPercentage > 0.5; // Reset if more than 50% used
    }
    
    // For small image sets (4-10 images), reset when 70% used
    if (totalImages <= 10) {
      return usedPercentage > 0.7;
    }
    
    // For larger image sets, use the original 80% threshold
    return usedPercentage > 0.8;
  }

}

// Export singleton instance
export const unifiedContentEngine = new UnifiedContentEngine(); 