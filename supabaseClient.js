import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isProd = process.env.NODE_ENV === 'production';

    if (!supabaseUrl || !supabaseAnonKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      if (isProd) {
        throw new Error(
          `Supabase is not configured (${missingVars.join(', ')}). Set public URL and anon key — placeholder client is not allowed in production.`,
        );
      }

      console.warn(
        `Missing Supabase env: ${missingVars.join(', ')} — using placeholder client (development only).`,
      );

      supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder_key');
      return supabaseClient;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Supabase configuration check:', {
        hasUrl: true,
        hasKey: true,
        environment: process.env.NODE_ENV,
      });
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// For backward compatibility, export a getter
export const supabase = {
  get client() {
    return getSupabase();
  }
}; 