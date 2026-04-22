import { createClient } from '@supabase/supabase-js';

// Server-side only — never expose SUPABASE_SERVICE_ROLE_KEY to the browser
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
