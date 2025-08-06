import { getSupabase } from '../../supabaseClient';
import { apiLogger } from '../utils/logger';
import OpenAI from 'openai';
import { buildContextAwarePrompt } from '../utils/contextPriority.js';
import { retrieveUserMemory, buildMemoryContext, extractMemoryInsights, storeMemoryInsights } from './aiMemoryService.js';
import { UNIFIED_CATEGORIES, getCategoryKeywords } from '../shared/constants/imageCategories.js';
import { getModelConfig } from '../utils/modelSelection.js';
import { getIntelligenceMode } from './userSettingsService.js';
import { visualAnalysisService } from './visualAnalysisService.js';

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

/**
 * Unified Content Engine - Streamlined service for generating complete slide content
 * Combines text generation and image selection into one efficient process
 */
export class UnifiedContentEngine {
  constructor() {
    this.usedImages = new Set();
    this.categoryCache = new Map();
  }

  /**
   * Generate complete slides with text and images in one unified process
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - User prompt
   * @param {number} params.slideCount - Number of slides to generate
   * @param {Object} params.businessContext - Business context
   * @param {Object} params.userInfo - User information
   * @param {Array} params.existingSlides - Existing slides for context
   * @param {string} params.selectedCategory - User-selected category
   * @param {string} params.mode - Content mode (slides, text, videos, etc.)
   * @returns {Promise<Array>} Complete slides with text and images
   */
  async generateCompleteSlides({ prompt, slideCount = 5, businessContext, userInfo, existingSlides = [], selectedCategory, mode = 'slides' }) {
    // Skip credit checks for vaporware - allow all functionality
    apiLogger.info('Skipping credit checks for vaporware development');

    // Get user's intelligence mode setting
    let intelligenceMode = 'normal';
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
      this.categoryCache.clear();
      apiLogger.info('🧹 Cleared all caches for fresh image selection');
      
      // Determine dominant category
      let dominantCategory;
      let specificKeywords;
      
      // For text mode, don't use image categories
      if (mode === 'text') {
        dominantCategory = null;
        specificKeywords = [];
        apiLogger.info(`🎯 Text mode detected - no image categories will be used`);
      } else if (selectedCategory && UNIFIED_CATEGORIES[selectedCategory]) {
        dominantCategory = selectedCategory;
        specificKeywords = UNIFIED_CATEGORIES[selectedCategory].keywords;
        apiLogger.info(`🎯 Using user-selected category: ${selectedCategory} for entire generation`);
      } else {
        dominantCategory = 'pool';
        specificKeywords = UNIFIED_CATEGORIES['pool'].keywords;
        apiLogger.info(`🎯 Using default pool category for entire generation`);
      }
      
      // Build context-aware prompt
      const context = { businessContext, userInfo };
      let systemPrompt = buildContextAwarePrompt(context, prompt);
      
      // Add specific handling for quotes
      if (prompt.toLowerCase().includes('romantic') || prompt.toLowerCase().includes('quote') || prompt.toLowerCase().includes('stoic') || prompt.toLowerCase().includes('philosophy')) {
        systemPrompt += `\n\nSPECIAL INSTRUCTIONS FOR QUOTES:\n- When creating quote slides, use the ACTUAL QUOTE TEXT in the "content" field\n- Do NOT include JSON metadata, position data, or structural information in the quote text\n- The quote should be clean, readable text that users can understand\n- Include the author attribution as a separate text element if needed\n- Focus on the emotional impact and readability of the quote\n- For stoic quotes, use famous stoic philosophers like Seneca, Epictetus, Marcus Aurelius, etc.\n- Each quote slide should contain the full quote, not just the author name
- NEVER include the phrase "slide content" or any positioning language in your content\n\nEXAMPLE FOR STOIC QUOTES:\n✅ GOOD: "The happiness of your life depends upon the quality of your thoughts."\n✅ GOOD: "Waste no more time arguing about what a good man should be. Be one."\n✅ GOOD: "It is not death that a man should fear, but he should fear never beginning to live."\n❌ BAD: "— Seneca"\n❌ BAD: "— Epictetus"\n❌ BAD: "— Marcus Aurelius"\n\nEXAMPLE FORMAT FOR QUOTE SLIDES:\n[{\n  "texts": [{\n    "id": "text-1-1",\n    "content": "4 powerful stoic quotes"\n  }],\n  "imageCategory": "creativity",\n  "ratio": "9:16"\n}, {\n  "texts": [{\n    "id": "text-2-1",\n    "content": "The happiness of your life depends upon the quality of your thoughts."\n  }, {\n    "id": "text-2-2",\n    "content": "— Marcus Aurelius"\n  }],\n  "imageCategory": "creativity",\n  "ratio": "9:16"\n}]\n`;
      }
      
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

      // Add creative variation to prevent repetitive outputs
      const variationStyles = [
        'Focus on practical tips and actionable advice',
        'Emphasize surprising facts and statistics',
        'Highlight common mistakes and how to avoid them',
        'Share expert insights and professional perspectives',
        'Include step-by-step guidance and processes',
        'Present both benefits and challenges',
        'Focus on modern trends and current best practices',
        'Emphasize cost-effective and budget-friendly approaches',
        'Highlight time-saving techniques and efficiency tips',
        'Include both beginner and advanced level insights'
      ];
      
      // Use timestamp and prompt hash for consistent but varied randomization
      const promptHash = prompt.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const timeSeed = Date.now() % 1000;
      const randomIndex = (promptHash + timeSeed) % variationStyles.length;
      const randomStyle = variationStyles[randomIndex];
      
      systemPrompt += `\n\nCREATIVE APPROACH: ${randomStyle}\n\n`;
      
      // Add category override if user selected a specific category (not for text mode)
      if (mode !== 'text' && selectedCategory && UNIFIED_CATEGORIES[selectedCategory]) {
        systemPrompt += `\n\nUSER-SELECTED IMAGE CATEGORY: ${UNIFIED_CATEGORIES[selectedCategory].name}\nUse ONLY this category for all slides: ${selectedCategory}\n`;
      }
      
      // Enhanced instructions for more specific, unique content
      systemPrompt += `\n\nYou are a creative content creator who specializes in making engaging, specific, and memorable content. 

IMPORTANT: If the user's prompt is vague or unclear, DO NOT return raw JSON structure. Instead, create meaningful, specific content based on the prompt. For example:
- If they say "make slides about otters" → create specific slides about otter facts, behaviors, habitats, etc.
- If they say "create content about business" → create specific slides about business tips, strategies, insights, etc.
- If they say "make something about life" → create specific slides about life lessons, wisdom, experiences, etc.

Create EXACTLY ${slideCount} slides about the user's topic.

CONTENT CREATION GUIDELINES:
1. Create EXACTLY ${slideCount} slides - no more, no less
2. Each slide should be SPECIFIC and UNIQUE - avoid generic statements
3. Include concrete details, specific examples, or surprising insights
4. Use vivid, descriptive language that paints a picture
5. Make each slide memorable and shareable
6. Include specific numbers, statistics, or actionable tips when relevant
7. Use storytelling elements and emotional hooks
8. Avoid clichés and overused phrases
9. Make content feel personal and relatable
10. Include unexpected angles or perspectives on the topic

CREATIVITY RULES:
- Think like a viral content creator, not a textbook writer
- Use specific examples rather than general statements
- Include surprising facts or counterintuitive insights
- Make each slide feel like it has a unique "hook"
- Use sensory details and vivid descriptions
- Include specific scenarios or situations
- Avoid generic advice - be specific and actionable
- Use analogies and metaphors when helpful
- Include specific timeframes, locations, or contexts
- Make content feel fresh and original

TECHNICAL RULES:
- NEVER use hyphens (-), semicolons (;), or colons (:) in any text content
- MUST return a JSON array with exactly ${slideCount} objects
- ALWAYS start with an engaging intro slide
- NEVER include raw prompt text or JSON metadata in the content field
- Write clean, readable content that users can understand
- NEVER include the words "Here are" or "slides that" in your content
- NEVER include JSON structure examples in your content
- NEVER include the phrase "slide content" in your content
- NEVER include any positioning or structural language in your content
- NEVER include JSON syntax like {"texts": [{"id": "text-1-1", "content": "..."}]} in the content field
- The content field should contain ONLY the actual text, not JSON structure
- NEVER include quotes, brackets, or JSON formatting in the content field
- CRITICAL: The "content" field should contain ONLY the actual slide text, nothing else
- NEVER include JSON structure like "texts": [{"id": "text-2-1", "content": "..."}] in the content field
- NEVER include any JSON keys like "id", "content", "texts", "imageCategory", "ratio" in the content field
- The content field should be clean text like "Law 1: Never outshine the master" - NOT JSON like '{"texts": [{"id": "text-1-1", "content": "..."}]}'

CONTENT STYLE EXAMPLES:
✅ SPECIFIC: "75% of people check their phone within 5 minutes of waking up"
✅ SPECIFIC: "The average person spends 4 hours daily on social media"
✅ SPECIFIC: "Coffee consumption increases productivity by 23%"
✅ SPECIFIC: "Walking 10,000 steps burns 400 calories"
❌ GENERIC: "Exercise is good for you"
❌ GENERIC: "Eat healthy food"
❌ GENERIC: "Get enough sleep"

TEXT POSITIONING RULES:
- NEVER include position data in your JSON response
- The system will automatically position all text elements
- Focus ONLY on creating the content, not positioning
- Each text object should have: id, content (and the system will add position automatically)
- Do NOT specify x or y coordinates in your response
- The system handles all positioning to prevent overlaps and ensure readability

RETURN FORMAT:
Return ONLY a JSON array with ${slideCount} objects, each containing:
- texts: array of text objects with id and content (position will be added automatically)
- imageCategory: "${dominantCategory}"
- ratio: "9:16"

COMPREHENSIVE EXAMPLE FORMAT:
user prompt: "make 6 slides about things people learn too late in life"

[{
  "texts": [{
    "id": "text-1-1",
    "content": "6 things people learn too late in life"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-2-1",
    "content": "1. your body is not invisible"
  }, {
    "id": "text-2-2",
    "content": "the choices you make in your 20s and 30s will affect the quality of life in your 50s and beyond"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}, {
  "texts": [{   
    "id": "text-3-1",
    "content": "2. discipline beats motivation"
  }, {
    "id": "text-3-2",
    "content": "motivation is temporary but showing up even when you don't feel like it is what makes real progress"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-4-1",
    "content": "3. comparison steals progress"
  }, {
    "id": "text-4-2",
    "content": "the only person you should be competing against is the person you were yesterday"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-5-1",
    "content": "4. consistency over intensity"
  }, {
    "id": "text-5-2",
    "content": "making small progress consistently is better than the occasional all out effort"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-6-1",
    "content": "5. your habits shape your future"
  }, {
    "id": "text-6-2",
    "content": "small daily habits compound both negatively and positively"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}, {
  "texts": [{
    "id": "text-7-1",
    "content": "6. time is the only true currency"
  }, {
    "id": "text-7-2",
    "content": "money can be made, but time once gone, is gone"
  }],
  "imageCategory": "${dominantCategory}",
  "ratio": "9:16"
}]

CRITICAL: The "content" field should contain ONLY the actual slide text, nothing else. Do NOT include JSON structure, position data, or any metadata in the content field.

IMPORTANT: The content field should be clean text like "1. your body is not invisible" - NOT JSON like '{"texts": [{"id": "text-1-1", "content": "..."}]}'.

SPECIFIC EXAMPLES OF WHAT NOT TO DO:
❌ WRONG: "content": "{"texts": [{"id": "text-2-1", "content": "Law 1: Never outshine the master"}]}"
❌ WRONG: "content": "texts: [{id: text-2-1, content: Law 1: Never outshine the master}]"
❌ WRONG: "content": "{"id": "text-2-1", "content": "Law 1: Never outshine the master"}"

✅ CORRECT: "content": "Law 1: Never outshine the master"
✅ CORRECT: "content": "1. your body is not invisible"
✅ CORRECT: "content": "the choices you make in your 20s and 30s will affect the quality of life in your 50s and beyond"`;

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
        apiLogger.debug('Raw AI response:', completion.choices[0].message.content);
        
        // Check if the response is just raw JSON structure
        const rawResponse = completion.choices[0].message.content;
        if (rawResponse.includes('"texts":') && rawResponse.includes('"content":') && rawResponse.includes('"imageCategory":')) {
          apiLogger.warn('AI returned raw JSON structure instead of meaningful content. Attempting to extract content...');
          
          // Try to extract meaningful content from the raw JSON
          const contentMatches = rawResponse.match(/"content":\s*"([^"]+)"/g);
          if (contentMatches && contentMatches.length > 0) {
            const extractedContent = contentMatches.map(match => {
              const content = match.match(/"content":\s*"([^"]+)"/);
              return content ? content[1] : 'Content';
            }).filter(content => content.length > 3);
            
            if (extractedContent.length > 0) {
              slides = extractedContent.slice(0, slideCount).map((content, index) => ({
                id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`,
                texts: [{
                  id: `text-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`,
                  content: content
                }],
                imageCategory: dominantCategory,
                ratio: '9:16'
              }));
            } else {
              // Fallback parsing logic
              slides = this.parseFallbackResponse(completion.choices[0].message.content, slideCount, dominantCategory);
            }
          } else {
            // Fallback parsing logic
            slides = this.parseFallbackResponse(completion.choices[0].message.content, slideCount, dominantCategory);
          }
        } else {
          // Fallback parsing logic
          slides = this.parseFallbackResponse(completion.choices[0].message.content, slideCount, dominantCategory);
        }
        
        // Ensure we have the right number of slides after fallback
        if (slides.length !== slideCount) {
          apiLogger.warn(`Fallback parsing resulted in ${slides.length} slides, need ${slideCount}. Creating additional slides...`);
          while (slides.length < slideCount) {
            const newSlide = {
              id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${slides.length}`,
              texts: [{
                id: `text-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${slides.length}`,
                content: `Additional content about ${prompt}`
              }],
              imageCategory: dominantCategory,
              ratio: '9:16'
            };
            slides.push(newSlide);
          }
        }
      }

      // Import smart positioning utilities
      const { calculateOptimalPosition } = await import('../utils/textPositioning.js');
      
      // Validate and enhance slides with proper unique IDs and smart positioning
      slides = slides.map((slide, idx) => {
        const slideId = slide.id || `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${idx}`;
        const slideRatio = slide.ratio || '9:16';
        
        // Apply smart positioning to each text element
        const positionedTexts = [];
        for (let textIdx = 0; textIdx < (slide.texts || []).length; textIdx++) {
          const text = slide.texts[textIdx];
          
          // If the AI provided position data, validate it; otherwise calculate optimal position
          let position;
          if (text.position && typeof text.position.x === 'number' && typeof text.position.y === 'number') {
            // AI provided position - validate and correct if needed
            position = {
              x: Math.max(5, Math.min(95, text.position.x)),
              y: Math.max(35, Math.min(95, text.position.y)) // Prevent text in top 30%
            };
          } else {
            // No position provided - calculate optimal position
            position = calculateOptimalPosition(
              positionedTexts, // Consider all previously positioned texts
              slideRatio,
              textIdx
            );
          }
          
          positionedTexts.push({
            ...text,
            id: text.id || `text-${slideId}-${textIdx}`,
            position: position
          });
        }
        
        return {
          id: slideId,
          texts: positionedTexts,
          imageCategory: slide.imageCategory || dominantCategory,
          ratio: slideRatio
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
        apiLogger.warn(`AI generated ${slides.length} slides but requested ${slideCount}. Attempting to fix...`);
        
        // Try to fix by duplicating or splitting slides
        if (slides.length === 0) {
          // No slides generated, create basic slides
          slides = Array.from({ length: slideCount }, (_, index) => ({
            id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`,
            texts: [{
              id: `text-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`,
              content: `Content about ${prompt}`
            }],
            imageCategory: dominantCategory,
            ratio: '9:16'
          }));
        } else if (slides.length < slideCount) {
          // Not enough slides, duplicate the last slide to reach the count
          const lastSlide = slides[slides.length - 1];
          while (slides.length < slideCount) {
            const newSlide = {
              ...lastSlide,
              id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${slides.length}`,
              texts: lastSlide.texts.map((text, textIndex) => ({
                ...text,
                id: `text-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${slides.length}-${textIndex}`,
                content: `${text.content} (continued)`
              }))
            };
            slides.push(newSlide);
          }
        } else if (slides.length > slideCount) {
          // Too many slides, truncate to the requested count
          slides = slides.slice(0, slideCount);
        }
        
        apiLogger.info(`Fixed slide count: now have ${slides.length} slides`);
      }

      // Apply smart text positioning and add images - process in parallel for speed
      const completeSlides = await Promise.all(
        slides.map((slide, i) => 
          this.enhanceSlideWithImage(slide, i, prompt, dominantCategory, specificKeywords, businessContext, intelligenceMode)
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

      apiLogger.debug(`Successfully generated ${completeSlides.length} complete slides using SINGLE dominant category: ${dominantCategory}`);
      return completeSlides;

    } catch (error) {
      apiLogger.error('Error in unified content generation:', error);
      throw error;
    }
  }

  /**
   * Enhance a slide with the appropriate image
   * @param {Object} slide - Slide object
   * @param {number} slideIndex - Slide index
   * @param {string} prompt - Original prompt
   * @param {string} dominantCategory - Dominant category for all slides
   * @param {Array} specificKeywords - Specific keywords for precise image selection
   * @param {Object} businessContext - Business context for intelligent fallback
   * @param {string} intelligenceMode - Intelligence mode
   * @returns {Promise<Object>} Enhanced slide with image
   */
  async enhanceSlideWithImage(slide, slideIndex, prompt, dominantCategory, specificKeywords = [], businessContext = {}, intelligenceMode = 'normal') {
    try {
      // STRICT category enforcement - use ONLY the dominant category
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
            fontSize: '18px',
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
   * @param {Array} specificKeywords - Specific keywords to match for precise selection
   * @param {Object} businessContext - Business context for intelligent fallback
   * @param {string} intelligenceMode - Intelligence mode
   * @returns {Promise<Object|null>} Selected image
   */
  async selectImageForSlide(imageCategory, slideIndex, prompt, specificKeywords = [], businessContext = {}, intelligenceMode = 'normal') {
    try {
      apiLogger.info(`🎯 Using streamlined image selection for slide ${slideIndex}`);
      
      // Get images for the category
      const categoryKeywords = getCategoryKeywords(imageCategory) || getCategoryKeywords('business');
      
      // Combine category keywords with specific keywords for more precise selection
      const allKeywords = [...new Set([...categoryKeywords, ...specificKeywords])];
      let images = await this.queryImagesByCategoryAndKeywords(imageCategory, allKeywords);
      
      // If no images found, try with broader category keywords
      if (!images || images.length === 0) {
        apiLogger.info(`🎯 No images found for specific keywords: ${specificKeywords.join(', ')}. Trying broader category search...`);
        
        // Get images from the category with broader keywords
        const dominantKeywords = getCategoryKeywords(imageCategory) || getCategoryKeywords('business');
        images = await this.queryImagesByCategoryAndKeywords(imageCategory, dominantKeywords);
        
        if (images && images.length > 0) {
          apiLogger.info(`✅ Found ${images.length} images using category: ${imageCategory}`);
        } else {
          apiLogger.warn(`❌ No images found even with category: ${imageCategory}`);
          return null;
        }
      }

      // Filter out already used images
      const availableImages = images.filter(img => !this.usedImages.has(img.id));
      
      if (availableImages.length === 0) {
        // Reset if we've used more than 80% of available images
        const usedPercentage = this.usedImages.size / images.length;
        if (usedPercentage > 0.8) {
          apiLogger.warn(`Used ${usedPercentage * 100}% of images in category "${imageCategory}". Resetting selection.`);
          this.usedImages.clear();
          
          // Get fresh available images after reset
          const freshAvailableImages = images.filter(img => !this.usedImages.has(img.id));
          if (freshAvailableImages.length > 0) {
            const selectedImage = await this.selectBestMatchingImageWithVisualAnalysis(freshAvailableImages, specificKeywords, slideIndex, prompt, intelligenceMode);
            this.usedImages.add(selectedImage.id);
            apiLogger.debug(`Selected image ${selectedImage.id} for slide ${slideIndex} in category ${imageCategory} (after reset)`);
            return selectedImage;
          }
        }
        
        // If we can't reset or still no available images, pick a random image
        const unusedImages = images.filter(img => !this.usedImages.has(img.id));
        if (unusedImages.length > 0) {
          const selectedImage = await this.selectBestMatchingImageWithVisualAnalysis(unusedImages, specificKeywords, slideIndex, prompt, intelligenceMode);
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
   * Select the best matching image using visual analysis and keyword matching
   * @param {Array} availableImages - Array of available images
   * @param {Array} specificKeywords - Specific keywords to match
   * @param {number} slideIndex - Slide index for logging
   * @param {string} prompt - Original user prompt for visual analysis
   * @param {string} intelligenceMode - Intelligence mode
   * @returns {Promise<Object>} Best matching image
   */
  async selectBestMatchingImageWithVisualAnalysis(availableImages, specificKeywords, slideIndex, prompt, intelligenceMode = 'normal') {
    try {
      // SPEED OPTIMIZATION: Reduce images analyzed based on intelligence mode
      const maxImagesToAnalyze = intelligenceMode === 'max' ? 8 : 4;
      
      // Randomly sample images to avoid always analyzing the same ones
      const imagesToAnalyze = this.getRandomSample(availableImages, maxImagesToAnalyze);
      
      apiLogger.info(`🔍 Analyzing ${imagesToAnalyze.length} images with visual AI for slide ${slideIndex} (${intelligenceMode} mode) - SPEED OPTIMIZED`);
      
      // SPEED OPTIMIZATION: Use keyword-based selection first for speed
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

      // Get all images in the category, then filter by keywords in JavaScript
      let { data: images, error } = await supabase
        .from('images')
        .select('id, title, image_url, category, keywords, description')
        .eq('category', category) // STRICT: Only images in this category
        .limit(200);

      if (error) {
        apiLogger.error(`Error querying images by category "${category}" and keywords:`, error);
        return [];
      }

      // Filter images by keywords in JavaScript (handles array keywords properly)
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

      apiLogger.info(`🎯 Found ${images?.length || 0} images in category "${category}" for keywords: ${searchTerms.join(', ')}`);
      this.categoryCache.set(cacheKey, images || []);
      return images || [];
    } catch (error) {
      apiLogger.error('Error in queryImagesByCategoryAndKeywords:', error);
      return [];
    }
  }

  /**
   * Parse fallback response when JSON parsing fails
   * @param {string} content - AI response content
   * @param {number} slideCount - Expected slide count
   * @param {string} dominantCategory - Dominant category
   * @returns {Array} Parsed slides
   */
  parseFallbackResponse(content, slideCount, dominantCategory = 'business') {
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
    
    if (splitSlides.length > 1) {
      return splitSlides.slice(0, slideCount).map((text, index) => {
        const slideId = `slide-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${index}`;
        return {
          id: slideId,
          texts: [{ 
            id: `text-${slideId}-0`,
            content: text
          }],
          imageCategory: dominantCategory
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
            content: sentence.trim()
          }],
            imageCategory: dominantCategory
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
              content: slideText
            }],
            imageCategory: dominantCategory
          });
        }
        return slides;
      }
    }
  }

  /**
   * Clean slide content to remove JSON metadata and forbidden characters
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
            
            // Remove raw prompt text patterns
            cleanedContent = cleanedContent.replace(/Here are \d+ slides that delve into.*?maintaining an emotive and factual approach:/gi, '');
            cleanedContent = cleanedContent.replace(/Here are \d+ slides about.*?with an intro slide and a conclusion slide/gi, '');
            cleanedContent = cleanedContent.replace(/Here are \d+ slides.*?slides:/gi, '');
            cleanedContent = cleanedContent.replace(/Here are \d+ slides.*?slides/gi, '');
            cleanedContent = cleanedContent.replace(/Five Memorable Date Ideas.*?Create lasting memories with your girlfriend/gi, '');
            cleanedContent = cleanedContent.replace(/Create lasting memories with your girlfriend/gi, '');
            cleanedContent = cleanedContent.replace(/maintaining an emotive and factual approach/gi, '');
            cleanedContent = cleanedContent.replace(/Create lasting memories/gi, '');
            cleanedContent = cleanedContent.replace(/lasting memories/gi, '');
            
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
            
            // Remove any remaining JSON array brackets
            cleanedContent = cleanedContent.replace(/\[\s*\{/g, '').replace(/\}\s*\]/g, '');
            
            // Remove complete JSON objects that might be mixed into content
            cleanedContent = cleanedContent.replace(/\{\s*"texts"\s*:\s*\[[^\]]*\]\s*,\s*"imageCategory"\s*:[^}]*\}/g, '');
            cleanedContent = cleanedContent.replace(/\{\s*"id"\s*:\s*"[^"]*"\s*,\s*"content"\s*:\s*"[^"]*"\s*\}/g, '');
            
            // Remove the specific pattern you mentioned: [{"texts": [{"id": "text-1-1", "content": "..."}]}]
            cleanedContent = cleanedContent.replace(/\[\s*\{\s*"texts"\s*:\s*\[\s*\{\s*"id"\s*:\s*"[^"]*"\s*,\s*"content"\s*:\s*"[^"]*"\s*\}\s*\]\s*\}\s*\]/g, '');
            
            // Remove any remaining JSON array patterns with texts
            cleanedContent = cleanedContent.replace(/\[\s*\{\s*"texts"\s*:\s*\[[^\]]*\]\s*\}\s*\]/g, '');
            
            // Remove JSON array patterns
            cleanedContent = cleanedContent.replace(/\[\s*\{[^}]*\}\s*\]/g, '');
            
            // Remove specific patterns that might be causing the issue
            cleanedContent = cleanedContent.replace(/"texts":\s*\[[^\]]*\]/g, '');
            cleanedContent = cleanedContent.replace(/"id":\s*"[^"]*"/g, '');
            cleanedContent = cleanedContent.replace(/"content":\s*"[^"]*"/g, '');
            cleanedContent = cleanedContent.replace(/"imageCategory":\s*"[^"]*"/g, '');
            cleanedContent = cleanedContent.replace(/"ratio":\s*"[^"]*"/g, '');
            
            // Remove the specific pattern from the user's example
            cleanedContent = cleanedContent.replace(/\{\s*"id":\s*"text-[^"]*",\s*"content":\s*"[^"]*"\s*\}/g, '');
            cleanedContent = cleanedContent.replace(/"texts":\s*\[\s*\{\s*"id":\s*"text-[^"]*",\s*"content":\s*"[^"]*"\s*\}\s*\]/g, '');
            
            // Clean up extra whitespace and commas
            cleanedContent = cleanedContent.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Remove any leading/trailing quotes that might be left
            cleanedContent = cleanedContent.replace(/^["']+|["']+$/g, '');
            
            // Remove forbidden characters: hyphens, semicolons, and colons
            cleanedContent = cleanedContent.replace(/[-;:]/g, '');
            
            // Clean up any double spaces that might result from character removal
            cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
            
            // If content is empty after cleaning, provide a fallback
            if (!cleanedContent || cleanedContent.length < 3) {
              cleanedContent = 'Content';
            }
            
            // Remove "slide content" phrases that might slip through
            cleanedContent = cleanedContent.replace(/slide content/gi, '');
            cleanedContent = cleanedContent.replace(/slide text/gi, '');
            cleanedContent = cleanedContent.replace(/slide information/gi, '');
            cleanedContent = cleanedContent.replace(/slide data/gi, '');
            
            // Additional check: if content still contains problematic patterns, replace with generic content
            if (cleanedContent.includes('Here are') || 
                cleanedContent.includes('slides that') || 
                cleanedContent.includes('maintaining an') ||
                cleanedContent.includes('Create lasting') ||
                cleanedContent.includes('lasting memories') ||
                cleanedContent.includes('slide content') ||
                cleanedContent.includes('slide text') ||
                cleanedContent.includes('"texts"') ||
                cleanedContent.includes('"imageCategory"') ||
                cleanedContent.includes('"ratio"') ||
                cleanedContent.includes('"id"') ||
                cleanedContent.includes('"content"') ||
                cleanedContent.includes('{"texts":') ||
                cleanedContent.includes('"text-1-1"') ||
                cleanedContent.includes('"text-2-1"') ||
                cleanedContent.includes('"text-3-1"') ||
                cleanedContent.includes('text-') ||
                cleanedContent.includes('"id":') ||
                cleanedContent.includes('"content":') ||
                cleanedContent.includes('"imageCategory":') ||
                cleanedContent.includes('"ratio":') ||
                cleanedContent.includes('{') ||
                cleanedContent.includes('}') ||
                cleanedContent.includes('[') ||
                cleanedContent.includes(']')) {
              cleanedContent = 'Content';
            }
            
            text.content = cleanedContent;
          }
          return text;
        });
      }
      return slide;
    });
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.categoryCache.clear();
    this.usedImages.clear();
  }
}

// Export singleton instance
export const unifiedContentEngine = new UnifiedContentEngine();