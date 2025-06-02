import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfcrtllnklpyqunlhiet.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmY3J0bGxua2xweXF1bmxoaWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NzE0ODYsImV4cCI6MjA2NDQ0NzQ4Nn0.8XNljllW5wiBP8pqTVY6zHlyIyyV4KSXfaR9yTQ3sGU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 