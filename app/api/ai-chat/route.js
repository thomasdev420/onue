import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { prompt, businessContext } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // In development mode, bypass authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      // Check authentication in production
      // This would typically check for a valid session
      // For now, we'll allow all requests
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

    const completion = await openai.chat.completions.create({
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
    
    if (error.message.includes('API key')) {
      return Response.json({ error: 'AI service not configured' }, { status: 500 });
    }
    
    return Response.json({ 
      error: 'Failed to get AI response. Please try again.' 
    }, { status: 500 });
  }
} 