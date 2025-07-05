import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { prompt, slideCount = 5, businessContext } = await req.json();

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
      const session = await getServerSession(authOptions);
      if (!session) {
        return Response.json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }, { status: 401 });
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

    // Extract business context
    const companyName = businessContext?.companyName || 'Business';
    const businessType = businessContext?.businessType || 'General Business';
    const productInfo = businessContext?.productInfo || 'Not specified';

    console.log('User prompt:', prompt);
    console.log('Business context:', { companyName, businessType, productInfo });

    // Generate slide content using OpenAI with enhanced prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content creator for social media slides. Create ${slideCount} engaging slides based on the user's specific request.

          CRITICAL: The user's prompt is the most important instruction. Create content that directly addresses what they asked for.

          Business Context: ${companyName} (${businessType}) - ${productInfo}

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

          IMPORTANT: If the user asks for "dogs", create content about dogs. If they ask for "marketing tips", create marketing tips. Always match their specific request.`
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