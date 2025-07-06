import OpenAI from 'openai';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return Response.json({
        error: 'OPENAI_API_KEY is missing',
        status: 'missing_key'
      }, { status: 500 });
    }

    if (!apiKey.startsWith('sk-')) {
      return Response.json({
        error: 'OPENAI_API_KEY format is invalid (should start with sk-)',
        status: 'invalid_format',
        keyPrefix: apiKey.substring(0, 10) + '...'
      }, { status: 500 });
    }

    // Test OpenAI connection
    const openai = new OpenAI({ apiKey });
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Say 'Hello, AI is working!'"
          }
        ],
        max_tokens: 10,
      });

      const response = completion.choices[0]?.message?.content;

      return Response.json({
        success: true,
        message: 'OpenAI API is working correctly',
        response: response,
        model: completion.model,
        usage: completion.usage
      });

    } catch (openaiError) {
      return Response.json({
        error: 'OpenAI API call failed',
        status: 'api_error',
        details: openaiError.message,
        code: openaiError.code || 'unknown'
      }, { status: 500 });
    }

  } catch (error) {
    return Response.json({
      error: 'Debug endpoint error',
      status: 'debug_error',
      details: error.message
    }, { status: 500 });
  }
} 