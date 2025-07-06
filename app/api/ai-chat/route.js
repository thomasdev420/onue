import OpenAI from 'openai';

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
    const { prompt, businessContext } = await req.json();

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

    // Add business context if available
    if (businessContext?.companyName) {
      systemPrompt += `\n\nBusiness Context: ${businessContext.companyName} (${businessContext.businessType || 'Business'})`;
      if (businessContext.productInfo) {
        systemPrompt += `\nProduct/Service: ${businessContext.productInfo}`;
      }
      systemPrompt += `\n\nTailor your advice to this business context when relevant.`;
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
    
    if (error.message.includes('API key') || error.message.includes('OPENAI_API_KEY')) {
      return Response.json({ 
        error: 'AI service not configured. Please check your OpenAI API key in environment variables.',
        code: 'MISSING_API_KEY'
      }, { status: 500 });
    }
    
    return Response.json({ 
      error: 'Failed to get AI response. Please try again.',
      code: 'AI_ERROR'
    }, { status: 500 });
  }
} 