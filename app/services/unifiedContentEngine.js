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
    this.usedImages = new Set();
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

Available image categories:
${Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => 
  `- ${key}: ${value.name} (${value.keywords.join(', ')})`
).join('\n')}

TASK: Analyze the user's prompt and select the 1-3 most appropriate image categories that would best represent the visual style and theme of the content they want to create.

ANALYSIS GUIDELINES:

1. Consider the business context if provided
2. Never use the same image twice in the same slide generation.
3. Select only the most appropriate unified categories based on the user prompt, only select one category. So users do not get a mix of diffrent image categories.
Available image categories: ${Object.keys(UNIFIED_CATEGORIES).join(', ')}

RESPONSE FORMAT: Return ONLY a JSON object with a "categories" array containing category keys.
Example: {"categories": ["business", "technology"]}

EXAMPLE:
User prompt: "Create slides about startup funding and investment strategies"
Business context: Technology startup
Response: {"categories": ["technology", "finance", "entrepreneurship"]}

User prompt: "Make motivational content about fitness and health"
Response: {"categories": ["health", "motivation", "lifestyle"]}

User prompt: "Design slides about luxury travel destinations"
Response: {"categories": ["luxury", "travel"]}`;

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

      apiLogger.debug(`AI detected categories: ${validCategories.join(', ')}`);
      return validCategories;

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

TASK: Analyze the user's prompt and extract:
1. The most appropriate image category (from the available categories)
2. Specific keywords that should be present in the selected images for maximum relevance

AVAILABLE IMAGE CATEGORIES:
${Object.entries(UNIFIED_CATEGORIES).map(([key, value]) => 
  `- ${key}: ${value.name} (${value.keywords.join(', ')})`
).join('\n')}

ANALYSIS GUIDELINES:
1. Select the most specific and relevant category
2. Extract 3-5 specific keywords that should appear in image titles or descriptions
3. Focus on visual elements, objects, scenes, or concepts mentioned in the prompt
4. Consider the business context for more targeted keyword selection
5. Keywords should be specific enough to find relevant images but not so specific that no images match

RESPONSE FORMAT: Return ONLY a JSON object with:
{
  "category": "selected_category_key",
  "specificKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

EXAMPLES:
User prompt: "Create slides about startup funding and investment strategies"
Response: {
  "category": "finance",
  "specificKeywords": ["investment", "funding", "startup", "money", "business"]
}

User prompt: "Make motivational content about fitness and health"
Response: {
  "category": "health",
  "specificKeywords": ["fitness", "workout", "healthy", "exercise", "wellness"]
}

User prompt: "Design slides about luxury travel destinations"
Response: {
  "category": "luxury",
  "specificKeywords": ["luxury", "travel", "destination", "premium", "exclusive"]
}

User prompt: "Create content about team collaboration in modern offices"
Response: {
  "category": "business",
  "specificKeywords": ["team", "collaboration", "office", "meeting", "workplace"]
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

      // Validate the response structure
      if (!parsedResponse.category || !UNIFIED_CATEGORIES.hasOwnProperty(parsedResponse.category)) {
        apiLogger.warn('Invalid category in AI response, falling back to category detection');
        const categories = await this.detectCategoriesFromPrompt(prompt, businessContext, intelligenceMode);
        return {
          category: categories[0] || 'business',
          specificKeywords: parsedResponse.specificKeywords || []
        };
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
    
    apiLogger.debug(`Fallback detected categories: ${detectedCategories.join(', ')}`);
    return detectedCategories;
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
      
      // Detect categories and specific keywords from user prompt using AI
      apiLogger.debug(`Starting AI-powered category and keyword detection for prompt: "${prompt}" (${intelligenceMode} mode)`);
      const keywordAnalysis = await this.detectSpecificKeywordsFromPrompt(prompt, businessContext, intelligenceMode);
      const allowedCategories = [keywordAnalysis.category];
      const specificKeywords = keywordAnalysis.specificKeywords;
      apiLogger.debug(`AI detection complete. Category: ${keywordAnalysis.category}, Specific keywords: ${specificKeywords.join(', ')}`);
      
      // Build context-aware prompt
      const context = { businessContext, userInfo };
      let systemPrompt = buildContextAwarePrompt(context, prompt);
      
      // Add existing slides context if available
      if (existingSlides && existingSlides.length > 0) {
        const existingSlidesContext = existingSlides.map((slide, index) => {
          const slideTexts = slide.texts?.map(text => text.content).join(' | ') || 'No text';
          return `Slide ${index + 1}: ${slideTexts}`;
        }).join('\n');
        
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
      const valuableSlides = slideCount - 1;
      systemPrompt += `\n\nYou are a professional content creator specializing in engaging social media slides.\n\nCreate EXACTLY ${slideCount} slides in total:\n- The first slide is always an introduction.\n- The remaining ${valuableSlides} slides each contain one valuable, informative fact.\n\nThe introduction slide MUST state the correct number of facts (for example, '${valuableSlides} incredible facts about Haile Gebrselassie' if there are ${slideCount} slides in total).\n\nCRITICAL CONTENT REQUIREMENTS:\n1. Each valuable slide (slides 2 to ${slideCount}) MUST contain 70-175 characters of valuable, educational content\n2. Include specific facts, statistics, actionable tips, or insightful observations\n3. Make each valuable slide self-contained with enough information to be valuable\n4. Use clear, engaging language that educates and informs\n5. Focus on providing real value, not generic statements\n6. Each valuable slide should teach something specific or provide actionable insights\n\nCONTENT EXAMPLES:\n✅ GOOD: \"The average person spends 2.5 hours daily on social media, equivalent to 38 days per year\"\n✅ GOOD: \"Compound interest can turn $10,000 into $100,000 in 25 years at 9% return\"\n✅ GOOD: \"Reading 20 pages daily equals 30 books per year, putting you in the top 1% of readers\"\n❌ BAD: \"Social media is important for business\"\n❌ BAD: \"Investing is good for your future\"\n❌ BAD: \"Reading books helps you grow\"\n\nIMPORTANT EXAMPLE FOR SLIDE COUNTING:\nUser prompt: \"3 incredible facts about Haile Gebrselassie\"\n\nIf the user prompt asks for N facts, you must create N+1 slides: 1 intro slide (with the text 'N incredible facts about ...') and N fact slides.\n\n[\n  {\n    \"texts\": [{\n      \"id\": \"text-1-1\",\n      \"content\": \"3 incredible facts about Haile Gebrselassie\",\n      \"position\": {\"x\": 50, \"y\": 40}\n    }],\n    \"imageCategory\": \"sports\",\n    \"ratio\": \"9:16\"\n  },\n  {\n    \"texts\": [{\n      \"id\": \"text-2-1\",\n      \"content\": \"Fact 1 ...\",\n      \"position\": {\"x\": 50, \"y\": 35}\n    }],\n    \"imageCategory\": \"sports\",\n    \"ratio\": \"9:16\"\n  },\n  {\n    \"texts\": [{\n      \"id\": \"text-3-1\",\n      \"content\": \"Fact 2 ...\",\n      \"position\": {\"x\": 50, \"y\": 35}\n    }],\n    \"imageCategory\": \"sports\",\n    \"ratio\": \"9:16\"\n  },\n  {\n    \"texts\": [{\n      \"id\": \"text-4-1\",\n      \"content\": \"Fact 3 ...\",\n      \"position\": {\"x\": 50, \"y\": 35}\n    }],\n    \"imageCategory\": \"sports\",\n    \"ratio\": \"9:16\"\n  }\n]\n\nNotice: The first slide is an introduction and the next 3 slides are the valuable content. The intro slide text states the correct number of valuable slides (e.g., '3 incredible facts about Haile Gebrselassie').\n\nIMAGE SELECTION:\n1. Use the AI-detected categories: ${allowedCategories.join(', ')}\n2. Select the most appropriate category from these options for each slide\n3. Maintain visual consistency by using related categories when multiple are available\n4. Available image categories: ${Object.keys(UNIFIED_CATEGORIES).join(', ')}\n\nSLIDE STRUCTURE:\n1. The first slide should introduce the topic and state the correct number of valuable slides (e.g., \"3 incredible facts about Haile Gebrselassie\" if there are 4 slides total)\n2. Each valuable slide (slides 2 to ${slideCount}) should focus on ONE specific point or insight\n3. No '#', ':' or '-' in the content EVER\n\nABSOLUTE RULES:\n1. CRITICAL: You MUST return EXACTLY ${slideCount} slides. No more, no less.\n2. NEVER use the same image twice in the same slide generation.\n2. YOU MUST RETURN VALID JSON ONLY. No explanations, no markdown, just the JSON array.\n3. Each slide object must have: texts array, imageCategory, and ratio field.\n4. Texts array must contain objects with id, content and position fields.\n5. Each text object MUST have a unique id field (e.g., \"text-1-1\", \"text-2-1\", etc.).\n6. Ratio must be \"9:16\" for all slides.\n\nEXAMPLE FORMAT:\nYou should return the following format:\nuser prompt: \"3 incredible facts about Haile Gebrselassie\"\n\n[{\n  \"texts\": [{\n    \"id\": \"text-1-1\",\n    \"content\": \"3 incredible facts about Haile Gebrselassie\",\n    \"position\": {\"x\": 50, \"y\": 40}\n  }],\n  \"imageCategory\": \"sports\",\n  \"ratio\": \"9:16\"\n}, {\n  \"texts\": [{\n    \"id\": \"text-2-1\",\n    \"content\": \"Fact 1 ...\",\n    \"position\": {\"x\": 50, \"y\": 35}\n  }],\n  \"imageCategory\": \"sports\",\n  \"ratio\": \"9:16\"\n}, {\n  \"texts\": [{\n    \"id\": \"text-3-1\",\n    \"content\": \"Fact 2 ...\",\n    \"position\": {\"x\": 50, \"y\": 35}\n  }],\n  \"imageCategory\": \"sports\",\n  \"ratio\": \"9:16\"\n}, {\n    \"texts\": [{\n      \"id\": \"text-4-1\",\n      \"content\": \"Fact 3 ...\",\n      \"position\": {\"x\": 50, \"y\": 35}\n    }],\n    \"imageCategory\": \"sports\",\n    \"ratio\": \"9:16\"\n}]`;

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

      // Apply smart text positioning and add images - process sequentially to prevent race conditions
      const completeSlides = [];
      for (let i = 0; i < slides.length; i++) {
        const enhancedSlide = await this.enhanceSlideWithImage(slides[i], i, prompt, allowedCategories, specificKeywords, businessContext, intelligenceMode);
        completeSlides.push(enhancedSlide);
      }

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

      apiLogger.debug(`Successfully generated ${completeSlides.length} complete slides`);
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
      // Enforce category restrictions
      let imageCategory = slide.imageCategory || 'business';
      if (!allowedCategories.includes(imageCategory)) {
        apiLogger.warn(`Category "${imageCategory}" not in allowed categories: ${allowedCategories.join(', ')}. Using first allowed category.`);
        imageCategory = allowedCategories[0];
      }
      
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
      // Enforce category restrictions
      if (!allowedCategories.includes(imageCategory)) {
        apiLogger.warn(`Category "${imageCategory}" not in allowed categories: ${allowedCategories.join(', ')}. Using first allowed category.`);
        imageCategory = allowedCategories[0];
      }
      
      // Get images for the category
      const categoryKeywords = getCategoryKeywords(imageCategory) || getCategoryKeywords('business');
      
      // Combine category keywords with specific keywords for more precise selection
      const allKeywords = [...new Set([...categoryKeywords, ...specificKeywords])];
      let images = await this.queryImagesByKeywords(allKeywords);
      
      // If no images found and we have specific keywords, try intelligent fallback
      if ((!images || images.length === 0) && specificKeywords.length > 0) {
        apiLogger.info(`🎯 No images found for specific keywords: ${specificKeywords.join(', ')}. Using intelligent fallback...`);
        
        const fallbackCategory = await this.getIntelligentFallbackCategory(prompt, specificKeywords, businessContext, intelligenceMode);
        apiLogger.info(`🧠 Intelligent fallback selected category: ${fallbackCategory} for prompt: "${prompt}"`);
        
        // Get images from the fallback category
        const fallbackKeywords = getCategoryKeywords(fallbackCategory) || getCategoryKeywords('business');
        images = await this.queryImagesByKeywords(fallbackKeywords);
        
        if (images && images.length > 0) {
          apiLogger.info(`✅ Found ${images.length} images using intelligent fallback category: ${fallbackCategory}`);
        } else {
          apiLogger.warn(`❌ No images found even with intelligent fallback category: ${fallbackCategory}`);
          return null;
        }
      } else if (!images || images.length === 0) {
        apiLogger.warn(`No images found for category: ${imageCategory}`);
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
            const selectedImage = await this.selectBestMatchingImageWithVisualAnalysis(freshAvailableImages, specificKeywords, slideIndex, prompt);
            this.usedImages.add(selectedImage.id);
            apiLogger.debug(`Selected image ${selectedImage.id} for slide ${slideIndex} in category ${imageCategory} (after reset)`);
            return selectedImage;
          }
        }
        
        // If we can't reset or still no available images, pick a random image from all images
        // But still avoid duplicates by checking if it's already used
        const unusedImages = images.filter(img => !this.usedImages.has(img.id));
        if (unusedImages.length > 0) {
          const selectedImage = await this.selectBestMatchingImageWithVisualAnalysis(unusedImages, specificKeywords, slideIndex, prompt);
          this.usedImages.add(selectedImage.id);
          apiLogger.debug(`Selected image ${selectedImage.id} for slide ${slideIndex} in category ${imageCategory} (fallback)`);
          return selectedImage;
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
      // Limit the number of images to analyze to avoid excessive API calls
      const maxImagesToAnalyze = intelligenceMode === 'max' ? 15 : 8;
      
      // Randomly sample images to avoid always analyzing the same ones
      const imagesToAnalyze = this.getRandomSample(availableImages, maxImagesToAnalyze);
      
      apiLogger.info(`🔍 Analyzing ${imagesToAnalyze.length} images with visual AI for slide ${slideIndex} (${intelligenceMode} mode)`);
      
      // For normal mode, always use visual analysis for better image selection
      // For max mode, try keyword-based selection first, then fall back to visual analysis
      if (intelligenceMode === 'max') {
        // First, try keyword-based selection for quick results
        const keywordBasedImage = this.selectBestMatchingImage(availableImages, specificKeywords, slideIndex);
        
        // If we have a good keyword match (score > 0), use it
        const keywordScore = this.calculateKeywordScore(keywordBasedImage, specificKeywords);
        if (keywordScore > 0) {
          apiLogger.debug(`✅ Using keyword-based selection for slide ${slideIndex}: "${keywordBasedImage.title}" (score: ${keywordScore})`);
          return keywordBasedImage;
        }
        
        // If no good keyword matches, use visual analysis
        apiLogger.info(`🎯 No good keyword matches, using visual analysis for slide ${slideIndex} (${intelligenceMode} mode)`);
      } else {
        // Normal mode: Always use visual analysis for better image selection
        apiLogger.info(`🎯 Using visual analysis for slide ${slideIndex} (${intelligenceMode} mode)`);
      }
      
      // Analyze images with visual AI
      const imageUrls = imagesToAnalyze.map(img => img.image_url);
      const visualAnalyses = await visualAnalysisService.analyzeImageBatch(imageUrls, prompt, intelligenceMode);
      
      if (visualAnalyses.length === 0) {
        apiLogger.warn(`❌ Visual analysis failed, falling back to random selection for slide ${slideIndex}`);
        return availableImages[Math.floor(Math.random() * availableImages.length)];
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
   * Query images by keywords with caching
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
      const { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url')
        .or(keywords.map(keyword => `title.ilike.%${keyword}%`).join(','))
        .limit(50);

      if (error) {
        apiLogger.error('Supabase error:', error);
        return [];
      }

      this.categoryCache.set(cacheKey, images || []);
      return images || [];
    } catch (error) {
      apiLogger.error('Error querying images:', error);
      return [];
    }
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
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
    this.categoryCache.clear();
    this.usedImages.clear();
  }

}

// Export singleton instance
export const unifiedContentEngine = new UnifiedContentEngine(); 