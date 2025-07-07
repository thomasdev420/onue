import OpenAI from 'openai';
import { getServerSession } from 'next-auth/next';

// Define authOptions inline to match the ProductionSessionProvider
const authOptions = {
  providers: [
    {
      id: "google",
      name: "Google",
      type: "oauth",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
        },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://www.googleapis.com/oauth2/v2/userinfo",
    },
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign in attempt:', { user: user?.email, provider: account?.provider });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  }
};
import { buildContextAwarePrompt } from '../../utils/contextPriority.js';
import { 
  extractMemoryInsights, 
  storeMemoryInsights, 
  retrieveUserMemory, 
  buildMemoryContext 
} from '../../services/aiMemoryService.js';
import { 
  analyzePromptClarity, 
  generateClarificationResponse, 
  isClarificationResponse,
  extractClarifiedInformation,
  buildEnhancedPrompt
} from '../../utils/clarificationSystem.js';

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

export async function POST(req) {
  try {
    const { prompt, slideCount = 5, businessContext, userInfo, forceGenerate, isClarificationFollowup, originalAnalysis } = await req.json();

    // If forceGenerate is true, always generate slides and skip clarification
    if (forceGenerate) {
      const context = { businessContext, userInfo };
      let systemPrompt = buildContextAwarePrompt(context, prompt);
      systemPrompt += `\n\nIMPORTANT: YOU MUST RETURN A VALID JSON ARRAY ONLY. No explanations, no markdown, no --- separators, no extra formatting, just the JSON array.\n\nExample format:\n[\n  {\n    "texts": [\n      { "content": "Otters are playful mammals...", "position": { "x": 50, "y": 60 } }\n    ],\n    "imageCategory": "business"\n  }\n]\n`;
      systemPrompt += `\nCreate ${slideCount} engaging slides based on the user's request. Each slide should be a separate object in the array. Do not use markdown, dashes, or explanations.`;
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      let slides = [];
      try {
        slides = JSON.parse(completion.choices[0].message.content);
        if (!Array.isArray(slides)) throw new Error('Not an array');
      } catch (e) {
        // Try to split the content into slides if possible, or wrap as a single slide
        const content = completion.choices[0].message.content;
        // Try to split by '---' or '**Slide' or numbered slides
        let splitSlides = [];
        if (content.includes('---')) {
          splitSlides = content.split(/---+/).map(s => s.trim()).filter(Boolean);
        } else if (content.match(/\*\*Slide \d+/)) {
          splitSlides = content.split(/\*\*Slide \d+:/).map(s => s.trim()).filter(Boolean);
        } else if (content.match(/Slide \d+:/)) {
          splitSlides = content.split(/Slide \d+:/).map(s => s.trim()).filter(Boolean);
        }
        if (splitSlides.length > 1) {
          slides = splitSlides.map(text => ({
            texts: [{ content: text, position: { x: 50, y: 60 } }],
            imageCategory: 'business'
          }));
        } else {
          slides = [{
            texts: [{ content, position: { x: 50, y: 60 } }],
            imageCategory: 'business'
          }];
        }
      }
      // Ensure every slide has a unique id
      slides = slides.map((slide, idx) => ({
        id: slide.id || `slide-${Date.now()}-${idx}`,
        ...slide
      }));
      return Response.json({ slides });
    }

    // Otherwise, use the existing clarification logic (for ChatBar)
    // ... (existing code for clarification logic here) ...
    // (You can keep your previous logic for ChatBar requests)

    // Validate required fields
    if (!prompt) {
      return Response.json({ 
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      }, { status: 400 });
    }

    if (!slideCount || slideCount < 1 || slideCount > 20) {
      return Response.json({ 
        error: 'Slide count must be between 1 and 20',
        code: 'INVALID_SLIDE_COUNT'
      }, { status: 400 });
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      return Response.json({ 
        error: 'Prompt too long. Maximum 2000 characters allowed.',
        code: 'PROMPT_TOO_LONG'
      }, { status: 400 });
    }

    // Check authentication in production
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      // Temporarily allow all requests in production until auth is properly configured
      // TODO: Implement proper authentication check when NEXTAUTH_SECRET is set
      if (!process.env.NEXTAUTH_SECRET) {
        console.warn('NEXTAUTH_SECRET not set - allowing all requests');
      } else {
        const session = await getServerSession(authOptions);
        if (!session) {
          return Response.json({ 
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          }, { status: 401 });
        }
      }
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return Response.json({ 
        error: 'AI service not configured',
        code: 'SERVICE_UNAVAILABLE'
      }, { status: 500 });
    }

    // Get user email for memory system
    let userEmail = null;
    if (userInfo?.email) {
      userEmail = userInfo.email;
    } else if (process.env.NODE_ENV === 'development') {
      userEmail = 'dev@local.com';
    }

    // Extract and store memory insights from user input
    if (userEmail && prompt) {
      const insights = extractMemoryInsights(prompt, { businessContext, userInfo });
      if (insights.length > 0) {
        await storeMemoryInsights(userEmail, insights);
        console.log(`Extracted ${insights.length} memory insights from slide generation request`);
      }
    }

    // Retrieve user memory for context
    let userMemory = [];
    if (userEmail) {
      userMemory = await retrieveUserMemory(userEmail);
      console.log(`Retrieved ${userMemory.length} memory records for slide generation`);
    }

    // Extract comprehensive business context
    const companyName = businessContext?.companyName || 'Business';
    const businessType = businessContext?.businessType || 'General Business';
    const productInfo = businessContext?.productInfo || 'Not specified';
    const websiteUrl = businessContext?.websiteUrl;
    const personalization = businessContext?.personalization;

    console.log('User prompt:', prompt);
    console.log('Business context:', { companyName, businessType, productInfo, websiteUrl, personalization });
    console.log('User memory count:', userMemory.length);

    // Build context-aware system prompt with proper priority
    const context = {
      businessContext,
      userInfo
    };
    
    let systemPrompt = buildContextAwarePrompt(context, prompt);
    
    // Add memory context if available
    if (userMemory.length > 0) {
      const memoryContext = buildMemoryContext(userMemory, prompt);
      systemPrompt += memoryContext;
    }
    
    // Add slide-specific instructions
    systemPrompt += `\n\nYou are an expert content creator for social media slides. Create ${slideCount} engaging slides based on the user's request.

Rules:
- First slide: Title/overview (no number prefix)
- Other slides: Number prefix (e.g., "1. Your content")
- Text position: x=50, y=60 (just below center)
- No semicolons or dashes
- No '#', ':' or '-' in the content EVER
- Rich, specific content (100-300 chars)
- Choose appropriate imageCategory from: business, technology, success, motivation, growth, creativity, social_media, entrepreneurship, marketing, lifestyle

YOU MUST RETURN VALID JSON ONLY. No explanations, no markdown, just the JSON array.

Example format:
[{"texts":[{"content":"Your content here","position":{"x":50,"y":60}}],"imageCategory":"business"}]

IMPORTANT: Use the user's stored creative preferences and style directions to enhance your slide content, but always prioritize their current explicit request. If they ask for something different from their usual style, respect their current choice.`;

    // Generate slide content using OpenAI with enhanced prompt
    const openaiClient = getOpenAI();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI service');
    }

    console.log('AI response:', responseText);

    let slides = [];

    try {
      // Try to parse JSON directly first
      slides = JSON.parse(responseText);
      
      // Validate the parsed data
      if (!Array.isArray(slides)) {
        throw new Error('Response is not an array');
      }
      
      if (slides.length !== slideCount) {
        console.warn(`Expected ${slideCount} slides, got ${slides.length}`);
      }
      
      // Validate each slide structure
      slides = slides.map((slide, index) => {
        if (!slide || typeof slide !== 'object') {
          throw new Error(`Invalid slide structure at index ${index}`);
        }
        
        // Ensure required fields exist
        const validatedSlide = {
          id: slide.id || `${Date.now()}-${index}-${Math.floor(Math.random() * 1000000)}`,
          texts: Array.isArray(slide.texts) ? slide.texts : [],
          imageCategory: slide.imageCategory || 'business'
        };
        
        // Validate texts array
        validatedSlide.texts = validatedSlide.texts.map((text, textIndex) => {
          if (!text || typeof text !== 'object') {
            throw new Error(`Invalid text structure at slide ${index}, text ${textIndex}`);
          }
          
          return {
            id: text.id || `${Date.now()}-${index}-${textIndex}-${Math.floor(Math.random() * 1000000)}`,
            content: text.content || 'Default text',
            position: {
              x: typeof text.position?.x === 'number' ? text.position.x : 50,
              y: typeof text.position?.y === 'number' ? text.position.y : 50
            }
          };
        });
        
        return validatedSlide;
      });
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', responseText);
      
      return Response.json({ 
        error: 'AI generated invalid content. Please try again with a different prompt.',
        code: 'INVALID_AI_RESPONSE',
        details: 'The AI response could not be parsed. This usually means the AI didn\'t follow the format instructions.'
      }, { status: 500 });
    }

    console.log('Processing slides with images...');

    // Process each slide and select relevant images
    const processedSlides = await Promise.all(
      slides.map(async (slide, index) => {
        try {
          // Apply smart text positioning
          const { applySmartPositioning } = await import('../../../app/utils/textPositioning.js');
          const positionedSlide = applySmartPositioning(slide);
          
          return {
            ...positionedSlide,
            image: null, // Will be selected by the UI based on imageCategory
            ratio: '9:16' // Default ratio
          };
        } catch (error) {
          console.error(`Error processing slide ${index}:`, error);
          return {
            ...slide,
            image: null,
            ratio: '9:16'
          };
        }
      })
    );

    return Response.json({ 
      slides: processedSlides,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Error in generate-slides API:', error);
    
    // Handle specific OpenAI errors
    if (error.message.includes('API key')) {
      return Response.json({ 
        error: 'AI service not configured',
        code: 'SERVICE_UNAVAILABLE'
      }, { status: 500 });
    }
    
    if (error.message.includes('rate limit')) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT'
      }, { status: 429 });
    }
    
    if (error.message.includes('quota')) {
      return Response.json({ 
        error: 'Service quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED'
      }, { status: 429 });
    }
    
    return Response.json({ 
      error: 'Failed to generate slides. Please try again.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
} 