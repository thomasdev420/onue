import OpenAI from 'openai';

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

    // Create context-aware prompt
    let systemPrompt = `You are Swiftreel, a helpful AI assistant for a content creation platform. Your name is Swiftreel. You can help with:
- Marketing and business advice
- Content strategy
- Content creation
- Creative ideas
- Technical questions about content creation

If users ask about your name, identity, or who you are, always respond that your name is Swiftreel.

Provide helpful, actionable advice in a friendly, professional tone. Keep responses concise but informative (2-5 sentences).`;

    // Add user context if available
    if (userInfo?.name) {
      systemPrompt += `\n\nUser Context: You are speaking with ${userInfo.name}`;
      if (userInfo.email) {
        systemPrompt += ` (${userInfo.email})`;
      }
      systemPrompt += `. Personalize your responses to be more engaging and relevant to this specific user.`;
    }

    // Add comprehensive business and user context if available
    if (businessContext) {
      systemPrompt += `\n\nBusiness Context:`;
      
      if (businessContext.companyName) {
        systemPrompt += `\n- Company: ${businessContext.companyName}`;
      }
      if (businessContext.businessType) {
        systemPrompt += `\n- Business Type: ${businessContext.businessType}`;
      }
      if (businessContext.productInfo) {
        systemPrompt += `\n- Product/Service: ${businessContext.productInfo}`;
      }
      if (businessContext.websiteUrl) {
        systemPrompt += `\n- Website: ${businessContext.websiteUrl}`;
      }
      
      // Add personalization context
      if (businessContext.personalization) {
        systemPrompt += `\n\nUser Profile:`;
        const personalization = businessContext.personalization;
        
        if (personalization.interests) {
          systemPrompt += `\n- Interests: ${personalization.interests}`;
        }
        if (personalization.goals) {
          systemPrompt += `\n- Main Goal: ${personalization.goals}`;
        }
        if (personalization.role) {
          systemPrompt += `\n- Role: ${personalization.role}`;
        }
        if (personalization.experienceLevel) {
          systemPrompt += `\n- Experience Level: ${personalization.experienceLevel}`;
        }
        if (personalization.timeCommitment) {
          systemPrompt += `\n- Time Commitment: ${personalization.timeCommitment}`;
        }
        if (personalization.targetAudience) {
          systemPrompt += `\n- Target Audience: ${personalization.targetAudience}`;
        }
      }
      
      systemPrompt += `\n\nUse this comprehensive context to provide highly personalized, relevant advice that matches the user's business, goals, and experience level.`;
    }

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
          content: prompt
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