export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      nextauth: !!process.env.NEXTAUTH_SECRET,
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    missing: []
  };

  // Check for missing critical environment variables
  if (!process.env.OPENAI_API_KEY) {
    health.missing.push('OPENAI_API_KEY');
    health.status = 'warning';
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    health.missing.push('NEXTAUTH_SECRET');
    health.status = 'warning';
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    health.missing.push('SUPABASE_CONFIG');
    health.status = 'warning';
  }

  return Response.json(health);
} 