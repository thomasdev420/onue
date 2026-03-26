/**
 * Server-only Supabase client with service role (bypasses RLS).
 * Required for amply_* tables from API routes.
 */
import dns from 'node:dns';
import { createClient } from '@supabase/supabase-js';

// Vercel/serverless: Node may resolve *.supabase.co to IPv6 first; outbound IPv6 can fail → "fetch failed".
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export function getSupabaseServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseServiceConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
