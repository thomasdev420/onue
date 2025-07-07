import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase configuration check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'none',
      keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      console.warn(`Missing required Supabase environment variables: ${missingVars.join(', ')}. Using placeholder values for development.`);
      
      // Use placeholder values for development
      const placeholderUrl = 'https://placeholder.supabase.co';
      const placeholderKey = 'placeholder_key';
      
      supabaseClient = createClient(placeholderUrl, placeholderKey);
      return supabaseClient;
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