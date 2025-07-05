import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 