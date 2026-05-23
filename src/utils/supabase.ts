import { createClient } from '@supabase/supabase-js';

const isDev = process.env.NODE_ENV === 'development';

// Use dev database in development, live in production
const supabaseUrl = isDev 
  ? process.env.NEXT_PUBLIC_SUPABASE_DEV_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey = isDev
  ? process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Service role key for admin operations (bypasses RLS)
const serviceRoleKey = isDev
  ? process.env.SUPABASE_DEV_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'apikey': serviceRoleKey || supabaseKey,
      'Authorization': `Bearer ${serviceRoleKey || supabaseKey}`
    }
  }
});
