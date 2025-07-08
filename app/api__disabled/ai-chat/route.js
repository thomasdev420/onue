import OpenAI from 'openai';
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
    let prompt, businessContext, userInfo, isClarificationFollowup, originalAnalysis;
    try {
      ({ prompt, businessContext, userInfo, isClarificationFollowup, originalAnalysis } = JSON.parse(rawBody));
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

    // Get user email for memory system
    let userEmail = null;
    if (userInfo?.email) {
      userEmail = userInfo.email;
    } else if (process.env.NODE_ENV === 'development') {
      userEmail = 'dev@local.com';
    }

    // Handle clarification logic
    let finalPrompt = prompt;
    let clarificationResponse = null;
    
    // If this is a follow-up to a clarification, extract information and enhance the prompt
    if (isClarificationFollowup && originalAnalysis) {
      const clarifiedInfo = extractClarifiedInformation(prompt, originalAnalysis);
      finalPrompt = buildEnhancedPrompt(originalAnalysis.originalPrompt || prompt, clarifiedInfo, { businessContext, userInfo });
      console.log('Enhanced prompt with clarified information:', { original: prompt, enhanced: finalPrompt });
    } else {
      // Analyze prompt for clarity
      const analysis = analyzePromptClarity(prompt, { businessContext, userInfo });
      
      if (analysis.needsClarification) {
        clarificationResponse = generateClarificationResponse(analysis, prompt, { businessContext, userInfo });
        console.log('Prompt needs clarification:', { analysis, clarificationResponse });
        
        return Response.json({ 
          response: clarificationResponse,
          needsClarification: true,
          analysis: {
            ...analysis,
            originalPrompt: prompt
          }
        });
      }
    }

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

    // Build context-aware system prompt with proper priority
    const context = {
      businessContext,
      userInfo
    };
    
    let systemPrompt = buildContextAwarePrompt(context, finalPrompt);
    
    // Add memory context if available
    if (userMemory.length > 0) {
      const memoryContext = buildMemoryContext(userMemory, finalPrompt);
      systemPrompt += memoryContext;
    }
    
    // Add Swiftreel-specific instructions
    systemPrompt += `\n\nYour name is Swiftreel. If users ask about your name, identity, or who you are, always respond that your name is Swiftreel.
    
Provide helpful, actionable advice in a friendly, professional tone. Keep responses concise but informative (2-5 sentences).

IMPORTANT: Use the user's stored preferences and creative directions to enhance your responses, but always prioritize their current explicit request. If they ask for something different from their usual preferences, respect their current choice.

CLARIFICATION GUIDANCE: If a user provides additional details after you ask for clarification, acknowledge their response and provide a comprehensive answer based on their clarified request.`;

    const openaiClient = getOpenAI();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
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
      max_tokens: 300,
      temperature: 0.7,
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