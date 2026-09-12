import { createClient } from '@supabase/supabase-js';

const isDev = process.env.NODE_ENV === 'development';

// Use dev database in development, live in production
const supabaseUrl = isDev 
  ? process.env.NEXT_PUBLIC_SUPABASE_DEV_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey = isDev
  ? process.env.NEXT_PUBLIC_SUPABASE_DEV_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables!');
}

// Anon-key client - safe to bundle into client components (see cache-utils.ts's
// createCachedFunction, which several data-layer modules use to call straight
// through to this client in the browser). The service-role admin client lives
// separately in @/lib/admin-api, imported only by /api/admin/* route handlers -
// this file used to also export its own supabaseAdmin, but it had no callers
// (every admin route already used @/lib/admin-api's) and, being a sibling
// export in this same module, was creating a second GoTrueClient instance
// wherever this file got bundled into the browser.
export const supabase = createClient(supabaseUrl, supabaseKey);
