import OpenAI from 'openai';
import { buildContextAwarePrompt } from '../../utils/contextPriority.js';
import { 
  extractMemoryInsights, 
  storeMemoryInsights, 
  retrieveUserMemory, 
  buildMemoryContext 
} from '../../services/aiMemoryService.js';
// Removed clarification system imports to allow natural conversation
import { getModelConfig } from '../../utils/modelSelection.js';
import { getIntelligenceMode } from '../../services/userSettingsService.js';

// Lazy initialization to avoid build-time errors
let openai = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('OpenAI API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : 'none',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function POST(req) {
  try {
    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    let prompt, businessContext, userInfo;
    try {
      ({ prompt, businessContext, userInfo } = JSON.parse(rawBody));
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      return Response.json({
        error: 'Malformed JSON in request body',
        details: parseError.message,
        rawBody
      }, { status: 400 });
    }

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // In development mode, bypass authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      // Temporarily allow all requests in production until auth is properly configured
      // TODO: Implement proper authentication check when NEXTAUTH_SECRET is set
      if (!process.env.NEXTAUTH_SECRET) {
        console.warn('NEXTAUTH_SECRET not set - allowing all requests');
      }
    }

    // Get user email for memory system and settings
    let userEmail = null;
    if (userInfo?.email) {
      userEmail = userInfo.email;
    } else if (process.env.NODE_ENV === 'development') {
      userEmail = 'dev@local.com';
    }

    // Get user's intelligence mode setting
    let intelligenceMode = 'normal'; // Default fallback
    if (userEmail) {
      try {
        intelligenceMode = await getIntelligenceMode(userEmail);
        console.log(`Using intelligence mode: ${intelligenceMode} for user: ${userEmail}`);
      } catch (error) {
        console.warn(`Failed to get intelligence mode for user ${userEmail}, using default:`, error.message);
      }
    }

    // Use the original prompt directly - no clarification restrictions
    let finalPrompt = prompt;

    // Extract and store memory insights from user input
    if (userEmail && finalPrompt) {
      const insights = extractMemoryInsights(finalPrompt, { businessContext, userInfo });
      if (insights.length > 0) {
        await storeMemoryInsights(userEmail, insights);
        console.log(`Extracted ${insights.length} memory insights from user input`);
      }
    }

    // Retrieve user memory for context
    let userMemory = [];
    if (userEmail) {
      userMemory = await retrieveUserMemory(userEmail);
      console.log(`Retrieved ${userMemory.length} memory records for user`);
    }

    // Build a more conversational and natural system prompt
    const context = {
      businessContext,
      userInfo
    };
    
    let systemPrompt = `You are flightmedia – a friendly, helpful AI content creator assistant. You can chat naturally about any topic and provide helpful, accurate information. You're knowledgeable about marketing and content creation. Be conversational, engaging, and genuinely helpful.`;
    
    // Add memory context if available
    if (userMemory.length > 0) {
      const memoryContext = buildMemoryContext(userMemory, finalPrompt);
      systemPrompt += memoryContext;
    }
    
    // Add business context if available (but don't force it)
    if (context.businessContext) {
      const bc = context.businessContext;
      if (bc.companyName || bc.businessType) {
        systemPrompt += `\n\nUser's business context: ${bc.companyName || ''} ${bc.businessType || ''}`.trim();
      }
    }

    const openaiClient = getOpenAI();
    
    // Get model configuration based on user's intelligence mode
    const modelConfig = getModelConfig(intelligenceMode, finalPrompt, { businessContext, userInfo }, 'chat');
    console.log(`Using model config for ${intelligenceMode} mode:`, {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens
    });
    
    const completion = await openaiClient.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: finalPrompt
        }
      ],
      max_tokens: modelConfig.max_tokens,
      temperature: modelConfig.temperature,
      top_p: modelConfig.top_p,
      frequency_penalty: modelConfig.frequency_penalty,
      presence_penalty: modelConfig.presence_penalty,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    return Response.json({ response });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    
    // Check if it's specifically a missing API key error
    if (error.message === 'OPENAI_API_KEY environment variable is required') {
      return Response.json({ 
        error: 'AI service not configured. Please check your OpenAI API key in environment variables. If you just added it, please redeploy your project.',
        code: 'MISSING_API_KEY',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        instructions: 'Go to Vercel Dashboard → Project Settings → Environment Variables → Add OPENAI_API_KEY'
      }, { status: 500 });
    }
    
    // Check for OpenAI API errors
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return Response.json({ 
        error: 'Invalid OpenAI API key. Please check your API key in Vercel environment variables.',
        code: 'INVALID_API_KEY',
        environment: process.env.NODE_ENV
      }, { status: 500 });
    }
    
    // Return the actual error message for debugging
    return Response.json({ 
      error: `Failed to get AI response: ${error.message}`,
      code: 'AI_ERROR',
      details: error.message,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 