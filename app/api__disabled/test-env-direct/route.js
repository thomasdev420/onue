export async function GET() {
  // This runs within Next.js context, so it should have access to .env.local
  const envVars = {
    OPENAI_API_KEY: {
      present: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      startsWithSk: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false,
      prefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'none'
    },
    NEXTAUTH_SECRET: {
      present: !!process.env.NEXTAUTH_SECRET,
      length: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0
    },
    NEXTAUTH_URL: {
      present: !!process.env.NEXTAUTH_URL,
      value: process.env.NEXTAUTH_URL || 'none'
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'none'
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0
    },
    NODE_ENV: process.env.NODE_ENV || 'development'
  };

  return Response.json({
    message: 'Environment variables check from Next.js API route',
    timestamp: new Date().toISOString(),
    environment: envVars,
    summary: {
      openaiConfigured: envVars.OPENAI_API_KEY.present && envVars.OPENAI_API_KEY.startsWithSk,
      nextauthConfigured: envVars.NEXTAUTH_SECRET.present && envVars.NEXTAUTH_URL.present,
      supabaseConfigured: envVars.NEXT_PUBLIC_SUPABASE_URL.present && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.present
    }
  });
} 