/**
 * Server-only Supabase client with service role (bypasses RLS).
 * Required for amply_* tables from API routes.
 */
import dns from 'node:dns';
import { createClient } from '@supabase/supabase-js';
import { Agent, fetch as undiciFetch } from 'undici';

// Vercel/serverless: outbound IPv6 to *.supabase.co can fail → "TypeError: fetch failed".
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const ipv4Agent = new Agent({
  connect: {
    family: 4,
  },
});

function ipv4Fetch(input, init) {
  return undiciFetch(input, {
    ...init,
    dispatcher: ipv4Agent,
  });
}

export function getSupabaseServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: ipv4Fetch,
    },
  });
}

export function isSupabaseServiceConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
