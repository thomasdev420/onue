export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const nextauthSecret = process.env.NEXTAUTH_SECRET;
  const nextauthUrl = process.env.NEXTAUTH_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const status = {
    openai: {
      present: !!openaiKey,
      validFormat: openaiKey ? openaiKey.startsWith('sk-') : false,
      length: openaiKey ? openaiKey.length : 0
    },
    nextauth: {
      secret: !!nextauthSecret,
      url: !!nextauthUrl
    },
    supabase: {
      url: !!supabaseUrl,
      key: !!supabaseKey
    },
    environment: process.env.NODE_ENV || 'development'
  };

  return Response.json({
    status,
    message: openaiKey ? 
      'Environment variables appear to be configured correctly' : 
      'OPENAI_API_KEY is missing. Please check your Vercel environment variables.',
    recommendations: openaiKey ? [] : [
      'Add OPENAI_API_KEY to your Vercel environment variables',
      'Redeploy your project after adding the environment variable',
      'Make sure the API key starts with "sk-"'
    ]
  });
} 